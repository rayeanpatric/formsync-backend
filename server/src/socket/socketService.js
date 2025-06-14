const prisma = require("../services/prismaService");

/**
 * Optimized Socket.IO service for real-time form collaboration
 * Uses in-memory tracking to avoid database latency issues
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function (io) {
  // 🚀 IN-MEMORY STORES FOR REAL-TIME DATA
  const activeUsers = {}; // { formId: [user objects] }
  const fieldLocks = {}; // { "formId:fieldId": lock info }
  const formFieldCache = {}; // Cache field labels to avoid DB calls
  const formDataCache = {}; // Cache form responses in memory for real-time sync

  console.log("🚀 Socket.IO service initialized with in-memory tracking");

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
  function debouncedSave(formId, formData, delay = 2000) {
    // Clear existing timeout
    if (saveTimeouts[formId]) {
      clearTimeout(saveTimeouts[formId]);
    }

    // Set new timeout
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

    // 👥 USER JOINS FORM - PURE IN-MEMORY, INSTANT
    socket.on("join_form", async ({ formId, userId, userName, role }) => {
      console.log(`👤 ${userName} (${role}) joining form ${formId}`);

      // Join the form room instantly
      socket.join(`form:${formId}`);

      // Add user to active users (in-memory)
      if (!activeUsers[formId]) {
        activeUsers[formId] = [];
      }

      // Remove duplicates and add user
      activeUsers[formId] = activeUsers[formId].filter(
        (user) => user.userId !== userId
      );
      activeUsers[formId].push({
        socketId: socket.id,
        userId,
        userName,
        role,
        joinedAt: Date.now(),
      });

      // 🚀 INSTANT BROADCAST - No database calls
      io.to(`form:${formId}`).emit("user_joined", {
        users: activeUsers[formId],
        newUser: { userId, userName, role },
      });

      // Send activity log instantly
      io.to(`form:${formId}`).emit("activity_log", {
        message: `joined the form`,
        userName,
        timestamp: new Date().toISOString(),
        type: "user_joined",
      });

      // Load current form state asynchronously (non-blocking)
      setTimeout(async () => {
        try {
          // Check in-memory cache first
          if (formDataCache[formId]) {
            console.log(`📋 Sending cached form state to ${userName}`);
            socket.emit("form_state", {
              formId,
              response: formDataCache[formId],
            });
            return;
          }

          // Load from database only if not in cache
          const response = await prisma.formResponse.findFirst({
            where: { formId },
          });

          if (response) {
            const responseData = JSON.parse(response.response);
            formDataCache[formId] = responseData; // Cache it

            console.log(`📋 Loaded and cached form state for ${userName}`);
            socket.emit("form_state", {
              formId,
              response: responseData,
            });
          } else {
            // Initialize empty form data
            formDataCache[formId] = {};
          }
        } catch (error) {
          console.error("❌ Error loading form state:", error);
        }
      }, 100); // Small delay to ensure user joined successfully
    });

    // 🔒 FIELD LOCKING - PURE IN-MEMORY, INSTANT
    socket.on("field_lock", async ({ formId, fieldId, userId, userName }) => {
      const lockKey = `${formId}:${fieldId}`;
      console.log(`🔒 ${userName} locking field ${fieldId}`);

      // Set lock instantly (in-memory)
      fieldLocks[lockKey] = {
        userId,
        userName,
        socketId: socket.id,
        timestamp: Date.now(),
      };

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

      // Auto-release lock after 15 seconds
      setTimeout(() => {
        if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
          delete fieldLocks[lockKey];
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
          console.log(`🔓 Auto-released lock for field ${fieldId}`);
        }
      }, 15000);
    });

    // 🔓 FIELD UNLOCKING - INSTANT
    socket.on("field_unlock", ({ formId, fieldId }) => {
      const lockKey = `${formId}:${fieldId}`;
      console.log(`🔓 Unlocking field ${fieldId}`);

      if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
        delete fieldLocks[lockKey];
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

      // Update in-memory cache instantly
      if (!formDataCache[formId]) {
        formDataCache[formId] = {};
      }

      // Get field info and update cache
      const fieldInfo = await getFieldInfo(fieldId);
      formDataCache[formId][fieldInfo.label] = value;

      // Send activity log instantly
      io.to(`form:${formId}`).emit("activity_log", {
        message: `updated field`,
        userName,
        fieldName: fieldInfo.label,
        timestamp: new Date().toISOString(),
        type: "field_update",
      });

      // Auto-release field lock
      const lockKey = `${formId}:${fieldId}`;
      if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
        delete fieldLocks[lockKey];
        io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
      }

      // 💾 DEBOUNCED DATABASE SAVE (non-blocking)
      debouncedSave(formId, formDataCache[formId]);
    });

    // 🚪 USER DISCONNECT - INSTANT CLEANUP
    socket.on("disconnect", () => {
      console.log(`🚪 Client disconnected: ${socket.id}`);

      // Remove user from all active forms instantly
      Object.keys(activeUsers).forEach((formId) => {
        const userIndex = activeUsers[formId].findIndex(
          (u) => u.socketId === socket.id
        );

        if (userIndex !== -1) {
          const user = activeUsers[formId][userIndex];
          activeUsers[formId].splice(userIndex, 1);

          console.log(`👋 ${user.userName} left form ${formId}`);

          // Instant broadcast
          io.to(`form:${formId}`).emit("user_left", {
            users: activeUsers[formId],
            leftUser: { userId: user.userId, userName: user.userName },
          });

          io.to(`form:${formId}`).emit("activity_log", {
            message: `left the form`,
            userName: user.userName,
            timestamp: new Date().toISOString(),
            type: "user_left",
          });

          // Clean up empty forms
          if (activeUsers[formId].length === 0) {
            delete activeUsers[formId];
            // Also clean up form data cache if no users
            delete formDataCache[formId];
            console.log(`🧹 Cleaned up empty form ${formId}`);
          }
        }
      });

      // Release all field locks instantly
      Object.keys(fieldLocks).forEach((lockKey) => {
        if (fieldLocks[lockKey].socketId === socket.id) {
          const [formId, fieldId] = lockKey.split(":");
          delete fieldLocks[lockKey];
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
          console.log(`🔓 Released lock ${lockKey} on disconnect`);
        }
      });
    });

    // 🏥 HEALTH CHECK EVENT (for debugging)
    socket.on("ping", ({ formId }) => {
      const users = activeUsers[formId] || [];
      const locks = Object.keys(fieldLocks).filter((key) =>
        key.startsWith(formId)
      ).length;

      socket.emit("pong", {
        timestamp: Date.now(),
        activeUsers: users.length,
        activeLocks: locks,
        cacheStatus: !!formDataCache[formId],
      });
    });
  });

  // 📊 Log stats every 30 seconds (for monitoring)
  setInterval(() => {
    const totalUsers = Object.values(activeUsers).reduce(
      (sum, users) => sum + users.length,
      0
    );
    const totalLocks = Object.keys(fieldLocks).length;
    const cachedForms = Object.keys(formDataCache).length;

    if (totalUsers > 0) {
      console.log(
        `📊 Stats: ${totalUsers} active users, ${totalLocks} field locks, ${cachedForms} cached forms`
      );
    }
  }, 30000);
};
