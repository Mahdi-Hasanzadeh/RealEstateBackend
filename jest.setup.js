// jest.setup.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.LocalConnection, { dbName: "testdb" });
});

afterAll(async () => {
  await mongoose.connection.close();
});
