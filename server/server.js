const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Configure environment variables FIRST
dotenv.config({ path: path.join(__dirname, ".env") });

// Import routes
const formRoutes = require("./src/routes/formRoutes");
const userRoutes = require("./src/routes/userRoutes");
const responseRoutes = require("./src/routes/responseRoutes");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// OPTIMIZED SOCKET.IO CONFIGURATION FOR REAL-TIME PERFORMANCE
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3001", // Client URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  // FORCE WEBSOCKET-ONLY (no polling fallback for maximum performance)
  transports: ["websocket"],
  // OPTIMIZED TIMEOUTS FOR REAL-TIME RESPONSIVENESS
  pingTimeout: 30000, // Reduced from 60s for faster disconnect detection
  pingInterval: 10000, // Reduced from 25s for more frequent heartbeats
  // ENABLE COMPRESSION FOR BETTER PERFORMANCE
  compression: true,
  // ALLOW LARGER PAYLOADS FOR FORM DATA
  maxHttpBufferSize: 1e6,
  // CONNECTION SETTINGS
  allowEIO3: true,
  // SECURITY SETTINGS
  serveClient: false,
  // PERFORMANCE SETTINGS
  connectTimeout: 45000,
});

console.log(" Socket.IO server configured for maximum real-time performance");

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/users", userRoutes);
app.use("/api/responses", responseRoutes);

// Socket.IO handling - USE OPTIMIZED SERVICE
require("./src/socket/socketService-redis")(io);

// Error handling middleware (must be after all routes)
const errorHandler = require("./src/middlewares/errorHandler");
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(
    `Client should connect from: ${
      process.env.CLIENT_URL || "http://localhost:3001"
    }`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
