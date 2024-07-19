import { listingModel } from "../Models/listingModel.js";
import { allBrands } from "./constants.js";
import {
  getLimit,
  getOrder,
  getPriceQuery,
  getQueryFromObjectsValue,
  getSearchTerm,
  getSort,
  getStartIndex,
} from "./functions.js";

export const getEstateProducts = async (req, res) => {
  // queries:  1: searchTerm, 2:type, 3:parking. 4:furnished 5: offer,
  // 6: sort 7: order 8: limit

  let query = getQueryForGeneralFilters(req);

  let offer = req.query.offer;

  if (offer == undefined || offer === "false") {
    offer = { $in: [true, false] };
  }

  let furnished = req.query.furnished;
  if (furnished == undefined || furnished === "false") {
    furnished = { $in: [true, false] };
  }

  let parking = req.query.parking;
  if (parking == undefined || parking === "false") {
    parking = { $in: [true, false] };
  }

  let type = req.query.type;
  if (type == undefined || type === "all") {
    type = { $in: ["sell", "rent"] };
  }

  query.offer = offer;
  query.furnished = furnished;
  query.parking = parking;
  query.type = type;

  const limit = getLimit(req);

  const startIndex = getStartIndex(req);

  const order = getOrder(req);

  const sort = getSort(req);

  try {
    const listings = await listingModel
      .find(query)
      .sort({ [order]: sort })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ listings, message: true });
  } catch (error) {
    console.log(error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// set name and price in the query object
export const getQueryForGeneralFilters = (req) => {
  let query = {};

  const searchTerm = getSearchTerm(req);

  const priceQuery = getPriceQuery(req);

  query = {
    name: { $regex: searchTerm, $options: "i" },
  };

  if (Object.keys(priceQuery).length !== 0) {
    query.regularPrice = priceQuery;
  }
  return query;
};

export const getCellPhoneAndTablets = async (req, res) => {
  let query = getQueryForGeneralFilters(req);

  const limit = getLimit(req);

  const startIndex = getStartIndex(req);

  const order = getOrder(req);

  const sort = getSort(req);

  //* get the brand
  const brand = req.query.brand;
  if (brand !== allBrands) {
    query.brand = brand;
  }

  //* get the query for the storage. example:['mb512','gb1']
  //* method 1
  //* const storage = getQueryFromObjects(req.query.storage);
  //* method 2 // we send the query from th front-end,example:['mb512','gb1'],
  //* console.log(req.query.storage); // *it will be like this: 0=512mb

  const storage = getQueryFromObjectsValue(req.query.storage);
  // console.log("storage", storage);
  if (storage.length !== 0) {
    query.storage = { $in: storage };
  }

  const RAM = getQueryFromObjectsValue(req.query.RAM);
  // console.log("RAM", RAM);
  if (RAM.length !== 0) {
    query.RAM = { $in: RAM };
  }

  const color = getQueryFromObjectsValue(req.query.color);
  if (color.length !== 0) {
    query.color = { $in: color };
  }

  console.log("query for mobiles: ", query);
  //   todo return the cell phone products
  const products = await listingModel.find({});
  res.status(200).json({ listings: [], message: true });
};
