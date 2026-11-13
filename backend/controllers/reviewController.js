import mongoose from "mongoose";
import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { cacheDelPrefix } from "../config/redis.js";

export const listReviews = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(200).json({ success: true, reviews: [] });
  const reviews = await reviewModel.find({ productId }).sort({ date: -1 }).limit(50).lean();
  res.status(200).json({ success: true, reviews });
};

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const r = Math.round(Number(rating));
    if (!mongoose.Types.ObjectId.isValid(productId) || !(r >= 1 && r <= 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    const [user, product, bought] = await Promise.all([
      userModel.findById(req.userId).select("name").lean(),
      productModel.findById(productId).select("_id").lean(),
      orderModel.exists({ userId: req.userId, "items.productId": productId, status: { $ne: "Cancelled" } }),
    ]);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await reviewModel.findOneAndUpdate(
      { productId, userId: req.userId },
      { productId, userId: req.userId, userName: user.name, rating: r, comment: (comment || "").slice(0, 1000), verified: !!bought, date: Date.now() },
      { upsert: true, new: true }
    );

    const [agg] = await reviewModel.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]);
    await productModel.updateOne({ _id: productId }, { $set: { rating: Math.round(agg.avg * 10) / 10, ratingCount: agg.n } });
    await cacheDelPrefix("products:");
    res.status(200).json({ success: true, message: "Thanks for your review!" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
