import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  image: { type: String, required: true },
  link: { type: String, default: "/collection" },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

export default mongoose.models.banner || mongoose.model("banner", bannerSchema);
