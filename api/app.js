import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import MainCategoryRouter from "./Routes/Category/MainCategoryRoute.js";
import userRouter from "./Routes/userRoute.js";
import errorHandler from "./Middleware/errorHandler.js";
import listingRouter from "./Routes/listingRoute.js";
import dashboardRoute from "./Routes/Dashboard/DashboardRoute.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://smarttrade-afg.netlify.app/",
    "http://localhost:5173",
    "https://mahdi-hasanzadeh.github.io",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(express.static("../public"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/listing", listingRouter);
app.use("/api/category", MainCategoryRouter);
app.use("/api/dashboard", dashboardRoute);
app.use(errorHandler);

export default app;
