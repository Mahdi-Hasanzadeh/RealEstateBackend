import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import MainCategoryRouter from "./Routes/Category/MainCategoryRoute.js";

import userRouter from "./Routes/userRoute.js";
import errorHandler from "./Middleware/errorHandler.js";
import listingRouter from "./Routes/listingRoute.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 8001;

const corsOptions = {
  origin: ["http://localhost:3000", "https://mahdi-hasanzadeh.github.io"], // port of the frontend
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(express.static("../public"));
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/listing", listingRouter);
app.use("/api/category", MainCategoryRouter);
app.use(errorHandler);

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("App connected to database");

    app.listen(port, () => {
      console.log(`server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
