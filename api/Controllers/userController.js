import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { userModel } from "../Models/User/userModel.js";
import jwt from "jsonwebtoken";
import { agenda } from "../Utility/agenda.js";
import { NotificationModel } from "../Models/Notification/NotificationModel.js";

// create new user
export const signupUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please provide credentials");
  }

  const [userEmailAvailable, usernameAvailable] = await Promise.all([
    userModel.findOne({ email }),
    userModel.findOne({ username }),
  ]);

  if (userEmailAvailable) {
    res.status(400);
    throw new Error("Email already in used");
  }

  if (usernameAvailable) {
    res.status(400);
    throw new Error("Username is not available");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const emailVerificationToken = generateVerificationToken();
  const emailVerificationTokenExpires = Date.now() + 3600 * 1000; // 1 hour expiration

  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
    emailVerificationToken,
    emailVerificationTokenExpires,
  });

  // 🔹 Add job to Agenda to send verification email
  agenda.now("send verification email", {
    to: user.email,
    username: user.username,
    token: emailVerificationToken,
  });

  res.status(201).json({
    username,
    id: user.id,
  });
});

// login to an account
export const signinUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide credentials");
  }

  const user = await userModel.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
        },
      },
      process.env.SECRET_KEY
      // { expiresIn: "100m" }
    );

    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      favorites: user.favorites,
      mobileNumber: user.mobileNumber,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  } else {
    res.status(401);
    throw new Error("Email or Password is wrong");
  }
});

// login with google account
export const google = asyncHandler(async (req, res) => {
  // first we check that if the use exist in the database
  // if exist, then we  send and access token with cookie
  // and if the use not exist, first we need to generate
  // a random pasword for the user and also we need to
  // create a username for the user by using displayname that
  // we get from the googleAuthProvider and after that we send
  // an access token and cookie to the front-end
  const user = await userModel.findOne({ email: req.body.email });
  if (user) {
    user.emailVerified = true;
    await user.save();
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
        },
      },
      process.env.SECRET_KEY
    );
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
      favorites: user.favorites,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  } else {
    // beacause the user not exist, first we create a random password and then we hash the password
    const generatedPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);
    // this return 0.2213dfdf but by using slice(-8)we return the last 8//characters
    // we use it again to create a strong password with 16 character

    // we hash the random generated password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // we create a username for the user with a random suffix
    const newUsername =
      req.body.name.split(" ").join("").toLowerCase() +
      Math.random().toString(36).slice(-4);
    const user = await userModel.create({
      username: newUsername,
      email: req.body.email,
      password: hashedPassword,
      avatar: req.body.avatar,
      emailVerified: true,
    });
    if (!user) {
      res.status(400);
      throw new Error("User data is not valid");
    }
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
        },
      },
      process.env.SECRET_KEY
    );
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
      favorites: user.favorites,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  }
});

export const updateUser = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { username, email, avatar, mobileNumber, password } = req.body;

    // Prepare fields to update
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (mobileNumber !== undefined) updateFields.mobileNumber = mobileNumber;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    if (avatar.publicId != user.avatar.publicId) {
      await agenda.now("delete cloudinary image", {
        publicId: user.avatar.publicId,
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User update failed" });
    }

    res.status(200).json({
      success: true,
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      mobileNumber: updatedUser.mobileNumber,
    });
  } catch (error) {
    // Handle unique index errors for username or email
    if (error.code === 11000) {
      console.log(error);
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(400)
        .json({ success: false, message: `${field} is already taken` });
    }

    // Fallback for other errors
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserFavorites = async (req, res) => {
  try {
    if (!req.user) {
      console.log("not authenticated");
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let updateQuery = {};

    if (req.body.removeFavorites) {
      updateQuery = { $pull: { favorites: req.body.favorites } };
    } else {
      updateQuery = { $addToSet: { favorites: req.body.favorites } };
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res
        .status(400)
        .json({ success: false, message: "Updating favorites failed" });
    }

    res.status(200).json({
      success: true,
      id: updatedUser.id,
      favorites: updatedUser.favorites,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// delete user account
export const deleteUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not Authorized");
  }
  const user = await userModel.findOne({ _id: req.params.id });
  if (!user) {
    res.status(404);
    throw new Error("User Not Found");
  }

  const deletedUser = await userModel.findByIdAndDelete(req.params.id);
  if (!deletedUser) {
    res.status(401);
    throw new Error("User is not deleted");
  }

  res.status(200).json(deletedUser);
});

// get user information
export const getUserInfo = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }
  const user = await userModel.findOne({ _id: req.params.id });
  if (!user) {
    res.status(404);
    throw new Error("User is not found");
  }
  const {
    username,
    email,
    mobileNumber,
    favorites,
    isBanned,
    banReason,
    bannedAt,
    emailVerified,
  } = user;
  res.status(200).json({
    username,
    email,
    mobileNumber,
    favorites,
    isBanned,
    banReason,
    bannedAt,
    emailVerified,
  });
});

export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  // Find user with this token and check expiration
  const user = await userModel.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
    });
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;

  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Email verified successfully!" });
};

const generateVerificationToken = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
};

export const sendVerificationCode = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already verified
    if (user.emailVerified) {
      return res
        .status(200)
        .json({ message: "Your account is already verified" });
    }
    console.log(user.emailVerificationTokenExpires);

    // Token not expired yet
    if (
      user.emailVerificationToken &&
      user.emailVerificationTokenExpires > Date.now()
    ) {
      return res.status(200).json({
        message:
          "We have already sent you a verification token. Please check your email.",
      });
    }

    // Generate new token
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationTokenExpires = Date.now() + 3600 * 1000; // 1 hour

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
    await user.save();

    // Schedule Agenda job
    await agenda.now("send verification email", {
      to: user.email,
      username: user.username,
      token: emailVerificationToken,
    });

    res.status(200).json({
      message: "Verification email scheduled successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUnreadNotification = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authorized" });
    }

    // Fetch unread notifications for this user
    const notifications = await NotificationModel.find({
      userId: req.user.id,
      isRead: false,
    }).sort({ createdAt: -1 }); // latest first

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// DELETE /notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    // Ensure user owns the notification
    const notif = await NotificationModel.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!notif) {
      return res.status(200).json({ success: true });
    }

    await NotificationModel.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
