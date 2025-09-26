import { userModel } from "../Models/User/userModel.js";

export const checkBanned = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  var user = await userModel.findById(req.user.id).select("isBanned");

  if (user.isBanned) {
    return res.status(403).json({
      success: false,
      message:
        "Action forbidden: your account is banned.Please check your profile",
    });
  }

  next();
};
