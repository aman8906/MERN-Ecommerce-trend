import express from "express";
import { loginUser, registerUser, loginAdmin, getProfile } from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", loginAdmin);
userRouter.get("/me", userAuth, getProfile);

export default userRouter;
