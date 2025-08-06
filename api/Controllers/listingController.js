import { listingModel } from "../Models/Products/listingModel.js";
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
        message: "Please provide main category",
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
        const listing = await listingModel.create({
          ...req.body,
          userRef: req.user.id,
          mainCategoryId: mainCategoryExist._id,
          mainCategoryName: mainCategoryExist.name,
        });

        res.status(201).json(listing);
        break;
      }
      case digitalEquipment:
        {
          const result = await EvaluateSubCategory(subCategory);
          if (result.succeess == false) {
            res.json({
              succeess: false,
              message: result.message,
            });
            return;
          }
          const subCategoryExist = await isSubCategoryExist(subCategory);
          if (!subCategoryExist) {
            res.json({
              succeess: false,
              message: "Sub Category not exist in database",
            });
            return;
          }

          const newCellPhone = await cellPhoneAndTabletsModel.create({
            ...req.body,
            userRef: req.user.id,
            mainCategoryId: mainCategoryExist._id,
            subCategoryId: subCategoryExist._id,
            mainCategoryName: mainCategoryExist.name,
            subCategoryName: subCategoryExist.name,
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
    const estate = await listingModel.find({ userRef: req.user.id });
    const digitalEquipments = await cellPhoneAndTabletsModel.find({
      userRef: req.user.id,
    });
    const userListing = estate.concat(digitalEquipments);
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
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }

  try {
    const params = req.params.id.split(",");
    const id = params[0];
    const mainCategory = params[1]?.toLowerCase();
    const subCategory = params[2]?.toLowerCase();

    let product = null;
    switch (mainCategory) {
      case estate: {
        product = await listingModel.findOne({
          _id: id,
        });
        break;
      }
      case digitalEquipment.toLowerCase(): {
        switch (subCategory) {
          case cellPhoneAndTablets: {
            product = await cellPhoneAndTabletsModel.findById(id);
            break;
          }
          case computer: {
            break;
          }
          case console: {
            break;
          }
        }
        break;
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Listing Not Found",
      });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(404).json({
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
  const { mainCategoryName } = req.body;
  try {
    if (mainCategoryName.toLowerCase() == estate) {
      const listing = await listingModel.findById(req.params.id);
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Listing not found",
        });
      }
      await listingModel.findByIdAndDelete(req.params.id);

      return res
        .status(200)
        .json({ succeess: true, message: "Listing Deleted" });
    } else if (mainCategoryName == digitalEquipment) {
      const digitalProduct = await cellPhoneAndTabletsModel.findById(
        req.params.id
      );
      if (!digitalProduct) {
        return res.status(404).json({
          success: false,
          message: "Listing not found",
        });
      }
      await cellPhoneAndTabletsModel.findByIdAndDelete(req.params.id);
      return res
        .status(200)
        .json({ succeess: true, message: "Digital Product Deleted" });
    }
  } catch (error) {
    return res.status(404).json({
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
    case estate: {
      await getEstateProducts(req, res);
      break;
    }
    case digitalEquipment: {
      //* get the  subcategory
      const selectedSubCategory = req.query.subCategory;

      switch (selectedSubCategory) {
        // case allDigitalEquipment: {
        //   const products = await cellPhoneAndTabletsModel
        //     .find({})
        //     .sort({ [req.query.order]: req.query.sort })
        //     .limit(req.query.limit || 9)
        //     .skip(req.query.startIndex || 0);
        //   res.status(200).json({ listings: products, message: true });
        //   break;
        //   // todo
        //   break;
        // }
        case cellPhoneAndTablets: {
          await getCellPhoneAndTablets(req, res);
          break;
        }
        case computer: {
          // todo
          break;
        }
        case console: {
          // todo
          break;
        }
        default: {
        }
      }
      break;
    }
  }
};

//update listings by id
export const updateListingById = async (req, res, next) => {
  try {
    const listing = await listingModel.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing Not Found",
      });
    }

    if (listing.userRef != req.body.userRef) {
      return res.status(401).json({
        succeess: false,
        message: "Your are not allowed to update another user's listing",
      });
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

    return res.status(201).json({
      succeess: true,
      updatedListing,
    });
  } catch (error) {
    return res.status(404).json({
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
    const estate = await listingModel.find({
      _id: { $in: listingsIds },
    });

    const digitalEquipments = await cellPhoneAndTabletsModel.find({
      _id: { $in: listingsIds },
    });

    const listings = estate.concat(digitalEquipments);

    return res.status(201).json(listings);
  } catch (error) {
    return res.status(404).json({
      succeess: false,
      message: error.message,
    });
  }
};

export const getCellPhoneById = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  const { cellPhoneId } = req.params;
  try {
    const product = await cellPhoneAndTabletsModel.findById(cellPhoneId);
    if (!product) {
      return res
        .status(404)
        .json({ succeess: false, message: "Product Not Found" });
    }
    return res.status(200).json({ succeess: true, data: product });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

export const updateCellPhoneById = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  const currentUser = req.user.id;
  try {
    const listing = await cellPhoneAndTabletsModel.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing Not Found",
      });
    }

    if (listing.userRef != currentUser) {
      return res.status(401).json({
        succeess: false,
        message: "Your are not allowed to update another user's listing",
      });
    }

    await cellPhoneAndTabletsModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          description: req.body.description,
          address: req.body.address,
          regularPrice: req.body.regularPrice,
          imageURLs: req.body.imageURLs,
          brand: req.body.brand,
          storage: req.body.storage,
          color: req.body.color,
          RAM: req.body.RAM,
          discountPrice: req.body.offer ? req.body.discountPrice : 0,
          offer: req.body.offer,
        },
      },
      {
        new: true,
      }
    );

    return res.status(201).json({
      succeess: true,
      message: "Listing Updated",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
