// Direct connection test
// This file tests a direct connection without using the .env file

const { PrismaClient } = require("@prisma/client");

const connectionString =
  "postgresql://neondb_owner:npg_jpbF5x0hvQGC@ep-icy-sound-a1q58rky-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Testing with connection string:", connectionString);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

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
