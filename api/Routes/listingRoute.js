import express from "express";
import {
  createListing,
  getListings,
  deleteListingById,
  getListingById,
  getListingsWithQuery,
  updateListingById,
  getListingsById,
  getCellPhoneById,
  updateCellPhoneById,
  getComputerById,
  updateComputerById,
  getEstateById,
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
Router.get("/cellPhone/:cellPhoneId", validateToken, getCellPhoneById);
Router.put("/cellPhone/:id", validateToken, updateCellPhoneById);
Router.get("/computer/:computerId", validateToken, getComputerById);
Router.put("/computer/:id", validateToken, updateComputerById);
Router.get("/estate/:id", validateToken, getEstateById);

export default Router;
