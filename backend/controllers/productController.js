import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import { uploadImage } from "../utils/upload.js";
import { calcDiscount } from "../utils/pricing.js";
import { remember, cacheDelPrefix, once } from "../config/redis.js";
import { getTrending } from "../services/trending.js";
import { publishEvents } from "../services/eventBus.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const bust = () => Promise.all([cacheDelPrefix("products:"), cacheDelPrefix("suggest:"), cacheDelPrefix("trending:scores")]);

// ---------- Admin: create ----------
const addProduct = async (req, res) => {
  try {
    const { name, description, price, mrp, category, subCategory, sizes, bestSeller, trendingPin, brand, tags, stock } = req.body;

    const files = ["image1", "image2", "image3", "image4"].map((k) => req.files?.[k]?.[0]).filter(Boolean);
    if (!files.length) return res.status(400).json({ success: false, message: "Upload at least one image" });
    const imageUrls = await Promise.all(files.map((f) => uploadImage(f, "trendify/products")));

    const sellPrice = Number(price);
    const mrpNum = Number(mrp) > sellPrice ? Number(mrp) : sellPrice;

    const product = new productModel({
      name,
      description,
      price: sellPrice,
      mrp: mrpNum,
      discountPercent: calcDiscount(sellPrice, mrpNum),
      category,
      subCategory: subCategory || "",
      brand: brand || "",
      tags: (tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      sizes: sizes ? JSON.parse(sizes) : [],
      stock: stock === undefined || stock === "" ? 100 : Number(stock),
      bestSeller: bestSeller === "true",
      trendingPin: trendingPin === "true",
      image: imageUrls,
      date: Date.now(),
    });
    await product.save();
    await bust();

    res.status(201).json({ success: true, message: "Product added" });
  } catch (error) {
    console.log("Error while adding product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Admin: quick edit (price / mrp / stock / flags) ----------
const updateProduct = async (req, res) => {
  try {
    const { id, ...body } = req.body;
    const allowed = ["name", "description", "price", "mrp", "stock", "brand", "bestSeller", "trendingPin", "isActive", "category", "subCategory"];
    const update = {};
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];

    const current = await productModel.findById(id);
    if (!current) return res.status(404).json({ success: false, message: "Product not found" });

    const price = update.price !== undefined ? Number(update.price) : current.price;
    let mrp = update.mrp !== undefined ? Number(update.mrp) : current.mrp;
    if (mrp < price) mrp = price;
    Object.assign(update, { price, mrp, discountPercent: calcDiscount(price, mrp) });
    if (update.stock !== undefined) update.stock = Math.max(0, Number(update.stock));

    await productModel.updateOne({ _id: id }, { $set: update });
    await bust();
    res.status(200).json({ success: true, message: "Product updated" });
  } catch (error) {
    console.log("Error while updating product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: list with filters / sort / pagination (cached) ----------
const SORTS = {
  newest: { date: -1 },
  popular: { popularity: -1, date: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  discount: { discountPercent: -1 },
  rating: { rating: -1, ratingCount: -1 },
};

const listProducts = async (req, res) => {
  try {
    const q = req.query;
    const page = Math.max(1, parseInt(q.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 20));

    const filter = { isActive: true };
    if (q.category) filter.category = { $in: String(q.category).split(",") };
    if (q.subCategory) filter.subCategory = { $in: String(q.subCategory).split(",") };
    if (q.bestSeller === "true") filter.bestSeller = true;
    if (q.inStock === "true") filter.stock = { $gt: 0 };
    if (q.minPrice || q.maxPrice) {
      filter.price = {};
      if (q.minPrice) filter.price.$gte = Number(q.minPrice);
      if (q.maxPrice) filter.price.$lte = Number(q.maxPrice);
    }
    if (q.rating) filter.rating = { $gte: Number(q.rating) };
    if (q.minDiscount) filter.discountPercent = { $gte: Number(q.minDiscount) };
    if (q.search) {
      // every word must match name / brand / category / tags (partial words work: "shir" -> shirt)
      const words = String(q.search).trim().split(/\s+/).slice(0, 6).map(escapeRegex);
      filter.$and = words.map((w) => {
        const rx = new RegExp(w, "i");
        return { $or: [{ name: rx }, { brand: rx }, { category: rx }, { subCategory: rx }, { tags: rx }] };
      });
    }
    const sort = SORTS[q.sort] || SORTS.newest;

    const cacheKey = "products:" + JSON.stringify({ filter, sort, page, limit });
    const data = await remember(cacheKey, 60, async () => {
      const [products, total] = await Promise.all([
        productModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
        productModel.countDocuments(filter),
      ]);
      return { products, total, page, pages: Math.ceil(total / limit) };
    });

    res.status(200).json({ success: true, ...data });
  } catch (error) {
    console.log("Error while fetching all products: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: trending (Redis ranked) ----------
const trendingProducts = async (req, res) => {
  try {
    const limit = Math.min(40, parseInt(req.query.limit) || 12);
    const category = req.query.category || undefined;
    const products = await getTrending({ category, limit });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.log("Error while fetching trending: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: products with the biggest discount ----------
const dealProducts = async (req, res) => {
  try {
    const products = await remember("products:deals", 120, () =>
      productModel.find({ isActive: true, stock: { $gt: 0 }, discountPercent: { $gte: 20 } })
        .sort({ discountPercent: -1, popularity: -1 }).limit(12).lean()
    );
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: search suggestions ----------
const suggest = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 40);
    if (q.length < 2) return res.status(200).json({ success: true, suggestions: [] });
    const rx = new RegExp(escapeRegex(q), "i");
    const suggestions = await remember(`suggest:${q.toLowerCase()}`, 300, () =>
      productModel.find({ isActive: true, $or: [{ name: rx }, { brand: rx }, { tags: rx }] })
        .sort({ popularity: -1 }).limit(6).select("name image category price").lean()
    );
    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: several products by id (cart / wishlist / recently viewed) ----------
const bulkProducts = async (req, res) => {
  try {
    const ids = (req.body.ids || []).filter(isId).slice(0, 60);
    const products = ids.length ? await productModel.find({ _id: { $in: ids } }).lean() : [];
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Public: related ----------
const relatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(200).json({ success: true, products: [] });
    const base = await productModel.findById(id).lean();
    if (!base) return res.status(200).json({ success: true, products: [] });

    const products = await remember(`products:related:${id}`, 300, () =>
      productModel.find({
        isActive: true,
        _id: { $ne: base._id },
        category: base.category,
        ...(base.subCategory ? { subCategory: base.subCategory } : {}),
      }).sort({ popularity: -1 }).limit(10).lean()
    );
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    await bust();
    res.status(200).json({ success: true, message: "Product removed" });
  } catch (error) {
    console.log("Error while removing product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!isId(productId)) return res.status(404).json({ success: false, message: "Product not found" });
    const product = await productModel.findById(productId).lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.log("Error while fetching single product: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Behaviour tracking (-> Kafka -> Redis trending) ----------
const CLIENT_EVENTS = { view: 30 * 60, add_to_cart: 60, wishlist: 60 }; // type -> de-dup window (s)

const trackEvent = async (req, res) => {
  try {
    const { productId, type } = req.body;
    if (!isId(productId) || !(type in CLIENT_EVENTS)) return res.status(400).json({ success: false });

    // one signal per visitor per window, so refreshing 1000x can't fake a trend
    const actor = req.userId || req.ip;
    if (await once(`ev:${actor}:${type}:${productId}`, CLIENT_EVENTS[type])) {
      publishEvents({ type, productId, userId: req.userId || null }); // fire and forget
    }
    res.status(202).json({ success: true });
  } catch {
    res.status(202).json({ success: true });
  }
};

export {
  addProduct, updateProduct, listProducts, trendingProducts, dealProducts, suggest,
  bulkProducts, relatedProducts, removeProduct, getSingleProduct, trackEvent,
};
