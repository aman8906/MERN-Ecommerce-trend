import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { publishEvents } from "../services/eventBus.js";

const valid = (id) => mongoose.Types.ObjectId.isValid(id);

export const getWishlist = async (req, res) => {
  const user = await userModel.findById(req.userId).select("wishlist").lean();
  const ids = (user?.wishlist || []).filter(valid);
  const products = ids.length ? await productModel.find({ _id: { $in: ids } }).lean() : [];
  res.status(200).json({ success: true, ids, products });
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!valid(productId)) return res.status(400).json({ success: false, message: "Invalid product" });
    const user = await userModel.findById(req.userId).select("wishlist");
    const has = user.wishlist.includes(productId);
    if (has) user.wishlist.pull(productId);
    else user.wishlist.push(productId);
    await user.save();
    if (!has) publishEvents({ type: "wishlist", productId, userId: req.userId });
    res.status(200).json({ success: true, added: !has });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

/** Merge guest wishlist (localStorage) into the account after login */
export const syncWishlist = async (req, res) => {
  const ids = (req.body.ids || []).filter(valid).slice(0, 200);
  const user = await userModel.findByIdAndUpdate(req.userId, { $addToSet: { wishlist: { $each: ids } } }, { new: true }).select("wishlist");
  res.status(200).json({ success: true, ids: user.wishlist });
};
