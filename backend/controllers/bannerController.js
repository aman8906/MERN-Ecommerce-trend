
import bannerModel from "../models/bannerModel.js";
import { uploadImage } from "../utils/upload.js";
import { remember, cacheDelPrefix } from "../config/redis.js";

const bust = () => cacheDelPrefix("banners");

export const listBanners = async (req, res) => {
  try {
    const position = req.query.position === "strip" ? "strip" : "hero";

    // Old banners without position are treated as hero banners
    const where = position === "hero"
      ? {
          active: true,
          $or: [
            { position: "hero" },
            { position: { $exists: false } }
          ]
        }
      : {
          active: true,
          position: "strip"
        };

    const banners = await remember(
      `banners:active:${position}`,
      300,
      () => bannerModel.find(where).sort({ order: 1 }).lean()
    );

    res.status(200).json({ success: true, banners });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listAllBanners = async (req, res) => {
  try {
    const banners = await bannerModel.find({}).sort({ order: 1 }).lean();

    res.status(200).json({ success: true, banners });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const addBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required"
      });
    }

    const { title, subtitle, link, order, position } = req.body;

    const image = await uploadImage(req.file, "trendify/banners");

    await bannerModel.create({
      title,
      subtitle,
      link: link || "/collection",
      order: Number(order) || 0,
      position: position === "strip" ? "strip" : "hero",
      image
    });

    await bust();

    res.status(201).json({
      success: true,
      message: "Banner added"
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const toggleBanner = async (req, res) => {
  try {
    const b = await bannerModel.findById(req.body.id);

    if (!b) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    b.active = !b.active;
    await b.save();
    await bust();

    res.status(200).json({
      success: true,
      message: b.active ? "Banner enabled" : "Banner hidden"
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const removeBanner = async (req, res) => {
  try {
    await bannerModel.findByIdAndDelete(req.body.id);
    await bust();

    res.status(200).json({
      success: true,
      message: "Banner removed"
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
