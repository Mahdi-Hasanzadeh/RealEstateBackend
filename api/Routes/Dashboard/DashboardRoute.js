import express from "express";

import { validateToken } from "../../Middleware/validateToken.js";
import { authorizeAdmin } from "../../Middleware/superadmin.js";
import { getDashboardInfo } from "../../Controllers/Dashboard/DashboardController.js";
const Router = express.Router();

//Route: api/dashboard/
//public route
Router.get("/", validateToken, authorizeAdmin, getDashboardInfo);

export default Router;
