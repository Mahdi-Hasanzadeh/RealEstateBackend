import { listingModel } from "../Models/Products/listingModel.js";
import {
  getCellPhoneAndTablets,
  getComputers,
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
  isMainCategoryExist,
  isSubCategoryExist,
} from "../Utility/functions.js";
import { cellPhoneAndTabletsModel } from "../Models/Products/cellPhoneAndTabletsModel.js";
import { ListingDeletionModel } from "../Models/Deletions/ListingsDeletions.js";
import { mainCategoryModel } from "../Models/Category/MainCategory.js";
import { subCategoryModel } from "../Models/Category/SubCategory.js";
import { computerModel } from "../Models/Products/computerModel.js";

// create a new listing
export const createListing = async (req, res, next) => {
  try {
    // check the user is authenticated or not
    if (!req.user) {
      res.status(401).json({
        succeess: false,
        message: "User is not authorized",
      });
      return;
    }

    //* check that the main category exist or not
    const { mainCategory, subCategory } = req.body;
    if (!mainCategory) {
      res.status(404).json({
        succeess: false,
        message: "Please provide main category",
      });
      return;
    }

    let mainCategoryExist = await isMainCategoryExist(mainCategory);

    if (!mainCategoryExist) {
      const response = await mainCategoryModel.create({
        name: mainCategory,
      });
      mainCategoryExist = {
        _id: response._id,
        name: response.name,
      };
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
          if (!subCategory) {
            return res.status(404).json({
              succeess: false,
              message: "please provide sub category",
            });
          }

          let subCategoryExist = await isSubCategoryExist(subCategory);
          if (!subCategoryExist) {
            const response = await subCategoryModel.create({
              name: subCategory,
              mainCategoryRef: mainCategoryExist._id,
            });

            subCategoryExist = {
              _id: response._id,
              name: response.name,
            };
          }

          switch (subCategoryExist.name) {
            case cellPhoneAndTablets: {
              const newCellPhone = await cellPhoneAndTabletsModel.create({
                ...req.body,
                userRef: req.user.id,
                mainCategoryId: mainCategoryExist._id,
                subCategoryId: subCategoryExist._id,
                mainCategoryName: mainCategoryExist.name,
                subCategoryName: subCategoryExist.name,
              });
              res.status(201).json(newCellPhone);
              break;
            }
            case computer: {
              const newComputer = await computerModel.create({
                ...req.body,
                userRef: req.user.id,
                mainCategoryId: mainCategoryExist._id,
                subCategoryId: subCategoryExist._id,
                mainCategoryName: mainCategoryExist.name,
                subCategoryName: subCategoryExist.name,
              });
              res.status(201).json(newComputer);
              break;
            }
          }
        }
        break;
    }
    //* check that the sub category exist or not
  } catch (error) {
    console.log(error);
    res.status(500).json({
      succeess: false,
      message: error.message,
    });
  }
};

// Return all listings of a specific user
export const getListings = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }

  try {
    // Fetch all types of listings for the user
    const [estateListings, digitalEquipments, computers] = await Promise.all([
      listingModel.find({ userRef: req.user.id, isDeleted: false }),
      cellPhoneAndTabletsModel.find({ userRef: req.user.id, isDeleted: false }),
      computerModel.find({ userRef: req.user.id, isDeleted: false }),
    ]);

    // Combine all listings into one array
    const allListings = [...estateListings, ...digitalEquipments, ...computers];

    // Optional: sort by createdAt descending
    allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allListings);
  } catch (error) {
    res.status(500).json({
      success: false,
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
          isDeleted: false,
          isApproved: true,
        });
        break;
      }
      case digitalEquipment.toLowerCase(): {
        switch (subCategory) {
          case cellPhoneAndTablets: {
            product = await cellPhoneAndTabletsModel.findOne({
              _id: id,
              isDeleted: false,
              isApproved: true,
            });

            break;
          }
          case computer: {
            product = await computerModel.findOne({
              _id: id,
              isDeleted: false,
              isApproved: true,
            });
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

// delete a single product by id
export const deleteListingById = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }

  const { mainCategoryName, subCategoryName, reason } = req.body;

  try {
    let listing;

    switch (mainCategoryName) {
      case estate:
        listing = await listingModel.findById(req.params.id);
        if (!listing) {
          return res.status(404).json({
            success: false,
            message: "Listing not found",
          });
        }
        await listingModel.findByIdAndUpdate(req.params.id, {
          isDeleted: true,
        });
        break;

      case digitalEquipment:
        switch (subCategoryName) {
          case cellPhoneAndTablets: {
            listing = await cellPhoneAndTabletsModel.findById(req.params.id);
            if (!listing) {
              return res.status(404).json({
                success: false,
                message: "Cell Phone not found",
              });
            }
            await cellPhoneAndTabletsModel.findByIdAndUpdate(req.params.id, {
              isDeleted: true,
            });
            break;
          }
          case computer: {
            listing = await computerModel.findById(req.params.id);
            if (!listing) {
              return res.status(404).json({
                success: false,
                message: "Computer not found",
              });
            }
            await computerModel.findByIdAndUpdate(req.params.id, {
              isDeleted: true,
            });
            break;
          }
        }

        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid main category",
        });
    }

    // Record the deletion in audit collection
    await ListingDeletionModel.create({
      productId: listing._id,
      collectionName: mainCategoryName,
      deletedBy: req.user.id,
      reason,
    });

    return res
      .status(200)
      .json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    return res.status(500).json({
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
        case cellPhoneAndTablets: {
          await getCellPhoneAndTablets(req, res);
          break;
        }
        case computer: {
          await getComputers(req, res);
          break;
        }
        default: {
          break;
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
    console.log(error);
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

//return a list of products based on several ids
// *(return all products that is in favorites list of a user)
export const getListingsById = async (req, res, next) => {
  try {
    // Validate query param
    if (!req.query.ListingsId) {
      return res.status(400).json({
        success: false,
        message: "ListingsId query parameter is required",
      });
    }

    const listingsIds = req.query.ListingsId.split(",");

    // Run all DB queries in parallel
    const [estate, digitalEquipments, computers] = await Promise.all([
      listingModel.find({ _id: { $in: listingsIds } }),
      cellPhoneAndTabletsModel.find({ _id: { $in: listingsIds } }),
      computerModel.find({ _id: { $in: listingsIds } }),
    ]);

    // Merge results
    const listings = [...estate, ...digitalEquipments, ...computers];

    return res.status(200).json(listings);
  } catch (error) {
    return res.status(500).json({
      success: false,
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
    const product = await cellPhoneAndTabletsModel.findOne({
      _id: cellPhoneId,
      isDeleted: false,
      isApproved: true,
    });

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

export const getComputerById = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  const { computerId } = req.params;
  try {
    const product = await computerModel.findOne({
      _id: computerId,
      isDeleted: false,
      isApproved: true,
    });

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

export const updateComputerById = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  const currentUser = req.user.id;
  try {
    const listing = await computerModel.findById(req.params.id);

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

    await computerModel.findByIdAndUpdate(
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
