// Test script for database connection
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from server directory
const envPath = path.join(__dirname, "server", ".env");
console.log("Loading environment from:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error loading .env file:", result.error);
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");

console.log("Environment variables loaded:");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.log("❌ DATABASE_URL not found in server/.env");
  console.log("Please check your server/.env file configuration.");
  process.exit(1);
}

console.log(
  "DATABASE_URL starts with postgresql://",
  process.env.DATABASE_URL.startsWith("postgresql://")
);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test a simple query
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Connection successful!");
    console.log("Found users:", users.length > 0 ? "Yes" : "No");

    if (users.length > 0) {
      // Don't show password, but show other info
      console.log("Sample user:", {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role,
      });
    }
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
