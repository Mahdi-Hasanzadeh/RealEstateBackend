import asyncHandler from "express-async-handler";
import { mainCategoryModel } from "../../Models/Category/MainCategory.js";
import { isMainCategoryExist } from "../../Utility/functions.js";

export const createMainCategory = asyncHandler(async (req, res) => {
  const categoryName = req.body.categoryName;
  if (!categoryName) {
    res.status(400);
    throw new Error("Please Provide Category name");
  }

  // check wheter the category is exist or not
  const mainExist = await isMainCategoryExist(categoryName);

  if (mainExist) {
    res.status(400);
    throw new Error("Category name already exist");
  }

  const category = await mainCategoryModel.create({
    name: categoryName,
  });

  if (!category) {
    res.status(401);
    throw new Error("Main category not created");
  }

  res.status(201).json(category);
});
