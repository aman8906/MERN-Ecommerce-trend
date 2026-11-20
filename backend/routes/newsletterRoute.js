import express from "express";
import { subscribe } from "../controllers/newsletterController.js";

const r = express.Router();
r.post("/subscribe", subscribe);
export default r;