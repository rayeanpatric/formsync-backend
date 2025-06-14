const prisma = require("../services/prismaService");
const Redis = require("ioredis");

/**
 * Enhanced Redis-based Socket.IO service with Upstash optimization
 * Uses hybrid approach: ioredis + fallback to in-memory
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function (io) {
  // Initialize Redis (optional - falls back to in-memory if not available)
  let redis = null;
  let redisReady = false;

  try {
    // Optimized Redis configuration for Upstash
    const redisConfig = {
      retryDelayOnFailover: 500,
      maxRetriesPerRequest: 1,
      connectTimeout: 15000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 0,
      enableReadyCheck: false,
      maxRetriesPerRequest: null, // Disable retries for Upstash
    };

    // Add TLS for Upstash
    if (process.env.REDIS_URL?.includes("upstash.io")) {
      redisConfig.tls = { rejectUnauthorized: false };
    }

    redis = new Redis(
      process.env.REDIS_URL || "redis://localhost:6379",
      redisConfig
    );

    redis.on("connect", () => {
      console.log("🔴 Redis connected successfully (Upstash optimized)");
      redisReady = true;
    });

    redis.on("error", (err) => {
      console.log("⚠️ Redis warning (using in-memory fallback):", err.message);
      redisReady = false;
    });

    redis.on("close", () => {
      console.log("🔴 Redis connection closed, using in-memory fallback");
      redisReady = false;
    });

    // Try to connect with error handling
    redis.connect().catch((err) => {
      console.log(
        "⚠️ Redis not available, using in-memory storage:",
        err.message
      );
      redis = null;
    });
  } catch (error) {
    console.log("⚠️ Redis not configured, using in-memory storage");
    redis = null;
  }

  // 🚀 HYBRID STORAGE: Redis + In-Memory Fallback
  const inMemoryStore = {
    activeUsers: {},
    fieldLocks: {},
    formFieldCache: {},
    formDataCache: {},
  };

  // Enhanced Redis operations with fallback
  const redisOps = {
    async set(key, value, expire = 3600) {
      try {
        if (redis && redisReady) {
          if (expire) {
            await redis.setex(key, expire, JSON.stringify(value));
          } else {
            await redis.set(key, JSON.stringify(value));
          }
          return true;
        }
      } catch (error) {
        console.log("Redis set fallback:", error.message);
      }
      // Fallback to in-memory
      return false;
    },

    async get(key) {
      try {
        if (redis && redisReady) {
          const result = await redis.get(key);
          return result ? JSON.parse(result) : null;
        }
      } catch (error) {
        console.log("Redis get fallback:", error.message);
      }
      // Fallback to in-memory
      return null;
    },

    async del(key) {
      try {
        if (redis && redisReady) {
          await redis.del(key);
          return true;
        }
      } catch (error) {
        console.log("Redis del fallback:", error.message);
      }
      return false;
    },

    async publish(channel, message) {
      try {
        if (redis && redisReady) {
          await redis.publish(channel, JSON.stringify(message));
          return true;
        }
      } catch (error) {
        console.log("Redis publish fallback:", error.message);
      }
      return false;
    },
  };

  console.log(
    "🚀 Enhanced Socket.IO service initialized with Redis + in-memory hybrid storage"
  );

  // Rest of the Socket.IO logic (keeping it the same as the original)
  io.on("connection", async (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Handle user joining a form
    socket.on("join-form", async (data) => {
      const { formId, userId, username } = data;

      try {
        // Join the form room
        socket.join(`form-${formId}`);
        socket.formId = formId;
        socket.userId = userId;
        socket.username = username;

        // Store user info in hybrid storage
        const userKey = `user:${socket.id}`;
        const userInfo = {
          formId,
          userId,
          username,
          socketId: socket.id,
          joinedAt: new Date(),
        };

        // Try Redis first, fallback to in-memory
        const redisSet = await redisOps.set(userKey, userInfo, 3600);
        if (!redisSet) {
          inMemoryStore.activeUsers[socket.id] = userInfo;
        }

        // Get form data from database
        const form = await prisma.form.findUnique({
          where: { id: formId },
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
            responses: {
              include: {
                fieldResponses: true,
              },
            },
          },
        });

        if (form) {
          // Cache form data
          const formKey = `form:${formId}`;
          const redisCache = await redisOps.set(formKey, form, 1800);
          if (!redisCache) {
            inMemoryStore.formDataCache[formId] = {
              data: form,
              cachedAt: Date.now(),
            };
          }

          // Send current form data to the joining user
          socket.emit("form-data", form);

          // Get active users for this form
          const activeUsersKey = `active:${formId}`;
          let activeUsers = (await redisOps.get(activeUsersKey)) || [];

          if (!activeUsers.length && inMemoryStore.activeUsers) {
            activeUsers = Object.values(inMemoryStore.activeUsers).filter(
              (u) => u.formId === formId
            );
          }

          // Add current user to active users
          const existingIndex = activeUsers.findIndex(
            (u) => u.userId === userId
          );
          if (existingIndex >= 0) {
            activeUsers[existingIndex] = userInfo;
          } else {
            activeUsers.push(userInfo);
          }

          // Update active users
          const activeSet = await redisOps.set(
            activeUsersKey,
            activeUsers,
            3600
          );
          if (!activeSet) {
            // Update in-memory store
            Object.keys(inMemoryStore.activeUsers).forEach((socketId) => {
              const user = inMemoryStore.activeUsers[socketId];
              if (user.formId === formId) {
                activeUsers.push(user);
              }
            });
          }

          // Broadcast updated user list
          io.to(`form-${formId}`).emit("active-users", activeUsers);

          console.log(`✅ User ${username} joined form ${formId}`);
        }
      } catch (error) {
        console.error("Error in join-form:", error);
        socket.emit("error", { message: "Failed to join form" });
      }
    });

    // Handle field focus (real-time field locking)
    socket.on("field-focus", async (data) => {
      const { formId, fieldId, userId, username } = data;

      try {
        // Store field lock in hybrid storage
        const lockKey = `lock:${formId}:${fieldId}`;
        const lockInfo = {
          userId,
          username,
          socketId: socket.id,
          lockedAt: new Date(),
        };

        const redisLock = await redisOps.set(lockKey, lockInfo, 30);
        if (!redisLock) {
          if (!inMemoryStore.fieldLocks[formId]) {
            inMemoryStore.fieldLocks[formId] = {};
          }
          inMemoryStore.fieldLocks[formId][fieldId] = lockInfo;
        }

        // Broadcast field lock to other users
        socket.to(`form-${formId}`).emit("field-locked", {
          fieldId,
          userId,
          username,
          socketId: socket.id,
        });

        console.log(`🔒 Field ${fieldId} locked by ${username}`);
      } catch (error) {
        console.error("Error in field-focus:", error);
      }
    });

    // Handle field blur (unlock field)
    socket.on("field-blur", async (data) => {
      const { formId, fieldId, userId } = data;

      try {
        // Remove field lock
        const lockKey = `lock:${formId}:${fieldId}`;
        const deleted = await redisOps.del(lockKey);

        if (!deleted && inMemoryStore.fieldLocks[formId]) {
          delete inMemoryStore.fieldLocks[formId][fieldId];
        }

        // Broadcast field unlock
        socket.to(`form-${formId}`).emit("field-unlocked", { fieldId, userId });

        console.log(`🔓 Field ${fieldId} unlocked by user ${userId}`);
      } catch (error) {
        console.error("Error in field-blur:", error);
      }
    });

    // Handle real-time field updates
    socket.on("field-update", async (data) => {
      const { formId, fieldId, value, userId, username } = data;

      try {
        // Cache the field update
        const updateKey = `update:${formId}:${fieldId}`;
        const updateInfo = { value, userId, username, updatedAt: new Date() };

        await redisOps.set(updateKey, updateInfo, 60);

        // Broadcast real-time update to other users
        socket.to(`form-${formId}`).emit("field-updated", {
          fieldId,
          value,
          userId,
          username,
          timestamp: new Date(),
        });

        // Publish to Redis for multi-server support
        await redisOps.publish(`form-updates:${formId}`, {
          type: "field-update",
          fieldId,
          value,
          userId,
          username,
        });
      } catch (error) {
        console.error("Error in field-update:", error);
      }
    });

    // Handle form submission
    socket.on("submit-response", async (data) => {
      const { formId, responses, userId } = data;

      try {
        // Save response to database
        const response = await prisma.response.create({
          data: {
            formId,
            userId,
            fieldResponses: {
              create: responses.map((resp) => ({
                fieldId: resp.fieldId,
                value: resp.value,
              })),
            },
          },
          include: {
            fieldResponses: true,
            user: true,
          },
        });

        // Cache the new response
        const responseKey = `response:${response.id}`;
        await redisOps.set(responseKey, response, 3600);

        // Broadcast new submission to all users in the form
        io.to(`form-${formId}`).emit("new-submission", {
          response,
          submittedBy: response.user?.username || "Anonymous",
          submittedAt: response.createdAt,
        });

        // Publish to Redis for multi-server support
        await redisOps.publish(`form-submissions:${formId}`, {
          type: "new-submission",
          response,
        });

        socket.emit("submission-success", { responseId: response.id });

        console.log(`📝 Form ${formId} submitted by user ${userId}`);
      } catch (error) {
        console.error("Error in submit-response:", error);
        socket.emit("submission-error", {
          message: "Failed to submit response",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      const { formId, userId, username } = socket;

      if (formId) {
        try {
          // Remove user from active users
          const userKey = `user:${socket.id}`;
          await redisOps.del(userKey);
          delete inMemoryStore.activeUsers[socket.id];

          // Update active users list
          const activeUsersKey = `active:${formId}`;
          let activeUsers = (await redisOps.get(activeUsersKey)) || [];
          activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
          await redisOps.set(activeUsersKey, activeUsers, 3600);

          // Remove any field locks held by this user
          if (inMemoryStore.fieldLocks[formId]) {
            Object.keys(inMemoryStore.fieldLocks[formId]).forEach((fieldId) => {
              const lock = inMemoryStore.fieldLocks[formId][fieldId];
              if (lock.socketId === socket.id) {
                delete inMemoryStore.fieldLocks[formId][fieldId];
                socket
                  .to(`form-${formId}`)
                  .emit("field-unlocked", { fieldId, userId });
              }
            });
          }

          // Broadcast updated user list
          io.to(`form-${formId}`).emit("active-users", activeUsers);

          console.log(
            `👋 User ${username || socket.id} disconnected from form ${formId}`
          );
        } catch (error) {
          console.error("Error in disconnect:", error);
        }
      }

      console.log(`👤 User disconnected: ${socket.id}`);
    });
  });
};
