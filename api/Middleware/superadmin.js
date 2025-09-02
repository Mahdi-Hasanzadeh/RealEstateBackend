// middleware/authorizeSuperAdmin.js
import asyncHandler from "express-async-handler";

export const authorizeAdmin = asyncHandler((req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403);
    throw new Error("Access denied: Admin only");
  }

  next();
});
