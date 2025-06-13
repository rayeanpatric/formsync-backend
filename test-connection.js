// Force loading the environment variables from the .env file
const path = require("path");
const dotenv = require("dotenv");

// Load .env file explicitly from the current directory
const envPath = path.resolve(process.cwd(), ".env");
console.log("Loading .env from:", envPath);

const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  console.error("Error loading .env file:", result.error);
}

// Force setting the DATABASE_URL
process.env.DATABASE_URL =
  "postgresql://neondb_owner:npg_jpbF5x0hvQGC@ep-icy-sound-a1q58rky-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("DATABASE_URL after setting:", process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("Database version:", result);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
