import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { userModel } from "../Models/User/userModel.js";
import jwt from "jsonwebtoken";

// create new user
export const signupUser = asyncHandler(async (req, res, next) => {
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

  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    username,
    id: user.id,
  });
});

// login to an account
export const signinUser = asyncHandler(async (req, res, next) => {
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
    });
  } else {
    res.status(401);
    throw new Error("Email or Password is wrong");
  }
});

// login with google account
export const google = asyncHandler(async (req, res, next) => {
  // first we check that if the use exist in the database
  // if exist, then we  send and access token with cookie
  // and if the use not exist, first we need to generate
  // a random pasword for the user and also we need to
  // create a username for the user by using displayname that
  // we get from the googleAuthProvider and after that we send
  // an access token and cookie to the front-end
  const user = await userModel.findOne({ email: req.body.email });
  if (user) {
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
export const deleteUser = asyncHandler(async (req, res, next) => {
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
export const getUserInfo = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }
  const user = await userModel.findOne({ _id: req.params.id });
  if (!user) {
    res.status(404);
    throw new Error("User is not found");
  }
  const { username, email, mobileNumber, favorites } = user;
  res.status(200).json({ username, email, mobileNumber, favorites });
});
