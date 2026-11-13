import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import userModel from "../models/userModel.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email: String(email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }
    res.status(200).json({ success: true, token: createToken(user._id), name: user.name });
  } catch (error) {
    console.log("Error while logging in user: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name is required" });
    if (!validator.isEmail(email || "")) return res.status(400).json({ success: false, message: "Invalid email" });
    if ((password || "").length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    if (await userModel.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new userModel({ name: name.trim(), email, password: hashedPassword }).save();
    res.status(200).json({ success: true, token: createToken(user._id), name: user.name });
  } catch (error) {
    console.log("Error while registering user: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.status(200).json({ success: true, token });
    } else {
      res.status(400).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error while logging in admin: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  const user = await userModel.findById(req.userId).select("name email").lean();
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.status(200).json({ success: true, user });
};

export { loginUser, registerUser, loginAdmin, getProfile };
