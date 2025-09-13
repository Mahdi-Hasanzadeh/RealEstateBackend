import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startAgenda } from "./Utility/agenda.js"; // <-- import Agenda starter

dotenv.config();

const port = process.env.PORT || 8001;

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(async () => {
    console.log("App connected to database");

    // Start Agenda after DB connection
    await startAgenda();

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
