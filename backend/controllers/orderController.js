import crypto from "crypto";
import mongoose from "mongoose";
import Stripe from "stripe";
import Razorpay from "razorpay";
import orderModel, { ORDER_STATUSES } from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { deliveryFeeFor } from "../utils/pricing.js";
import { publishEvents } from "../services/eventBus.js";
import { getTrending } from "../services/trending.js";
import { cacheDelPrefix } from "../config/redis.js";

const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};
const razorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID) throw new Error("Razorpay is not configured");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

class OrderError extends Error {}

/** Builds order lines from DB prices (the client price is NEVER trusted) and validates stock. */
const buildItems = async (rawItems) => {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new OrderError("Your cart is empty");
  const ids = [...new Set(rawItems.map((i) => i.productId))].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const products = await productModel.find({ _id: { $in: ids }, isActive: true }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const wanted = new Map(); // productId -> total qty (across sizes)
  const items = rawItems.map((i) => {
    const p = byId.get(String(i.productId));
    const quantity = Math.min(10, Math.floor(Number(i.quantity)));
    if (!p || !(quantity > 0)) throw new OrderError("Some items in your cart are no longer available");
    wanted.set(String(p._id), (wanted.get(String(p._id)) || 0) + quantity);
    return { productId: String(p._id), name: p.name, image: p.image[0], price: p.price, mrp: p.mrp || p.price, size: i.size || "", quantity };
  });
  for (const [id, qty] of wanted) {
    const p = byId.get(id);
    if (p.stock < qty) throw new OrderError(p.stock === 0 ? `"${p.name}" is out of stock` : `Only ${p.stock} left of "${p.name}"`);
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal);
  return { items, subtotal, deliveryFee, amount: subtotal + deliveryFee, wanted };
};

const validateAddress = (a = {}) => {
  const need = ["firstName", "lastName", "street", "city", "state", "zipcode", "phone"];
  for (const k of need) if (!String(a[k] || "").trim()) throw new OrderError("Please fill in the complete address");
  if (!/^\d{10}$/.test(String(a.phone))) throw new OrderError("Enter a valid 10-digit mobile number");
  if (!/^\d{6}$/.test(String(a.zipcode))) throw new OrderError("Enter a valid 6-digit pincode");
};

/** Atomically reserves stock; rolls back if any line fails (prevents overselling). */
const reserveStock = async (wanted) => {
  const done = [];
  try {
    for (const [id, qty] of wanted) {
      const r = await productModel.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (!r.modifiedCount) throw new OrderError("Sorry, an item just went out of stock");
      done.push([id, qty]);
    }
  } catch (e) {
    await Promise.all(done.map(([id, qty]) => productModel.updateOne({ _id: id }, { $inc: { stock: qty } })));
    throw e;
  }
};

const releaseStock = async (order) => {
  await Promise.all(order.items.map((i) => productModel.updateOne({ _id: i.productId }, { $inc: { stock: i.quantity } })));
  await cacheDelPrefix("products:");
};

const emitPurchase = (order) =>
  publishEvents(order.items.map((i) => ({ type: "purchase", productId: i.productId, qty: i.quantity, userId: order.userId })));

const createOrder = async (req, method) => {
  validateAddress(req.body.address);
  const built = await buildItems(req.body.items);
  await reserveStock(built.wanted);
  const order = await orderModel.create({
    userId: req.userId, items: built.items, subtotal: built.subtotal, deliveryFee: built.deliveryFee,
    amount: built.amount, address: req.body.address, paymentMethod: method, payment: false, date: Date.now(),
  });
  await cacheDelPrefix("products:");
  return order;
};

const fail = (res, e) =>
  e instanceof OrderError
    ? res.status(400).json({ success: false, message: e.message })
    : (console.log("Order error:", e), res.status(500).json({ success: false, message: e.message }));

// ---------- Cash on delivery ----------
export const placeOrderCOD = async (req, res) => {
  try {
    const order = await createOrder(req, "cod");
    await userModel.updateOne({ _id: req.userId }, { $set: { cartData: {} } });
    emitPurchase(order);
    res.status(201).json({ success: true, message: "Order placed", orderId: order._id });
  } catch (e) { fail(res, e); }
};

// ---------- Stripe ----------
export const placeOrderStripe = async (req, res) => {
  try {
    const s = stripe();
    const order = await createOrder(req, "stripe");
    const origin = process.env.FRONTEND_URL || req.headers.origin;
    const line_items = order.items.map((i) => ({
      price_data: { currency: "inr", product_data: { name: i.name }, unit_amount: Math.round(i.price * 100) },
      quantity: i.quantity,
    }));
    if (order.deliveryFee) {
      line_items.push({ price_data: { currency: "inr", product_data: { name: "Delivery charges" }, unit_amount: order.deliveryFee * 100 }, quantity: 1 });
    }
    const session = await s.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${order._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${order._id}`,
      line_items, mode: "payment",
    });
    await orderModel.updateOne({ _id: order._id }, { $set: { stripeSessionId: session.id } });
    res.status(201).json({ success: true, session_url: session.url });
  } catch (e) { fail(res, e); }
};

export const verifyStripe = async (req, res) => {
  try {
    const { orderId, success } = req.body;
    const order = await orderModel.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.payment) return res.status(200).json({ success: true });

    let paid = false;
    if (success === "true" || success === true) {
      const session = await stripe().checkout.sessions.retrieve(order.stripeSessionId); // verify with Stripe, not the URL
      paid = session.payment_status === "paid";
    }
    if (paid) {
      order.payment = true;
      await order.save();
      await userModel.updateOne({ _id: req.userId }, { $set: { cartData: {} } });
      emitPurchase(order);
      return res.status(200).json({ success: true });
    }
    if (order.status !== "Cancelled") { order.status = "Cancelled"; await order.save(); await releaseStock(order); }
    res.status(200).json({ success: false, message: "Payment failed or cancelled" });
  } catch (e) { fail(res, e); }
};

// ---------- Razorpay ----------
export const placeOrderRazorpay = async (req, res) => {
  try {
    const rz = razorpay();
    const order = await createOrder(req, "razorpay");
    const rzOrder = await rz.orders.create({ amount: Math.round(order.amount * 100), currency: "INR", receipt: String(order._id) });
    await orderModel.updateOne({ _id: order._id }, { $set: { razorpayOrderId: rzOrder.id } });
    res.status(201).json({ success: true, order: rzOrder, orderId: order._id, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) { fail(res, e); }
};

export const verifyRazorpay = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await orderModel.findOne({ _id: orderId, userId: req.userId });
    if (!order || order.razorpayOrderId !== razorpay_order_id) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.payment) return res.status(200).json({ success: true });

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }
    order.payment = true;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
    await userModel.updateOne({ _id: req.userId }, { $set: { cartData: {} } });
    emitPurchase(order);
    res.status(200).json({ success: true, message: "Payment successful" });
  } catch (e) { fail(res, e); }
};

/** User closed the Razorpay popup / payment failed: free the reserved stock */
export const cancelUnpaid = async (req, res) => {
  const order = await orderModel.findOne({ _id: req.body.orderId, userId: req.userId });
  if (order && !order.payment && order.paymentMethod !== "cod" && order.status !== "Cancelled") {
    order.status = "Cancelled";
    await order.save();
    await releaseStock(order);
  }
  res.status(200).json({ success: true });
};

// ---------- Customer ----------
// Unpaid online-payment attempts are hidden; only COD orders and paid orders are real orders
const REAL_ORDER = { $or: [{ paymentMethod: "cod" }, { payment: true }] };

export const userOrders = async (req, res) => {
  const orders = await orderModel.find({ userId: req.userId, ...REAL_ORDER }).sort({ date: -1 }).limit(50).lean();
  res.status(200).json({ success: true, orders });
};

export const cancelOrder = async (req, res) => {
  const order = await orderModel.findOne({ _id: req.body.orderId, userId: req.userId });
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  if (order.status !== "Order Placed") {
    return res.status(400).json({ success: false, message: "This order can no longer be cancelled" });
  }
  order.status = "Cancelled";
  await order.save();
  await releaseStock(order);
  res.status(200).json({ success: true, message: "Order cancelled" });
};

// ---------- Admin ----------
export const allOrders = async (req, res) => {
  const orders = await orderModel.find(REAL_ORDER).sort({ date: -1 }).limit(300).lean();
  res.status(200).json({ success: true, orders });
};

export const updateStatus = async (req, res) => {
  const { orderId, status } = req.body;
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
  const order = await orderModel.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  const wasCancelled = order.status === "Cancelled";
  order.status = status;
  if (status === "Delivered" && order.paymentMethod === "cod") order.payment = true; // cash collected
  await order.save();
  if (status === "Cancelled" && !wasCancelled) await releaseStock(order);
  res.status(200).json({ success: true, message: "Status updated" });
};

export const dashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const valid = { status: { $ne: "Cancelled" }, $or: [{ payment: true }, { paymentMethod: "cod" }] };

    const [revenueAgg, todayAgg, byStatus, userCount, productCount, lowStock, topSelling, recentOrders, trending] = await Promise.all([
      orderModel.aggregate([{ $match: valid }, { $group: { _id: null, revenue: { $sum: "$amount" }, orders: { $sum: 1 } } }]),
      orderModel.aggregate([{ $match: { ...valid, date: { $gte: startOfDay.getTime() } } }, { $group: { _id: null, revenue: { $sum: "$amount" }, orders: { $sum: 1 } } }]),
      orderModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      userModel.countDocuments(),
      productModel.countDocuments(),
      productModel.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select("name stock image").lean(),
      productModel.find({ sold: { $gt: 0 } }).sort({ sold: -1 }).limit(5).select("name sold image price").lean(),
      orderModel.find(REAL_ORDER).sort({ date: -1 }).limit(6).lean(),
      getTrending({ limit: 5 }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        revenue: revenueAgg[0]?.revenue || 0,
        orders: revenueAgg[0]?.orders || 0,
        todayRevenue: todayAgg[0]?.revenue || 0,
        todayOrders: todayAgg[0]?.orders || 0,
        users: userCount,
        products: productCount,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        lowStock, topSelling, recentOrders,
        trending: trending.map((p) => ({ _id: p._id, name: p.name, image: p.image, trendScore: Math.round(p.trendScore * 10) / 10, views: p.views, sold: p.sold })),
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
