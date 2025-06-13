/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;
