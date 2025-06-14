// Redis Connection Test for Upstash (using both ioredis and @upstash/redis)
const Redis = require("ioredis");
const { Redis: UpstashRedis } = require("@upstash/redis");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "server", ".env") });

async function testUpstashRedis() {
  console.log("🔴 Testing Upstash Redis connection (REST API)...");
  console.log(
    "Upstash URL:",
    process.env.UPSTASH_REDIS_REST_URL ? "Set" : "Not set"
  );
  console.log(
    "Upstash Token:",
    process.env.UPSTASH_REDIS_REST_TOKEN ? "Set" : "Not set"
  );

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.log("❌ Upstash credentials missing");
    return;
  }

  try {
    const redis = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test basic operations
    await redis.set("upstash-test", "Hello from Upstash!");
    const value = await redis.get("upstash-test");
    console.log("✅ Upstash test value:", value);

    // Test ping
    const pingResult = await redis.ping();
    console.log("✅ Upstash ping result:", pingResult);

    // Cleanup
    await redis.del("upstash-test");
    console.log("✅ Upstash cleanup completed");
  } catch (error) {
    console.log("❌ Upstash Redis connection failed:", error.message);
  }
}

async function testIORedis() {
  console.log("\n🔴 Testing Redis connection (ioredis)...");
  console.log("Redis URL:", process.env.REDIS_URL ? "Set" : "Not set");

  if (!process.env.REDIS_URL) {
    console.log("❌ REDIS_URL not set");
    return;
  }

  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ ioredis connected successfully!");

    // Test basic operations
    await client.set("ioredis-test", "Hello from ioredis!");
    const value = await client.get("ioredis-test");
    console.log("✅ ioredis test value:", value);

    // Test ping
    const pingResult = await client.ping();
    console.log("✅ ioredis ping result:", pingResult);

    // Cleanup
    await client.del("ioredis-test");
    console.log("✅ ioredis cleanup completed");
  } catch (error) {
    console.log("❌ ioredis connection failed:", error.message);
  } finally {
    client.disconnect();
  }
}

async function runTests() {
  await testUpstashRedis();
  await testIORedis();
}

runTests();
