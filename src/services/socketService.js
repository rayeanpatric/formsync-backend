const prisma = require("./prismaService");

/**
 * Socket.IO service to handle real-time form collaboration
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function (io) {
  // Keep track of users editing each form
  const activeUsers = {};

  // Keep track of field locks (which user is editing which field)
  const fieldLocks = {};

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id); // User joins a form editing session
    socket.on("join_form", async ({ formId, userId, userName, role }) => {
      // Join the form room
      socket.join(`form:${formId}`);

      // Add user to active users for this form
      if (!activeUsers[formId]) {
        activeUsers[formId] = [];
      }

      // Remove any existing entry for this user to prevent duplicates
      activeUsers[formId] = activeUsers[formId].filter(
        (user) => user.userId !== userId
      );

      // Add the user
      activeUsers[formId].push({
        socketId: socket.id,
        userId,
        userName,
        role,
      });

      // Notify all users in the room that a new user has joined
      io.to(`form:${formId}`).emit("user_joined", {
        users: activeUsers[formId],
        newUser: { userId, userName, role },
      });

      // Get the current form response to sync the new user
      try {
        const response = await prisma.formResponse.findFirst({
          where: { formId },
        });

        if (response) {
          // Send the current state to just the new user
          socket.emit("form_state", {
            formId,
            response: JSON.parse(response.response),
          });
        }
      } catch (error) {
        console.error("Error fetching form state:", error);
      }

      // Broadcast activity
      io.to(`form:${formId}`).emit("activity_log", {
        message: `joined the form`,
        userName,
        timestamp: new Date().toISOString(),
        type: "user_joined",
      });
    }); // User locks a field for editing
    socket.on("field_lock", async ({ formId, fieldId, userId, userName }) => {
      const lockKey = `${formId}:${fieldId}`;

      // Get field name from database
      let fieldName = "Unknown Field";
      try {
        const field = await prisma.field.findUnique({
          where: { id: fieldId },
          select: { label: true },
        });
        if (field) {
          fieldName = field.label;
        }
      } catch (error) {
        console.error("Error fetching field name:", error);
      }

      // Set the lock
      fieldLocks[lockKey] = {
        userId,
        userName,
        socketId: socket.id,
        timestamp: Date.now(),
      };

      // Broadcast to all other users in the form
      socket.broadcast.to(`form:${formId}`).emit("field_locked", {
        fieldId,
        lockedBy: { userId, userName },
      });

      // Broadcast activity
      io.to(`form:${formId}`).emit("activity_log", {
        message: `started editing field`,
        userName,
        fieldName,
        timestamp: new Date().toISOString(),
        type: "field_lock",
      });

      // Auto-release lock after 10 seconds of inactivity
      setTimeout(() => {
        if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
          delete fieldLocks[lockKey];
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
        }
      }, 10000);
    });

    // User releases a field lock
    socket.on("field_unlock", ({ formId, fieldId }) => {
      const lockKey = `${formId}:${fieldId}`;

      if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
        delete fieldLocks[lockKey];
        io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
      }
    }); // User updates a field value
    socket.on("field_change", async ({ formId, fieldId, value, userName }) => {
      try {
        // Get field name from database
        let fieldName = "Unknown Field";
        try {
          const field = await prisma.field.findUnique({
            where: { id: fieldId },
            select: { label: true },
          });
          if (field) {
            fieldName = field.label;
          }
        } catch (error) {
          console.error("Error fetching field name:", error);
        }

        // Get the current response
        let response = await prisma.formResponse.findFirst({
          where: { formId },
        });

        // If no response exists yet, create one
        if (!response) {
          // Use the field label instead of ID as the key
          const newResponse = { [fieldName]: value };

          await prisma.formResponse.create({
            data: {
              formId,
              response: JSON.stringify(newResponse),
            },
          });

          // Broadcast to all other users (still using fieldId on the client side)
          socket.broadcast.to(`form:${formId}`).emit("field_update", {
            fieldId, // Keep fieldId for client-side reference
            value,
          });
        } else {
          // Update existing response
          const responseData = JSON.parse(response.response);
          // Use field label as the key
          responseData[fieldName] = value;

          await prisma.formResponse.update({
            where: { id: response.id },
            data: { response: JSON.stringify(responseData) },
          });

          // Broadcast to all other users
          socket.broadcast.to(`form:${formId}`).emit("field_update", {
            fieldId,
            value,
          });
        }

        // Broadcast activity
        if (userName) {
          io.to(`form:${formId}`).emit("activity_log", {
            message: `updated field`,
            userName,
            fieldName,
            timestamp: new Date().toISOString(),
            type: "field_update",
          });
        }

        // Auto-release field lock
        const lockKey = `${formId}:${fieldId}`;
        if (fieldLocks[lockKey] && fieldLocks[lockKey].socketId === socket.id) {
          delete fieldLocks[lockKey];
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
        }
      } catch (error) {
        console.error("Error updating form response:", error);
        socket.emit("error", { message: "Failed to update response" });
      }
    }); // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Remove user from all active forms
      Object.keys(activeUsers).forEach((formId) => {
        const userIndex = activeUsers[formId].findIndex(
          (u) => u.socketId === socket.id
        );

        if (userIndex !== -1) {
          const user = activeUsers[formId][userIndex];
          activeUsers[formId].splice(userIndex, 1); // Broadcast activity
          io.to(`form:${formId}`).emit("activity_log", {
            message: `left the form`,
            userName: user.userName,
            timestamp: new Date().toISOString(),
            type: "user_left",
          });

          // Notify others that user has left
          io.to(`form:${formId}`).emit("user_left", {
            users: activeUsers[formId],
            leftUser: { userId: user.userId, userName: user.userName },
          });

          // Clean up empty forms
          if (activeUsers[formId].length === 0) {
            delete activeUsers[formId];
          }
        }
      });

      // Release all field locks held by this socket
      Object.keys(fieldLocks).forEach((lockKey) => {
        if (fieldLocks[lockKey].socketId === socket.id) {
          const [formId, fieldId] = lockKey.split(":");
          delete fieldLocks[lockKey];
          io.to(`form:${formId}`).emit("field_unlocked", { fieldId });
        }
      });
    });
  });
};
