import express from "express";
import { getCart, setCart } from "../controllers/cartController.js";
import userAuth from "../middleware/userAuth.js";

const r = express.Router();
r.get("/", userAuth, getCart);
r.put("/", userAuth, setCart);
export default r;
