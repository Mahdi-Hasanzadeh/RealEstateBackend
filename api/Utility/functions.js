import qs from "qs";
import { mainCategoryModel } from "../Models/Category/MainCategory.js";
import { subCategoryModel } from "../Models/Category/SubCategory.js";
export const getQueryFromObjectsKeys = (object) => {
  const parsedValue = qs.parse(object);
  return Object.keys(parsedValue);
};

export const getQueryFromObjectsValue = (object) => {
  const parsedValue = qs.parse(object);
  return Object.values(parsedValue);
};

// create query for price
export const getPriceQuery = (req) => {
  const min_price = parseInt(req.query.minimumPrice);
  const max_price = parseInt(req.query.maximumPrice);

  let priceQuery;
  if (req.query.minimumPrice == null && req.query.maximumPrice == null) {
    priceQuery = {};
  } else if (min_price == 0 && max_price == 0) {
    priceQuery = {};
  } else if (min_price !== 0 && max_price !== 0) {
    priceQuery = { $gte: min_price, $lte: max_price };
  } else if (min_price !== 0) {
    priceQuery = { $gte: min_price };
  } else {
    priceQuery = { $lte: max_price };
  }
  return priceQuery;
};

// create query for searchTerm,order and sort

export const getSearchTerm = (req) => {
  return req.query.searchTerm || "";
};

export const getOrder = (req) => {
  return req.query.order || "createdAt";
};

export const getSort = (req) => {
  return req.query.sort || "desc";
};

export const getLimit = (req) => {
  return parseInt(req.query.limit) || 9;
};

export const getStartIndex = (req) => {
  return parseInt(req.query.startIndex) || 0;
};

export const isMainCategoryExist = async (mainCategoryName) => {
  const mainCategoryExist = await mainCategoryModel.findOne({
    name: { $regex: mainCategoryName, $options: "i" },
  });

  return mainCategoryExist;
};

export const isSubCategoryExist = async (subCategoryName) => {
  const subCategoryExist = await subCategoryModel.findOne({
    name: { $regex: subCategoryName, $options: "i" },
  });
  return subCategoryExist;
};

export const EvaluateSubCategory = async (subCategory) => {
  if (!subCategory) {
    return {
      succeess: false,
      message: "please provide sub category",
    };
  }
  return {
    succeess: true,
  };
};
