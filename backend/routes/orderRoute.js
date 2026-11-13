import express from "express";
import {
  placeOrderCOD, placeOrderStripe, verifyStripe, placeOrderRazorpay, verifyRazorpay, cancelUnpaid,
  userOrders, cancelOrder, allOrders, updateStatus, dashboardStats,
} from "../controllers/orderController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const r = express.Router();
// admin
r.get("/admin/list", adminAuth, allOrders);
r.post("/admin/status", adminAuth, updateStatus);
r.get("/admin/stats", adminAuth, dashboardStats);
// customer
r.post("/cod", userAuth, placeOrderCOD);
r.post("/stripe", userAuth, placeOrderStripe);
r.post("/verify-stripe", userAuth, verifyStripe);
r.post("/razorpay", userAuth, placeOrderRazorpay);
r.post("/verify-razorpay", userAuth, verifyRazorpay);
r.post("/cancel-unpaid", userAuth, cancelUnpaid);
r.get("/mine", userAuth, userOrders);
r.post("/cancel", userAuth, cancelOrder);
export default r;
