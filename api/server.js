import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { startAgenda } from "./Utility/agenda.js";

dotenv.config();

const port = process.env.PORT || 8001;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO
export const io = new Server(server, {
  cors: {
    origin: [
      "https://smarttrade-afg.netlify.app",
      "http://localhost:3000",
      "https://mahdi-hasanzadeh.github.io",
    ],
    credentials: true,
  },
});

// Map to track online users
export const onlineUsers = new Map();

// Handle WebSocket connections
io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId; // frontend sends userId when connecting
  if (userId) onlineUsers.set(userId, socket);

  console.log(`User connected: ${userId}`);

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    console.log(`User disconnected: ${userId}`);
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(async () => {
    console.log("App connected to database");

    // Start Agenda (background jobs)
    await startAgenda();

    // Start server
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
  });
