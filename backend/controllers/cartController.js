import mongoose from "mongoose";
import userModel from "../models/userModel.js";

export const getCart = async (req, res) => {
  const user = await userModel.findById(req.userId).select("cartData").lean();
  res.status(200).json({ success: true, cartData: user?.cartData || {} });
};

/** Replace the whole cart (frontend debounces and syncs). Input is sanitised. */
export const setCart = async (req, res) => {
  try {
    const clean = {};
    for (const [id, sizes] of Object.entries(req.body.cartData || {})) {
      if (!mongoose.Types.ObjectId.isValid(id) || typeof sizes !== "object") continue;
      for (const [size, qty] of Object.entries(sizes)) {
        const q = Math.min(10, Math.floor(Number(qty)));
        if (q > 0) (clean[id] ||= {})[String(size).slice(0, 20)] = q;
      }
    }
    await userModel.updateOne({ _id: req.userId }, { $set: { cartData: clean } });
    res.status(200).json({ success: true, cartData: clean });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
