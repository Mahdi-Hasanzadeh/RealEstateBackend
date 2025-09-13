import mongoose from "mongoose";

const subCategory = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Provide name"],
    },
    mainCategoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide main category reference"],
      ref: "maincategories",
    },
  },
  {
    timestamps: true,
  }
);

export const subCategoryModel = mongoose.model("SubCategory", subCategory);
