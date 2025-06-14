const prisma = require("../services/prismaService");
const Redis = require("ioredis");

/**
 * Redis-enhanced Socket.IO service for ultra-fast real-time collaboration
 * Uses Redis for caching and pub/sub for multi-server scaling
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function (io) {
  // Initialize Redis (optional - falls back to in-memory if not available)
  let redis = null;
  let redisReady = false;
  try {
    // Try to connect to Redis (use REDIS_URL env var or default to localhost)
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1, // Reduced for Upstash
      connectTimeout: 10000, // Increased for Upstash
      lazyConnect: true,
      keepAlive: 30000,
      family: 0, // Auto-detect IPv4/IPv6
      tls: process.env.REDIS_URL?.includes("upstash.io")
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });

    redis.on("connect", () => {
      console.log("🔴 Redis connected successfully");
      redisReady = true;
    });

    redis.on("error", (err) => {
      console.log("❌ Redis error (falling back to in-memory):", err.message);
      redisReady = false;
    });

    // Try to connect
    redis.connect().catch(() => {
      console.log("⚠️  Redis not available, using in-memory storage");
      redis = null;
    });
  } catch (error) {
    console.log("⚠️  Redis not configured, using in-memory storage");
    redis = null;
  }

  // 🚀 HYBRID STORAGE: Redis + In-Memory Fallback
  const inMemoryStore = {
    activeUsers: {},
    fieldLocks: {},
    formFieldCache: {},
    formDataCache: {},
  };

  console.log(
    "🚀 Socket.IO service initialized with Redis + in-memory hybrid storage"
  );

  // 🔧 Helper functions for Redis/In-Memory operations
  async function setCache(key, value, ttl = 3600) {
    try {
      if (redis && redisReady) {
        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.log("❌ Redis set error:", error.message);
    }

    // Fallback to in-memory
    const category = key.split(":")[0];
    if (!inMemoryStore[category]) inMemoryStore[category] = {};
    inMemoryStore[category][key] = value;
    return true;
  }

  async function getCache(key) {
    try {
      if (redis && redisReady) {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.log("❌ Redis get error:", error.message);
    }

    // Fallback to in-memory
    const category = key.split(":")[0];
    return (inMemoryStore[category] && inMemoryStore[category][key]) || null;
  }

  async function deleteCache(key) {
    try {
      if (redis && redisReady) {
        await redis.del(key);
        return true;
      }
    } catch (error) {
      console.log("❌ Redis delete error:", error.message);
    }

    // Fallback to in-memory
    const category = key.split(":")[0];
    if (inMemoryStore[category]) {
      delete inMemoryStore[category][key];
    }
    return true;
  }

  // 📊 Helper function to get form field info (with caching)
  async function getFieldInfo(fieldId) {
    const cacheKey = `field:${fieldId}`;
    let fieldInfo = await getCache(cacheKey);

    if (fieldInfo) {
      return fieldInfo;
    }

    try {
      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        select: { label: true, formId: true },
      });

      if (field) {
        await setCache(cacheKey, field, 1800); // Cache for 30 minutes
        return field;
      }
    } catch (error) {
      console.error("❌ Error fetching field info:", error);
    }

    return { label: "Unknown Field", formId: null };
  }

  // 💾 Helper function to batch save to database (debounced)
  const saveTimeouts = {};
  function debouncedSave(formId, formData, delay = 2000) {
    if (saveTimeouts[formId]) {
      clearTimeout(saveTimeouts[formId]);
    }

    saveTimeouts[formId] = setTimeout(async () => {
      try {
        console.log(`💾 Saving form ${formId} to database...`);

        const existingResponse = await prisma.formResponse.findFirst({
          where: { formId },
        });

        if (existingResponse) {
          await prisma.formResponse.update({
            where: { id: existingResponse.id },
            data: { response: JSON.stringify(formData) },
          });
        } else {
          await prisma.formResponse.create({
            data: {
              formId,
              response: JSON.stringify(formData),
            },
          });
        }

        console.log(`✅ Form ${formId} saved successfully`);
      } catch (error) {
        console.error(`❌ Error saving form ${formId}:`, error);
      } finally {
        delete saveTimeouts[formId];
      }
    }, delay);
  }

  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // 👥 USER JOINS FORM - ULTRA-FAST WITH REDIS
    socket.on("join_form", async ({ formId, userId, userName, role }) => {
      console.log(`👤 ${userName} (${role}) joining form ${formId}`);

      socket.join(`form:${formId}`);

      // Get/update active users with Redis
      const usersKey = `users:${formId}`;
      let activeUsers = (await getCache(usersKey)) || [];

      // Remove duplicates and add user
      activeUsers = activeUsers.filter((user) => user.userId !== userId);
      activeUsers.push({
        socketId: socket.id,
        userId,
        userName,
        role,
        joinedAt: Date.now(),
      });

      await setCache(usersKey, activeUsers, 3600); // Cache for 1 hour

      // 🚀 INSTANT BROADCAST
      io.to(`form:${formId}`).emit("user_joined", {
        users: activeUsers,
        newUser: { userId, userName, role },
      });

      io.to(`form:${formId}`).emit("activity_log", {
        message: `joined the form`,
        userName,
        timestamp: new Date().toISOString(),
        type: "user_joined",
      });

      // Load form state asynchronously
      setTimeout(async () => {
        try {
          const formDataKey = `formdata:${formId}`;
          let formData = await getCache(formDataKey);

          if (formData) {
            console.log(`📋 Sending cached form state to ${userName}`);
            socket.emit("form_state", { formId, response: formData });
            return;
          }

          // Load from database and cache
          const response = await prisma.formResponse.findFirst({
            where: { formId },
          });

          if (response) {
            const responseData = JSON.parse(response.response);
            await setCache(formDataKey, responseData, 1800); // Cache for 30 minutes

            console.log(`📋 Loaded and cached form state for ${userName}`);
            socket.emit("form_state", { formId, response: responseData });
          } else {
            await setCache(formDataKey, {}, 1800);
          }
        } catch (error) {
          console.error("❌ Error loading form state:", error);
        }
      }, 100);
    });

    // 🔒 FIELD LOCKING - REDIS-POWERED
    socket.on("field_lock", async ({ formId, fieldId, userId, userName }) => {
      const lockKey = `lock:${formId}:${fieldId}`;
      console.log(`🔒 ${userName} locking field ${fieldId}`);

      const lockData = {
        userId,
        userName,
        socketId: socket.id,
        timestamp: Date.now(),
      };

      await setCache(lockKey, lockData, 30); // 30 second TTL

      // 🚀 INSTANT BROADCAST
      socket.broadcast.to(`form:${formId}`).emit("field_locked", {
        fieldId,
        lockedBy: { userId, userName },
      });

      // Get field name for activity log (async)
      setTimeout(async () => {
        const fieldInfo = await getFieldInfo(fieldId);
        io.to(`form:${formId}`).emit("activity_log", {
          message: `started editing field`,
          userName,
          fieldName: fieldInfo.label,
          timestamp: new Date().toISOString(),
          type: "field_lock",
        });
      }, 50);
    });

    // 🔓 FIELD UNLOCKING - REDIS-POWERED
    socket.on("field_unlock", async ({ formId, fieldId }) => {
      const lockKey = `lock:${formId}:${fieldId}`;
      console.log(`🔓 Unlocking field ${fieldId}`);

      const lockData = await getCache(lockKey);
      if (lockData && lockData.socketId === socket.id) {
        await deleteCache(lockKey);
        io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
      }
    });

    // ⚡ FIELD CHANGES - INSTANT + REDIS CACHING
    socket.on("field_change", async ({ formId, fieldId, value, userName }) => {
      console.log(
        `⚡ ${userName} updating field ${fieldId} with value:`,
        value
      );

      // 🚀 INSTANT BROADCAST
      socket.broadcast.to(`form:${formId}`).emit("field_update", {
        fieldId,
        value,
      });

      // Update Redis cache
      const formDataKey = `formdata:${formId}`;
      let formData = (await getCache(formDataKey)) || {};

      const fieldInfo = await getFieldInfo(fieldId);
      formData[fieldInfo.label] = value;
      await setCache(formDataKey, formData, 1800);

      // Activity log
      io.to(`form:${formId}`).emit("activity_log", {
        message: `updated field`,
        userName,
        fieldName: fieldInfo.label,
        timestamp: new Date().toISOString(),
        type: "field_update",
      });

      // Auto-unlock field
      const lockKey = `lock:${formId}:${fieldId}`;
      await deleteCache(lockKey);
      io.to(`form:${formId}`).emit("field_unlocked", { fieldId });

      // 💾 DEBOUNCED DATABASE SAVE
      debouncedSave(formId, formData);
    });

    // 🚪 USER DISCONNECT - REDIS CLEANUP
    socket.on("disconnect", async () => {
      console.log(`🚪 Client disconnected: ${socket.id}`);

      // Find and remove user from all forms
      try {
        // In a real Redis setup, you'd use a pattern scan
        // For now, we'll clean up known active forms
        const activeFormIds = Object.keys(inMemoryStore.activeUsers || {});

        for (const formId of activeFormIds) {
          const usersKey = `users:${formId}`;
          let activeUsers = (await getCache(usersKey)) || [];

          const userIndex = activeUsers.findIndex(
            (u) => u.socketId === socket.id
          );
          if (userIndex !== -1) {
            const user = activeUsers[userIndex];
            activeUsers.splice(userIndex, 1);

            if (activeUsers.length > 0) {
              await setCache(usersKey, activeUsers, 3600);
            } else {
              await deleteCache(usersKey);
              await deleteCache(`formdata:${formId}`);
            }

            console.log(`👋 ${user.userName} left form ${formId}`);

            io.to(`form:${formId}`).emit("user_left", {
              users: activeUsers,
              leftUser: { userId: user.userId, userName: user.userName },
            });

            io.to(`form:${formId}`).emit("activity_log", {
              message: `left the form`,
              userName: user.userName,
              timestamp: new Date().toISOString(),
              type: "user_left",
            });
          }
        }
      } catch (error) {
        console.error("❌ Error cleaning up user on disconnect:", error);
      }
    });

    // 🏥 HEALTH CHECK WITH REDIS STATS
    socket.on("ping", async ({ formId }) => {
      const usersKey = `users:${formId}`;
      const users = (await getCache(usersKey)) || [];

      socket.emit("pong", {
        timestamp: Date.now(),
        activeUsers: users.length,
        redisStatus: redisReady ? "connected" : "disconnected",
        storage: redis && redisReady ? "redis" : "in-memory",
      });
    });
  });

  // 📊 Enhanced stats logging
  setInterval(async () => {
    try {
      let totalStats = { users: 0, forms: 0, storage: "in-memory" };

      if (redis && redisReady) {
        const keys = await redis.keys("users:*");
        totalStats.forms = keys.length;
        totalStats.storage = "redis";

        for (const key of keys) {
          const users = await redis.get(key);
          if (users) {
            totalStats.users += JSON.parse(users).length;
          }
        }
      } else {
        totalStats.forms = Object.keys(inMemoryStore.activeUsers || {}).length;
        totalStats.users = Object.values(
          inMemoryStore.activeUsers || {}
        ).reduce((sum, users) => sum + users.length, 0);
      }

      if (totalStats.users > 0) {
        console.log(
          `📊 Stats: ${totalStats.users} users, ${totalStats.forms} forms, ${totalStats.storage} storage`
        );
      }
    } catch (error) {
      console.error("❌ Error getting stats:", error);
    }
  }, 30000);
};
