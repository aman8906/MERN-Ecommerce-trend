import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: "🛍️" }, // emoji shown in the header strip
  image: { type: String, default: "" }, // optional photo for the home "Shop by category" grid
  subCategories: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

export default mongoose.models.category || mongoose.model("category", categorySchema);
