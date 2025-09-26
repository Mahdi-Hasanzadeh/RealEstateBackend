// middleware/authorizeSuperAdmin.js
import asyncHandler from "express-async-handler";
import { userModel } from "../Models/User/userModel.js";

export const authorizeAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403);
    throw new Error("Access denied: Admin only");
  }

  const user = await userModel.findById(req.user.id).select("role");
  if (!user || user.role !== "Admin") {
    res.status(403);
    throw new Error("Access denied: Admin only");
  }

  next();
});
