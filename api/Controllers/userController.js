import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { userModel } from "../Models/userModel.js";
import jwt from "jsonwebtoken";

export const signupUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please provide credentials");
  }

  const userEmailAvailable = await userModel.findOne({ email });
  if (userEmailAvailable) {
    res.status(400);
    throw new Error("Email already in used");
  }

  const usernameAvailable = await userModel.findOne({ username });
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

export const signinUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide credentials");
  }

  const user = await userModel.findOne({ email });
  // console.log(user.id);

  if (user && (await bcrypt.compare(password, user.password))) {
    // console.log("user exist with correct password");
    const accessToken = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar, // we can send payload like this or like second way
        },
        // id: user.id,
        // username: user.username,
      },
      process.env.SECRET_KEY
      // { expiresIn: "100m" }
    );

    // we have two ways to send the access token:
    // 1: using cookies

    // res
    //   .cookie("accessToken", accessToken, {
    //     httpOnly: true,
    //   })
    //   .status(200)
    //   .json({
    //     id: user.id,
    //     username: user.username,
    //     avatar: user.avatar,
    //   });

    // 2: just sending the access token in json format
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
    });
  } else {
    res.status(401); // UNAUTHORIZED
    throw new Error("Email or Password is wrong");
  }
});

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
        },
      },
      process.env.SECRET_KEY
    );
    // res
    //   .cookie("accessToken", accessToken, { httpOnly: true })
    //   .status(200)
    //   .json({
    //     id: user.id,
    //     username: user.username,
    //     avatar: user.avatar,
    //   });
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
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
        },
      },
      process.env.SECRET_KEY
    );
    // res
    //   .cookie("accessToken", accessToken, { httpOnly: true })
    //   .status(200)
    //   .json({
    //     id: user.id,
    //     username: user.username,
    //     avatar: user.avatar,
    //   });
    res.status(200).json({
      accessToken,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
    });
  }
});

export const updateUser = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not Authorized");
  }
  const user = await userModel.findOne({ _id: req.params.id });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // hash the updated password if the user change the password
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }
  // console.log("avatar: ", req.body.avatar);
  console.log("hello");
  const updatedUser = await userModel.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        avatar: req.body.avatar,
        mobileNumber: req.body.mobileNumber,
      },
    },
    {
      new: true,
    }
  );

  console.log("updateUser: ", updatedUser);
  if (!updatedUser) {
    res.status(401);
    throw new Error("User data is not valid");
  }

  res.status(200).json({
    id: updatedUser.id,
    username: updatedUser.username,
    avatar: updatedUser.avatar,
  });
});

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

export const getUserInfo = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User is not authorized");
  }
  console.log("get User info");
  console.log(req.params.id);
  const user = await userModel.findOne({ _id: req.params.id });
  console.log(user);
  if (!user) {
    res.status(404);
    throw new Error("User is not found");
  }
  console.log("getUserInfo: ", user);
  const { username, email, mobileNumber } = user;
  res.status(200).json({ username, email, mobileNumber });
});
