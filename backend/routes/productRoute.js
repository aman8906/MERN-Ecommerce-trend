import express from "express";
import {
  addProduct, updateProduct, listProducts, trendingProducts, dealProducts, suggest,
  bulkProducts, relatedProducts, removeProduct, getSingleProduct, trackEvent,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import { optionalAuth } from "../middleware/userAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);
productRouter.post("/update", adminAuth, updateProduct);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", getSingleProduct);
productRouter.post("/bulk", bulkProducts);
productRouter.post("/track", optionalAuth, trackEvent);
productRouter.get("/list", listProducts);
productRouter.get("/trending", trendingProducts);
productRouter.get("/deals", dealProducts);
productRouter.get("/suggest", suggest);
productRouter.get("/related/:id", relatedProducts);

export default productRouter;
