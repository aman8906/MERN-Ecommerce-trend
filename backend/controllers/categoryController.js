import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import { uploadImage } from "../utils/upload.js";
import { remember, cacheDelPrefix } from "../config/redis.js";

const bust = () => cacheDelPrefix("categories");
const parseSubs = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

export const listCategories = async (req, res) => {
  try {
    const categories = await remember("categories:active", 300, () =>
      categoryModel.find({ active: true }).sort({ order: 1, name: 1 }).lean()
    );
    res.status(200).json({ success: true, categories });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const listAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({}).sort({ order: 1, name: 1 }).lean();
    res.status(200).json({ success: true, categories });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const addCategory = async (req, res) => {
  try {
    const { name, icon, subCategories, order } = req.body;
    const image = req.file ? await uploadImage(req.file, "trendify/categories") : "";
    await categoryModel.create({
      name, icon: icon || "🛍️", image, subCategories: parseSubs(subCategories), order: Number(order) || 0,
    });
    await bust();
    res.status(201).json({ success: true, message: "Category added" });
  } catch (e) {
    const msg = e.code === 11000 ? "Category already exists" : e.message;
    res.status(400).json({ success: false, message: msg });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id, name, icon, subCategories, order, active } = req.body;
    const cat = await categoryModel.findById(id);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    const oldName = cat.name;
    if (name !== undefined) cat.name = name;
    if (icon !== undefined) cat.icon = icon;
    if (subCategories !== undefined) cat.subCategories = parseSubs(subCategories);
    if (order !== undefined) cat.order = Number(order) || 0;
    if (active !== undefined) cat.active = active === true || active === "true";
    if (req.file) cat.image = await uploadImage(req.file, "trendify/categories");
    await cat.save();

    // products store the category name, keep them in sync on rename
    if (name && name !== oldName) await productModel.updateMany({ category: oldName }, { $set: { category: name } });
    await Promise.all([bust(), cacheDelPrefix("products:")]);
    res.status(200).json({ success: true, message: "Category updated" });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

export const removeCategory = async (req, res) => {
  try {
    const cat = await categoryModel.findById(req.body.id);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });
    const used = await productModel.countDocuments({ category: cat.name });
    if (used > 0) {
      return res.status(400).json({ success: false, message: `${used} products still use this category. Move or delete them first (or just disable the category).` });
    }
    await cat.deleteOne();
    await bust();
    res.status(200).json({ success: true, message: "Category removed" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
