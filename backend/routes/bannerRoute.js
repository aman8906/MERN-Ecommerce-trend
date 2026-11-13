import express from "express";
import { listBanners, listAllBanners, addBanner, toggleBanner, removeBanner } from "../controllers/bannerController.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const r = express.Router();
r.get("/list", listBanners);
r.get("/admin-list", adminAuth, listAllBanners);
r.post("/add", adminAuth, upload.single("image"), addBanner);
r.post("/toggle", adminAuth, toggleBanner);
r.post("/remove", adminAuth, removeBanner);
export default r;
