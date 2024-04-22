import express from "express";
import {
  createListing,
  getListings,
  deleteListingById,
  getListingById,
  getListingsWithQuery,
} from "../Controllers/listingController.js";
// import { validateToken } from "../Middleware/validateToken.js";
import { validateToken } from "../Middleware/validateToken.js";
const Router = express.Router();

//Route: api/listing/

Router.post("/create", validateToken, createListing);
Router.get("/get", validateToken, getListingsWithQuery);
Router.get("/:id", validateToken, getListings);
Router.delete("/:id", validateToken, deleteListingById);
Router.get("/userListing/:id", getListingById);
export default Router;
