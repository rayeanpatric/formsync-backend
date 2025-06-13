const { PrismaClient } = require("@prisma/client");
require("dotenv").config(); // Ensure environment variables are loaded

// Log the DATABASE_URL to confirm it's loaded correctly (remove in production)
console.log(
  "Database URL format check:",
  process.env.DATABASE_URL
    ? `Starts with postgresql://: ${process.env.DATABASE_URL.startsWith(
        "postgresql://"
      )}`
    : "DATABASE_URL is undefined"
);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
