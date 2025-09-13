import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide username"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please Provide Password"],
    },
    role: {
      type: String,
      default: "User",
    },
    avatar: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Listing",
      default: [],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Explicit indexes to enforce uniqueness at the DB level
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

export const userModel = mongoose.model("User", userSchema);
