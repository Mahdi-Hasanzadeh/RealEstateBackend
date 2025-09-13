import express from "express";
import {
  signupUser,
  signinUser,
  google,
  updateUser,
  deleteUser,
  getUserInfo,
  updateUserFavorites,
  verifyEmail,
  sendVerificationCode,
} from "../Controllers/userController.js";

import { validateToken } from "../Middleware/validateToken.js";

const Router = express.Router();

//@desc POST api/user/signup

// register a user

Router.post("/signup", signupUser);
Router.post("/signin", signinUser);
Router.post("/google", google);
Router.post("/verify-email", verifyEmail);

//private route
Router.get("/userInfo/:id", validateToken, getUserInfo);
Router.delete("/delete/:id", validateToken, deleteUser);
Router.put("/update/:id", validateToken, updateUser);
Router.put("/update/:id/favorites", validateToken, updateUserFavorites);
Router.get("/send-verification-code", validateToken, sendVerificationCode);

export default Router;
