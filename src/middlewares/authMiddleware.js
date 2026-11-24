import jwt from "jsonwebtoken";
import User from "../models/user.js";  // ✅ include .js

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const allowRoles = (permission) => {
  return (req, res, next) => {
    // Super power: Admin can do everything
    if (req.user.role === "admin") {
      return next();
    }
    // Other roles must have permission
    if (!req.user.permissions?.[permission]) {
      return res.status(403).json({
  success: false,
  error: "ACCESS_DENIED",
  message: "You do not have permission to access this resource",
});
    }
    next();
  };
};
