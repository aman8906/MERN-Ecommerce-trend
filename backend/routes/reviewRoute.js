import express from "express";
import { listReviews, addReview } from "../controllers/reviewController.js";
import userAuth from "../middleware/userAuth.js";

const r = express.Router();
r.get("/:productId", listReviews);
r.post("/", userAuth, addReview);
export default r;
