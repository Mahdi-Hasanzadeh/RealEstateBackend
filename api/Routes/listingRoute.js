import express from "express";
import {
  createListing,
  getListings,
  deleteListingById,
  getListingById,
} from "../Controllers/listingController.js";
// import { validateToken } from "../Middleware/validateToken.js";
import { validateToken } from "../Middleware/validateToken.js";
const Router = express.Router();

//Route: api/listing/

Router.post("/create", validateToken, createListing);
Router.get("/:id", validateToken, getListings);
Router.delete("/:id", validateToken, deleteListingById);
Router.get("/userListing/:id", validateToken, getListingById);
export default Router;
