// Redis Connection Test for Upstash (using ioredis)
const Redis = require("ioredis");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "server", ".env") });

async function testRedisConnection() {
  console.log("🔴 Testing Redis connection...");
  console.log("Redis URL:", process.env.REDIS_URL ? "Set" : "Not set");

  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to Redis successfully!");

    // Test basic operations
    await client.set("test-key", "Hello from Node.js!");
    const value = await client.get("test-key");
    console.log("✅ Test value:", value);

    // Test ping
    const pingResult = await client.ping();
    console.log("✅ Ping result:", pingResult);

    // Cleanup
    await client.del("test-key");
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.log("❌ Redis connection failed:", error.message);
    console.log("Error details:", error);
  } finally {
    client.disconnect();
  }
}

testRedisConnection();
