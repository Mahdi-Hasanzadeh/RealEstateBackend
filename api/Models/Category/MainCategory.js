import mongoose from "mongoose";

const mainCategory = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Provide name"],
    },
  },
  {
    timestamps: true,
  }
);

export const mainCategoryModel = mongoose.model("MainCategory", mainCategory);
