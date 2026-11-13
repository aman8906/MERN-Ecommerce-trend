import express from "express";
import { listCategories, listAllCategories, addCategory, updateCategory, removeCategory } from "../controllers/categoryController.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const r = express.Router();
r.get("/list", listCategories);
r.get("/admin-list", adminAuth, listAllCategories);
r.post("/add", adminAuth, upload.single("image"), addCategory);
r.post("/update", adminAuth, upload.single("image"), updateCategory);
r.post("/remove", adminAuth, removeCategory);
export default r;
