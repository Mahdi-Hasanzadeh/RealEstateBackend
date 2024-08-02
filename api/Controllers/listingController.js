import { listingModel } from "../Models/Products/listingModel.js";
import { mainCategoryModel } from "../Models/Category/MainCategory.js";
import {
  getCellPhoneAndTablets,
  getEstateProducts,
} from "../Utility/QueryDatabaseFunctions.js";
import {
  allBrands,
  allDigitalEquipment,
  allProducts,
  cellPhoneAndTablets,
  computer,
  digitalEquipment,
  estate,
  transportation,
} from "../Utility/constants.js";
import {
  EvaluateSubCategory,
  isMainCategoryExist,
  isSubCategoryExist,
} from "../Utility/functions.js";
import { cellPhoneAndTabletsModel } from "../Models/Products/cellPhoneAndTabletsModel.js";

// create a new listing
export const createListing = async (req, res, next) => {
  try {
    // check the user is authenticated or not
    if (!req.user) {
      res.json({
        succeess: false,
        message: "User is not authorized",
      });
      return;
    }

    //* check that the main category exist or not
    const { mainCategory, subCategory } = req.body;
    if (!mainCategory) {
      res.json({
        succeess: false,
        message: "Please provide  main category",
      });
      return;
    }

    const mainCategoryExist = await isMainCategoryExist(mainCategory);

    if (!mainCategoryExist) {
      res.json({
        success: false,
        message: "Main category not exist",
      });
      return;
    }

    switch (mainCategory) {
      case estate: {
        console.log(estate);
        const listing = await listingModel.create({
          ...req.body,
          userRef: req.user.id,
        });

        res.status(201).json(listing);
        break;
      }
      case digitalEquipment:
        {
          console.log(digitalEquipment);

          const result = await EvaluateSubCategory(subCategory);
          if (result.succeess == false) {
            res.json({
              succeess: false,
              message: result.message,
            });
            return;
          }
          console.log("exist 1");
          const subCategoryExist = await isSubCategoryExist(subCategory);
          console.log(subCategory);
          if (!subCategoryExist) {
            res.json({
              succeess: false,
              message: "Sub Category not exist in database",
            });
            return;
          }

          console.log(mainCategoryExist);
          console.log(subCategoryExist);
          const newCellPhone = await cellPhoneAndTabletsModel.create({
            ...req.body,
            userRef: req.user.id,
            mainCategoryId: mainCategoryExist._id,
            subCategoryId: subCategoryExist._id,
          });
          res.status(201).json(newCellPhone);
        }
        break;
    }
    //* check that the sub category exist or not
  } catch (error) {
    res.json({
      succeess: false,
      message: error.message,
    });
  }
};

//Return all listings of a specific user
export const getListings = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      succeess: false,
      message: "user is not authorized",
    });
    return;
  }
  try {
    const userListing = await listingModel.find({ userRef: req.user.id });
    res.status(200).json(userListing);
  } catch (error) {
    res.json({
      succeess: false,
      message: error.message,
    });
  }
};

// return a single product by id
export const getListingById = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  try {
    const listing = await listingModel.findById(req.params.id);
    console.log(req.params.id, "id new");
    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Not found",
      });
      return;
    }
    res.status(200).json(listing);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

//delete a single product by id
export const deleteListingById = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      succeess: false,
      message: "user is not authorized",
    });
    return;
  }

  try {
    const listing = await listingModel.find({ _id: req.params.id });
    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Listing not found",
      });
      return;
    }

    const deletedListing = await listingModel.findByIdAndDelete(req.params.id);
    if (!deletedListing) {
      res.status(404).json({
        success: false,
        message: "Listing is not found",
      });
      return;
    }
    res.status(200).json(deletedListing);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// return products based on query
export const getListingsWithQuery = async (req, res, next) => {
  // * 1: get the category from the query

  const category = req.query.category;
  switch (category) {
    case allProducts: {
      break;
    }
    case estate: {
      await getEstateProducts(req, res);
      break;
    }
    case digitalEquipment: {
      //* get the  subcategory
      const selectedSubCategory = req.query.subCategory;

      switch (selectedSubCategory) {
        case allDigitalEquipment: {
          // todo
          break;
        }
        case cellPhoneAndTablets: {
          await getCellPhoneAndTablets(req, res);
          break;
        }
        case computer: {
          // todo
          console.log("subCategory: ", computer);
          break;
        }
        case console: {
          // todo
          console.log("subCategory: ", console);
          break;
        }
      }
      break;
    }
    case transportation: {
      break;
    }
  }
};

//update listings by id
export const updateListingById = async (req, res, next) => {
  try {
    const listing = await listingModel.findById(req.params.id);

    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Listing not found",
      });
      return;
    }

    if (listing.userRef != req.body.userRef) {
      res.status(401).json({
        succeess: false,
        message: "Your are not allowed to update another user's listing",
      });
      return;
    }

    const updatedListing = await listingModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          address: req.body.address,
          regularPrice: req.body.regularPrice,
          discountPrice: req.body.discountPrice,
          bedrooms: req.body.bedrooms,
          bath: req.body.bath,
          furnished: req.body.furnished,
          parking: req.body.parking,
          type: req.body.type,
          offer: req.body.offer,
          imageURLs: req.body.imageURLs,
        },
      },
      {
        new: true,
      }
    );

    res.status(201).json({
      succeess: true,
      updatedListing,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

//return a list of products based on several ids
// *(return all products that is in favorites list of a user)
export const getListingsById = async (req, res, next) => {
  const listingsIds = req.query.ListingsId.split(",");
  try {
    const listings = await listingModel.find({
      _id: { $in: listingsIds },
    });
    console.log(listings);
    return res.status(201).json(listings);
  } catch (error) {
    res.status(404).json({
      succeess: false,
      message: error.message,
    });
  }
};
