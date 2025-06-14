// Test script for database connection (fullstack version)
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from server directory - use absolute path
const envPath = path.resolve(__dirname, "server", ".env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

console.log("============================================");
console.log("Database Connection Test");
console.log("============================================");
console.log("");

console.log("Environment check:");
console.log("✓ NODE_ENV:", process.env.NODE_ENV || "undefined");
console.log("✓ DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  console.log(
    "✓ DATABASE_URL preview:",
    process.env.DATABASE_URL.substring(0, 25) + "..."
  );
  console.log(
    "✓ Protocol check:",
    process.env.DATABASE_URL.startsWith("postgresql://")
      ? "Valid PostgreSQL URL"
      : "Invalid URL format"
  );
} else {
  console.log("❌ DATABASE_URL not found");
  console.log("");
  console.log("Please ensure server/.env file exists with DATABASE_URL");
  process.exit(1);
}

// Test Prisma connection
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

async function testConnection() {
  try {
    console.log("");
    console.log("Testing database connection...");

    // Simple connection test
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful - Found ${userCount} users`);

    // Test forms
    const formCount = await prisma.form.count();
    console.log(`✅ Found ${formCount} forms in database`);

    console.log("");
    console.log("🎉 Database connection test PASSED!");
    console.log("============================================");
  } catch (error) {
    console.log("");
    console.error("❌ Database connection test FAILED:");
    console.error("Error:", error.message);
    console.log("");
    console.error("Troubleshooting:");
    console.error("1. Check if DATABASE_URL in server/.env file is correct");
    console.error("2. Make sure database is accessible");
    console.error("3. Try running: cd server && npx prisma db push");
    console.error("4. Try running: cd server && npx prisma generate");
    console.log("============================================");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
