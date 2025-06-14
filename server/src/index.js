const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Configure environment variables FIRST
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import routes
const formRoutes = require("./routes/formRoutes");
const userRoutes = require("./routes/userRoutes");
const responseRoutes = require("./routes/responseRoutes");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// 🚀 OPTIMIZED SOCKET.IO CONFIGURATION FOR REAL-TIME PERFORMANCE
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // 🔥 FORCE WEBSOCKET-ONLY (no polling fallback for maximum performance)
  transports: ["websocket"],
  // ⚡ OPTIMIZED TIMEOUTS FOR REAL-TIME RESPONSIVENESS
  pingTimeout: 30000, // Reduced from 60s for faster disconnect detection
  pingInterval: 10000, // Reduced from 25s for more frequent heartbeats
  // 🗜️ ENABLE COMPRESSION FOR BETTER PERFORMANCE
  compression: true,
  // 📦 ALLOW LARGER PAYLOADS FOR FORM DATA
  maxHttpBufferSize: 1e6,
  // 🔄 CONNECTION SETTINGS
  allowEIO3: true,
  // 🛡️ SECURITY SETTINGS
  serveClient: false,
  // ⚡ PERFORMANCE SETTINGS
  connectTimeout: 45000,
});

console.log("🚀 Socket.IO server configured for maximum real-time performance");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/users", userRoutes);
app.use("/api/responses", responseRoutes);

// Socket.IO handling - USE OPTIMIZED SERVICE
require("./socket/socketService-optimized")(io);

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be after all routes)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
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
