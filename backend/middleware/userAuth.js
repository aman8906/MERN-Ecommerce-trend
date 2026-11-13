import jwt from "jsonwebtoken";

const readUser = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded?.id || null;
};

/** Requires a valid user token. Sets req.userId */
export const userAuth = (req, res, next) => {
  try {
    const { token } = req.headers;
    const id = token && readUser(token);
    if (!id) return res.status(401).json({ success: false, message: "Please login first" });
    req.userId = id;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Session expired, please login again" });
  }
};

/** Works for guests too; sets req.userId when a valid token is present */
export const optionalAuth = (req, res, next) => {
  try {
    const { token } = req.headers;
    if (token) req.userId = readUser(token);
  } catch {}
  next();
};

export default userAuth;
