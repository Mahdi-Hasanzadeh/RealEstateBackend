import express from "express";
import { validateToken } from "../../Middleware/validateToken.js";
import { createMainCategory } from "../../Controllers/Category/MainCategoryController.js";
import { createSubCategory } from "../../Controllers/Category/SubCategoryController.js";
const Router = express.Router();

// app.use("/api/mainCategory", MainCategoryRouter);

//Route /api/mainCategory
//Private Route (need authentication)

Router.post("/mainCategory/create", validateToken, createMainCategory);
Router.post("/subCategory/create", validateToken, createSubCategory);
export default Router;
