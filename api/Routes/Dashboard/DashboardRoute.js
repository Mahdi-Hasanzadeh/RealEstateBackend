import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import { authorizeAdmin } from "../../Middleware/superadmin.js";
import {
  approveListing,
  getApprovedListings,
  getDashboardInfo,
  getListingByIdForApproval,
  getListingsStats,
  getPendingListings,
  getRejectedListings,
  rejectListing,
} from "../../Controllers/Dashboard/DashboardController.js";
const Router = express.Router();

//Route: api/dashboard/
//public route
Router.get("/", validateToken, authorizeAdmin, getDashboardInfo);
Router.get("/listings/stats", validateToken, authorizeAdmin, getListingsStats);
Router.get(
  "/listings/pending",
  validateToken,
  authorizeAdmin,
  getPendingListings
);

Router.get(
  "/listings/approved",
  validateToken,
  authorizeAdmin,
  getApprovedListings
);

Router.get(
  "/listings/rejected",
  validateToken,
  authorizeAdmin,
  getRejectedListings
);

Router.get(
  "/listing/:id",
  validateToken,
  authorizeAdmin,
  getListingByIdForApproval
);
Router.post("/listings/approve", validateToken, authorizeAdmin, approveListing);
Router.post("/listings/reject", validateToken, authorizeAdmin, rejectListing);

export default Router;
