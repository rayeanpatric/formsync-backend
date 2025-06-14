const Redis = require("ioredis");
const prisma = require("../services/prismaService");

/**
 * Optimized Socket.IO service with Redis for real-time form collaboration
 * Reduces database dependency and improves real-time performance
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function (io) {
  // 🚀 REDIS CLIENT FOR HIGH-PERFORMANCE CACHING
  let redis = null;
  let useRedis = false;

  // Try to connect to Redis (optional - fallback to in-memory if unavailable)
  try {
    redis = new Redis(
      process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      }
    );

    redis.on("connect", () => {
      useRedis = true;
      console.log("🚀 Redis connected - using high-performance caching");
    });

    redis.on("error", (err) => {
      console.log(
        "⚠️  Redis unavailable, falling back to in-memory storage:",
        err.message
      );
      useRedis = false;
    });
  } catch (error) {
    console.log(
      "⚠️  Redis initialization failed, using in-memory storage:",
      error.message
    );
  }

  // 🚀 IN-MEMORY STORES (fallback when Redis unavailable)
  const activeUsers = {}; // { formId: [user objects] }
  const fieldLocks = {}; // { "formId:fieldId": lock info }
  const formFieldCache = {}; // Cache field labels to avoid DB calls
  const formDataCache = {}; // Cache form responses for real-time sync

  console.log("🚀 Optimized Socket.IO service initialized");

  // 📊 Helper function to get/set active users (Redis or in-memory)
  async function getActiveUsers(formId) {
    if (useRedis) {
      try {
        const users = await redis.get(`activeUsers:${formId}`);
        return users ? JSON.parse(users) : [];
      } catch (error) {
        console.log("Redis fallback for getActiveUsers:", error.message);
      }
    }
    return activeUsers[formId] || [];
  }

  async function setActiveUsers(formId, users) {
    if (useRedis) {
      try {
        await redis.setex(`activeUsers:${formId}`, 300, JSON.stringify(users)); // 5min expiry
      } catch (error) {
        console.log("Redis fallback for setActiveUsers:", error.message);
      }
    }
    activeUsers[formId] = users;
  }

  // 📊 Helper function to get/set field locks (Redis or in-memory)
  async function getFieldLock(formId, fieldId) {
    const lockKey = `${formId}:${fieldId}`;
    if (useRedis) {
      try {
        const lock = await redis.get(`fieldLock:${lockKey}`);
        return lock ? JSON.parse(lock) : null;
      } catch (error) {
        console.log("Redis fallback for getFieldLock:", error.message);
      }
    }
    return fieldLocks[lockKey] || null;
  }

  async function setFieldLock(formId, fieldId, lockData) {
    const lockKey = `${formId}:${fieldId}`;
    if (useRedis) {
      try {
        await redis.setex(`fieldLock:${lockKey}`, 30, JSON.stringify(lockData)); // 30sec expiry
      } catch (error) {
        console.log("Redis fallback for setFieldLock:", error.message);
      }
    }
    fieldLocks[lockKey] = lockData;
  }

  async function removeFieldLock(formId, fieldId) {
    const lockKey = `${formId}:${fieldId}`;
    if (useRedis) {
      try {
        await redis.del(`fieldLock:${lockKey}`);
      } catch (error) {
        console.log("Redis fallback for removeFieldLock:", error.message);
      }
    }
    delete fieldLocks[lockKey];
  }

  // 📊 Helper function to get/set form data cache (Redis or in-memory)
  async function getFormData(formId) {
    if (useRedis) {
      try {
        const data = await redis.get(`formData:${formId}`);
        return data ? JSON.parse(data) : {};
      } catch (error) {
        console.log("Redis fallback for getFormData:", error.message);
      }
    }
    return formDataCache[formId] || {};
  }

  async function setFormData(formId, data) {
    if (useRedis) {
      try {
        await redis.setex(`formData:${formId}`, 1800, JSON.stringify(data)); // 30min expiry
      } catch (error) {
        console.log("Redis fallback for setFormData:", error.message);
      }
    }
    formDataCache[formId] = data;
  }

  // 📊 Helper function to get form field info (with caching)
  async function getFieldInfo(fieldId) {
    if (formFieldCache[fieldId]) {
      return formFieldCache[fieldId];
    }

    try {
      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        select: { label: true, formId: true },
      });

      if (field) {
        formFieldCache[fieldId] = field;
        return field;
      }
    } catch (error) {
      console.error("❌ Error fetching field info:", error);
    }

    return { label: "Unknown Field", formId: null };
  }

  // 💾 Helper function to batch save to database (debounced)
  const saveTimeouts = {};
  function debouncedSave(formId, formData, delay = 3000) {
    // Clear existing timeout
    if (saveTimeouts[formId]) {
      clearTimeout(saveTimeouts[formId]);
    }

    // Set new timeout for batch saving
    saveTimeouts[formId] = setTimeout(async () => {
      try {
        console.log(`💾 Saving form ${formId} to database...`);

        // Check if response exists
        const existingResponse = await prisma.formResponse.findFirst({
          where: { formId },
        });

        if (existingResponse) {
          // Update existing response
          await prisma.formResponse.update({
            where: { id: existingResponse.id },
            data: {
              response: JSON.stringify(formData),
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new response
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

  // 🔌 SOCKET.IO CONNECTION HANDLER
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // 👥 USER JOINS FORM - OPTIMIZED WITH REDIS/IN-MEMORY
    socket.on("join_form", async ({ formId, userId, userName, role }) => {
      console.log(`👤 ${userName} (${role}) joining form ${formId}`);

      // Join the form room instantly
      socket.join(`form:${formId}`);

      // Get current active users
      const currentUsers = await getActiveUsers(formId);

      // Remove duplicates and add user
      const filteredUsers = currentUsers.filter(
        (user) => user.userId !== userId
      );
      const updatedUsers = [
        ...filteredUsers,
        {
          socketId: socket.id,
          userId,
          userName,
          role,
          joinedAt: Date.now(),
        },
      ];

      // Save updated user list
      await setActiveUsers(formId, updatedUsers);

      // 🚀 INSTANT BROADCAST - No database calls
      io.to(`form:${formId}`).emit("user_joined", {
        users: updatedUsers,
        newUser: { userId, userName, role },
      });

      // Send activity log instantly
      io.to(`form:${formId}`).emit("activity_log", {
        message: `joined the form`,
        userName,
        timestamp: new Date().toISOString(),
        type: "user_joined",
      });

      console.log(
        `✅ ${userName} joined form ${formId} (${updatedUsers.length} active users)`
      );

      // Load current form state asynchronously (non-blocking)
      setTimeout(async () => {
        try {
          // Check cache first
          const cachedData = await getFormData(formId);
          if (Object.keys(cachedData).length > 0) {
            console.log(`📋 Sending cached form state to ${userName}`);
            socket.emit("form_state", {
              formId,
              response: cachedData,
            });
            return;
          }

          // Load from database only if not in cache
          const response = await prisma.formResponse.findFirst({
            where: { formId },
          });

          if (response) {
            const responseData = JSON.parse(response.response);
            await setFormData(formId, responseData); // Cache it

            console.log(`📋 Loaded and cached form state for ${userName}`);
            socket.emit("form_state", {
              formId,
              response: responseData,
            });
          } else {
            // Initialize empty form data
            await setFormData(formId, {});
          }
        } catch (error) {
          console.error("❌ Error loading form state:", error);
        }
      }, 100); // Small delay to ensure user joined successfully
    });

    // 🔒 FIELD LOCKING - PURE CACHE, INSTANT
    socket.on("field_lock", async ({ formId, fieldId, userId, userName }) => {
      console.log(`🔒 ${userName} locking field ${fieldId}`);

      // Set lock instantly (Redis/in-memory)
      await setFieldLock(formId, fieldId, {
        userId,
        userName,
        socketId: socket.id,
        timestamp: Date.now(),
      });

      // 🚀 INSTANT BROADCAST - No database calls
      socket.broadcast.to(`form:${formId}`).emit("field_locked", {
        fieldId,
        lockedBy: { userId, userName },
      });

      // Get field name asynchronously for activity log
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

      // Auto-release lock after 20 seconds (longer timeout for better UX)
      setTimeout(async () => {
        const currentLock = await getFieldLock(formId, fieldId);
        if (currentLock && currentLock.socketId === socket.id) {
          await removeFieldLock(formId, fieldId);
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
          console.log(`🔓 Auto-released lock for field ${fieldId}`);
        }
      }, 20000);
    });

    // 🔓 FIELD UNLOCKING - INSTANT
    socket.on("field_unlock", async ({ formId, fieldId }) => {
      console.log(`🔓 Unlocking field ${fieldId}`);

      const currentLock = await getFieldLock(formId, fieldId);
      if (currentLock && currentLock.socketId === socket.id) {
        await removeFieldLock(formId, fieldId);
        io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
      }
    });

    // ⚡ FIELD CHANGES - INSTANT BROADCAST + DEBOUNCED SAVE
    socket.on("field_change", async ({ formId, fieldId, value, userName }) => {
      console.log(
        `⚡ ${userName} updating field ${fieldId} with value:`,
        value
      );

      // 🚀 INSTANT BROADCAST TO OTHER USERS
      socket.broadcast.to(`form:${formId}`).emit("field_update", {
        fieldId,
        value,
      });

      // Update cache instantly
      const currentFormData = await getFormData(formId);
      const fieldInfo = await getFieldInfo(fieldId);
      currentFormData[fieldInfo.label] = value;
      await setFormData(formId, currentFormData);

      // Send activity log instantly
      io.to(`form:${formId}`).emit("activity_log", {
        message: `updated field`,
        userName,
        fieldName: fieldInfo.label,
        timestamp: new Date().toISOString(),
        type: "field_update",
      });

      // Auto-release field lock
      const currentLock = await getFieldLock(formId, fieldId);
      if (currentLock && currentLock.socketId === socket.id) {
        await removeFieldLock(formId, fieldId);
        io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
      }

      // 💾 DEBOUNCED DATABASE SAVE (non-blocking)
      debouncedSave(formId, currentFormData);
    });

    // 🚪 USER DISCONNECT - INSTANT CLEANUP
    socket.on("disconnect", async () => {
      console.log(`🚪 Client disconnected: ${socket.id}`);

      // Remove user from all active forms instantly
      const allFormIds = useRedis
        ? (await redis.keys("activeUsers:*")).map((key) =>
            key.replace("activeUsers:", "")
          )
        : Object.keys(activeUsers);

      for (const formId of allFormIds) {
        const currentUsers = await getActiveUsers(formId);
        const userIndex = currentUsers.findIndex(
          (u) => u.socketId === socket.id
        );

        if (userIndex !== -1) {
          const user = currentUsers[userIndex];
          currentUsers.splice(userIndex, 1);
          await setActiveUsers(formId, currentUsers);

          console.log(`👋 ${user.userName} left form ${formId}`);

          // Instant broadcast
          io.to(`form:${formId}`).emit("user_left", {
            users: currentUsers,
            leftUser: { userId: user.userId, userName: user.userName },
          });

          io.to(`form:${formId}`).emit("activity_log", {
            message: `left the form`,
            userName: user.userName,
            timestamp: new Date().toISOString(),
            type: "user_left",
          });

          // Clean up empty forms
          if (currentUsers.length === 0) {
            if (useRedis) {
              await redis.del(`activeUsers:${formId}`);
              await redis.del(`formData:${formId}`);
            } else {
              delete activeUsers[formId];
              delete formDataCache[formId];
            }
            console.log(`🧹 Cleaned up empty form ${formId}`);
          }
        }
      }

      // Release all field locks instantly
      const allLockKeys = useRedis
        ? await redis.keys("fieldLock:*")
        : Object.keys(fieldLocks);

      for (const lockKey of allLockKeys) {
        const currentLock = useRedis
          ? JSON.parse((await redis.get(lockKey)) || "null")
          : fieldLocks[lockKey];

        if (currentLock && currentLock.socketId === socket.id) {
          const [formId, fieldId] = (
            useRedis ? lockKey.replace("fieldLock:", "") : lockKey
          ).split(":");

          if (useRedis) {
            await redis.del(lockKey);
          } else {
            delete fieldLocks[lockKey];
          }

          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
          console.log(`🔓 Released lock ${lockKey} on disconnect`);
        }
      }
    });

    // 🏥 HEALTH CHECK EVENT (for debugging)
    socket.on("ping", async ({ formId }) => {
      const users = await getActiveUsers(formId);
      const lockCount = useRedis
        ? (await redis.keys(`fieldLock:${formId}:*`)).length
        : Object.keys(fieldLocks).filter((key) => key.startsWith(formId))
            .length;

      socket.emit("pong", {
        timestamp: Date.now(),
        activeUsers: users.length,
        activeLocks: lockCount,
        cacheStatus: useRedis ? "Redis" : "In-Memory",
        redisConnected: useRedis,
      });
    });
  });

  // 📊 Log stats every 30 seconds (for monitoring)
  setInterval(async () => {
    try {
      let totalUsers = 0;
      let totalLocks = 0;
      let cachedForms = 0;

      if (useRedis) {
        const userKeys = await redis.keys("activeUsers:*");
        const lockKeys = await redis.keys("fieldLock:*");
        const dataKeys = await redis.keys("formData:*");

        for (const key of userKeys) {
          const users = JSON.parse((await redis.get(key)) || "[]");
          totalUsers += users.length;
        }
        totalLocks = lockKeys.length;
        cachedForms = dataKeys.length;
      } else {
        totalUsers = Object.values(activeUsers).reduce(
          (sum, users) => sum + users.length,
          0
        );
        totalLocks = Object.keys(fieldLocks).length;
        cachedForms = Object.keys(formDataCache).length;
      }

      if (totalUsers > 0) {
        console.log(
          `📊 Stats: ${totalUsers} active users, ${totalLocks} field locks, ${cachedForms} cached forms [${
            useRedis ? "Redis" : "In-Memory"
          }]`
        );
      }
    } catch (error) {
      console.log("Stats collection error:", error.message);
    }
  }, 30000);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    if (redis) {
      await redis.quit();
    }
  });
};
