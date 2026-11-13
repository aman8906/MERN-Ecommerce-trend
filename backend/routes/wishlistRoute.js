import express from "express";
import { getWishlist, toggleWishlist, syncWishlist } from "../controllers/wishlistController.js";
import userAuth from "../middleware/userAuth.js";

const r = express.Router();
r.get("/", userAuth, getWishlist);
r.post("/toggle", userAuth, toggleWishlist);
r.post("/sync", userAuth, syncWishlist);
export default r;
