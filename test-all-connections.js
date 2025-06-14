// Simple connection tests
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "server", ".env") });

console.log("🔍 Environment Check:");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL starts with postgresql:", process.env.DATABASE_URL?.startsWith("postgresql://"));
console.log("REDIS_URL exists:", !!process.env.REDIS_URL);
console.log("UPSTASH_REDIS_REST_URL exists:", !!process.env.UPSTASH_REDIS_REST_URL);
console.log("UPSTASH_REDIS_REST_TOKEN exists:", !!process.env.UPSTASH_REDIS_REST_TOKEN);

async function testConnections() {
  // Test Redis using ioredis
  try {
    const Redis = require("ioredis");
    const redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      tls: { rejectUnauthorized: false }
    });
    
    await redis.connect();
    await redis.set("test", "hello");
    const result = await redis.get("test");
    console.log("✅ Redis (ioredis) working:", result);
    await redis.del("test");
    redis.disconnect();
  } catch (error) {
    console.log("❌ Redis (ioredis) failed:", error.message);
  }

  // Test Upstash Redis
  try {
    const { Redis: UpstashRedis } = require("@upstash/redis");
    const redis = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    await redis.set("upstash-test", "hello");
    const result = await redis.get("upstash-test");
    console.log("✅ Upstash Redis working:", result);
    await redis.del("upstash-test");
  } catch (error) {
    console.log("❌ Upstash Redis failed:", error.message);
  }

  // Test Database
  try {
    // Import from server directory where Prisma client was generated
    const { PrismaClient } = require("./server/node_modules/@prisma/client");
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log("✅ Database query working, user count:", userCount);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log("❌ Database failed:", error.message);
  }
}

testConnections().catch(console.error);
