import express from "express";

import { validateToken } from "../Middleware/validateToken.js";
import { deleteImage } from "../Controllers/cloudinaryController.js";
const Router = express.Router();

// private route(need validation)
Router.delete("/:publicId", validateToken, deleteImage);

export default Router;
