import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized!" });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Session expired, please login again" });
  }
};

export default adminAuth;
