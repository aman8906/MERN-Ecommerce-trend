import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }, // selling price
  mrp: { type: Number, default: 0 }, // original price (for "% off")
  discountPercent: { type: Number, default: 0 },
  image: {
  type: [String],
  required: true,
  validate: {
    validator: (images) => images.length > 0,
    message: "At least one product image is required",
  },
},
  category: { type: String, required: true },
  subCategory: { type: String, default: "" },
  brand: { type: String, default: "", trim: true },
  tags: { type: [String], default: [] },
  sizes: { type: Array, default: [] }, // empty = one-size / not applicable
  stock: { type: Number, default: 100, min: 0 },
  bestSeller: { type: Boolean, default: false },
  trendingPin: { type: Boolean, default: false }, // admin can boost into "Trending now"
  isActive: { type: Boolean, default: true },

  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // counters maintained by the Kafka consumer
  views: { type: Number, default: 0 },
  cartAdds: { type: Number, default: 0 },
  wishlists: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },

  date: { type: Number, required: true },
});

productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ isActive: 1, popularity: -1 });
productSchema.index({ isActive: 1, date: -1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", brand: "text", tags: "text" });

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
