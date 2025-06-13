const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Import routes
const formRoutes = require("./routes/formRoutes");
const userRoutes = require("./routes/userRoutes");
const responseRoutes = require("./routes/responseRoutes");

// Configure environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/forms", formRoutes);
app.use("/api/users", userRoutes);
app.use("/api/responses", responseRoutes);

// Socket.IO handling
require("./services/socketService")(io);

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
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
