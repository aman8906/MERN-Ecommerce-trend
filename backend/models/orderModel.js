import mongoose from "mongoose";

export const ORDER_STATUSES = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  items: [
    {
      productId: String,
      name: String,
      image: String,
      price: Number,
      mrp: Number,
      size: String,
      quantity: Number,
    },
  ],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  paymentMethod: { type: String, enum: ["cod", "stripe", "razorpay"], required: true },
  payment: { type: Boolean, default: false },
  status: { type: String, enum: ORDER_STATUSES, default: "Order Placed" },
  stripeSessionId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  date: { type: Number, required: true },
});

orderSchema.index({ date: -1 });

export default mongoose.models.order || mongoose.model("order", orderSchema);
