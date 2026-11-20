import validator from "validator";
import newsletterModel from "../models/newsletterModel.js";

export const subscribe = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid email" });
    await newsletterModel.updateOne({ email }, { $setOnInsert: { email, date: Date.now() } }, { upsert: true });
    res.status(200).json({ success: true, message: "Thanks for subscribing!" }); // same answer if already subscribed
  } catch (e) { res.status(500).json({ success: false, message: "Could not subscribe right now, please try again" }); }
};