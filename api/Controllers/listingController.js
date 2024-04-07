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
    console.log(listing);
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
