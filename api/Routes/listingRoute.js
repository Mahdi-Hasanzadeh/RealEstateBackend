import express from "express";
import {
  createListing,
  getListings,
  deleteListingById,
  getListingById,
  getListingsWithQuery,
  updateListingById,
  getListingsById,
} from "../Controllers/listingController.js";
import { validateToken } from "../Middleware/validateToken.js";
const Router = express.Router();

//Route: api/listing/
//public route
Router.get("/get", getListingsWithQuery);

// private route(need validation)
Router.get("/favoriteListings", validateToken, getListingsById);
Router.post("/create", validateToken, createListing);
Router.get("/:id", validateToken, getListings);
Router.delete("/:id", validateToken, deleteListingById);
Router.get("/userListing/:id", validateToken, getListingById);
Router.put("/:id", validateToken, updateListingById);

export default Router;
