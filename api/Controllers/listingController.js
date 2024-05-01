import asyncHandler from "express-async-handler";

import { listingModel } from "../Models/listingModel.js";

export const createListing = async (req, res, next) => {
  console.log("creating list");
  try {
    if (!req.user) {
      res.json({
        succeess: false,
        message: "User is not authorized",
      });
      return;
    }
    console.log(req.body);
    const listing = await listingModel.create({
      ...req.body,
      userRef: req.user.id,
    });
    res.status(201).json(listing);
  } catch (error) {
    console.log(error.message);
    res.json({
      succeess: false,
      message: error.message,
    });
  }
};

// Return all listings of a specific user
export const getListings = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      succeess: false,
      message: "user is not authorized",
    });
    return;
  }
  try {
    console.log(req.params.id);

    const userListing = await listingModel.find({ userRef: req.user.id });
    // console.log(userListing);
    res.status(200).json(userListing);
  } catch (error) {
    res.json({
      succeess: false,
      message: error.message,
    });
  }
};

// Return listing by id

export const getListingById = async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authorized",
    });
  }
  try {
    const listing = await listingModel.findById(req.params.id);
    // console.log(listing);
    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Not found",
      });
      return;
    }
    res.status(200).json(listing);
  } catch (error) {
    // console.log("error: ", error);
    // console.log("error: ", error.message);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

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
    console.log("Listing Deleted");
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getListingsWithQuery = async (req, res, next) => {
  // queries:  1: searchTerm, 2:type, 3:parking. 4:furnished 5: offer,
  // 6: sort 7: order 8: limit

  const limit = parseInt(req.query.limit) || 9;
  console.log("limit: ", req.query.limit);
  const startIndex = parseInt(req.query.startIndex) || 0;

  // console.log(req.query);

  let offer = req.query.offer;
  // console.log(offer, offer);
  // if (offer == undefined || offer === "false") {
  //   console.log("insider");
  //   offer = { $in: [false, true] };
  // }
  console.log("offer: ", req.query.offer);
  if (offer == undefined || offer === "false") {
    offer = { $in: [true, false] };
    console.log("offer query", offer);
  }

  let furnished = req.query.furnished;
  console.log("furnished", req.query.furnished);
  if (furnished == undefined || furnished === "false") {
    furnished = { $in: [true, false] };
    console.log("furnished query", furnished);
  }

  let parking = req.query.parking;
  console.log("parking", req.query.parking);
  if (parking == undefined || parking === "false") {
    parking = { $in: [true, false] };
    console.log("parking query", parking);
  }

  let type = req.query.type;
  console.log("type: ", req.query.type);
  if (type == undefined || type === "all") {
    type = { $in: ["sell", "rent"] };
    console.log("type", type);
  }

  const searchTerm = req.query.searchTerm || "";
  console.log("searchTerm: ", searchTerm);

  const sort = req.query.sort || "desc";

  const order = req.query.order || "createdAt";

  console.log(searchTerm, type, parking, furnished, offer, sort, order);

  try {
    // const listings = await listingModel
    //   .find({
    //     name: { $regex: searchTerm, $options: "i" }, // search the term in the name
    //     //section and it is like contain in csharp, and options(i) means that
    //     //it checks both for uppercase and lowercase.
    //     offer: offer,
    //     parking: parking,
    //     furnished: furnished,
    //     type: type,
    //   })
    //   .sort({
    //     [order]: sort,
    //   })
    //   .limit(limit)
    //   .skip(startIndex);

    // const listings = await listingModel.find({});
    const listings = await listingModel
      .find({
        name: { $regex: searchTerm, $options: "i" },
        offer,
        furnished,
        parking,
        type,
      })
      .sort({ [order]: sort })
      .limit(limit)
      .skip(startIndex);
    console.log("your listing is:", listings.length);
    return res.status(200).json({ listings, message: true });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// update listings by id
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
    console.log("update Failed: ", error.message);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getListingsById = async (req, res, next) => {
  // console.log("get favorites");
  // console.log(req.query.ListingsId);
  const listingsIds = req.query.ListingsId.split(",");
  // console.log(listingsIds);
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
