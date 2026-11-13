import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "", maxlength: 1000 },
  verified: { type: Boolean, default: false }, // user has an order containing this product
  date: { type: Number, required: true },
});
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export default mongoose.models.review || mongoose.model("review", reviewSchema);
