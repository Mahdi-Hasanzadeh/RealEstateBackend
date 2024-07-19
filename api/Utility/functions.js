import qs from "qs";

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
