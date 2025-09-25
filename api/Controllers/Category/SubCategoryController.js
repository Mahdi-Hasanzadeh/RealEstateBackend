import asyncHandler from "express-async-handler";
import { subCategoryModel } from "../../Models/Category/SubCategory.js";
import {
  isMainCategoryExist,
  isSubCategoryExist,
} from "../../Utility/functions.js";
export const createSubCategory = asyncHandler(async (req, res) => {
  const { mainCategoryName, subCategoryName } = req.body;
  if (!mainCategoryName || !subCategoryName) {
    res.status(400);
    throw new Error("Please Provide credentials");
  }

  // check if the main category exist or not
  const mainCategory = await isMainCategoryExist(mainCategoryName);

  if (!mainCategory) {
    res.status(400);
    throw new Error("Main category not exist");
  }

  const subCategory = await isSubCategoryExist(subCategoryName);

  if (subCategory) {
    res.status(400);
    throw new Error("Sub category already exist");
  }

  const newSubCategory = await subCategoryModel.create({
    name: subCategoryName,
    mainCategoryRef: mainCategory._id,
  });

  if (!newSubCategory) {
    res.status(400);
    throw new Error("Sub category not created");
  }

  res.status(201).json(newSubCategory);
});
