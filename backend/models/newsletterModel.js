import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  date: { type: Number, default: Date.now },
});

export default mongoose.models.newsletter || mongoose.model("newsletter", newsletterSchema);