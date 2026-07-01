const { addUser, removeUser, getUsers } = require("../services/room.service");
const { getRoom, reconnectUser, disconnectUser } = require("../store/room.store");
const { startSessionExpiryWatcher } = require("../services/session.service");

// Logger utility
const logger = {
  info: (msg, data) => console.log(`[ROOM] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[ROOM ERROR] ${msg}`, error || ""),
  warn: (msg, data) => console.warn(`[ROOM WARN] ${msg}`, data || ""),
};

module.exports = (io, socket) => {
  let joinedRoom = null;
  let joinedUserId = null;

  /**
   * JOIN ROOM EVENT
   * User joining room - validates and sets up peer connection
   */
  socket.on("join-room", (data) => {
    try {
      const { roomId, role, userId, reconnect } = data;

      // Validation
      if (!roomId || !role || !userId) {
        logger.error("Invalid join-room data", data);
        socket.emit("room-error", {
          message: "Invalid room join parameters",
        });
        return;
      }

      if (!["tutor", "learner"].includes(role)) {
        logger.error("Invalid role:", role);
        socket.emit("room-error", {
          message: "Invalid role. Must be 'tutor' or 'learner'",
        });
        return;
      }

      joinedRoom = roomId;
      joinedUserId = userId;

      const user = {
        id: userId,
        socketId: socket.id,
        role,
        joinedAt: Date.now(),
      };

      // Store user data on socket for use in other handlers
      socket.user = user;

      socket.join(roomId);
      logger.info(`👤 User joining room`, {
        userId,
        roomId,
        role,
        reconnect,
      });

      /**
       * REFRESH RECONNECT
       * User refreshed page but same session
       */
      if (reconnect) {
        const room = reconnectUser(roomId, user, socket.id);

        if (!room) {
          logger.error("Failed to reconnect user", { userId, roomId });
          socket.emit("room-error", {
            message: "Failed to reconnect",
          });
          socket.leave(roomId);
          return;
        }

        logger.info("✅ User reconnected", { userId });

        socket.emit("room-users", getUsers(roomId));
        socket.to(roomId).emit("user-reconnected", user);

        return;
      }

      /**
       * NEW USER JOIN
       * First time joining room
       */
      const result = addUser(roomId, user);

      if (!result.success) {
        logger.warn("Join rejected", {
          userId,
          message: result.message,
        });

        socket.emit("room-full", {
          message: result.message,
        });

        socket.leave(roomId);
        return;
      }

      logger.info("✅ User added to room", {
        userId,
        roomId,
        role,
      });

      // Send current room users to joining user
      const roomUsers = getUsers(roomId);
      socket.emit("room-users", roomUsers);

      // Check if session already active
      const room = getRoom(roomId);
      if (room && room.status === "active" && room.endsAt) {
        logger.info("📢 Active session exists, sending to new user", {
          endsAt: new Date(room.endsAt).toISOString(),
        });

        socket.emit("session-started", {
          startedAt: room.startedAt,
          endsAt: room.endsAt,
          duration: room.duration,
        });
      }

      // Notify other users about new join
      socket.to(roomId).emit("user-joined", user);

      logger.info("✅ Join-room completed successfully", {
        userId,
        participantCount: roomUsers.length + 1,
      });
    } catch (error) {
      logger.error("join-room exception", error);
      socket.emit("room-error", {
        message: "Failed to join room",
        error: error.message,
      });
    }
  });

  /**
   * START SESSION EVENT
   * Tutor starts the scheduled session
   */
  socket.on("start-session", ({ roomId }) => {
    try {
      if (!roomId || !joinedRoom || roomId !== joinedRoom) {
        logger.error("Invalid start-session roomId", { provided: roomId, joined: joinedRoom });
        socket.emit("session-error", {
          message: "Invalid room ID",
        });
        return;
      }

      const room = getRoom(roomId);

      if (!room) {
        logger.error("Room not found", { roomId });
        socket.emit("session-error", {
          message: "Room not found",
        });
        return;
      }

      // Only tutor can start session
      if (room.users?.tutor?.socketId !== socket.id) {
        logger.warn("Non-tutor attempted to start session", {
          userId: joinedUserId,
          roomId,
        });

        socket.emit("session-error", {
          message: "Only tutor can start session",
        });
        return;
      }

      // Prevent restarting active session
      if (room.status === "active") {
        logger.warn("Session already active", { roomId });
        return;
      }

      // Calculate session duration
      const duration = room.duration || 60; // default 60 minutes
      const startedAt = Date.now();
      const endsAt = startedAt + duration * 60 * 1000;

      // Update room state
      room.status = "active";
      room.startedAt = startedAt;
      room.endsAt = endsAt;

      // Start expiry watcher on server
      startSessionExpiryWatcher(io, roomId);

      logger.info("🎬 Session started", {
        roomId,
        duration,
        startTime: new Date(startedAt).toISOString(),
        endTime: new Date(endsAt).toISOString(),
      });

      // Broadcast to all participants
      io.to(roomId).emit("session-started", {
        startedAt,
        endsAt,
        duration,
      });
    } catch (error) {
      logger.error("start-session exception", error);
      socket.emit("session-error", {
        message: "Failed to start session",
        error: error.message,
      });
    }
  });

  /**
   * LEAVE ROOM EVENT
   * User explicitly leaves the room
   */
  socket.on("leave-room", ({ roomId }) => {
    try {
      if (!roomId || !joinedRoom || roomId !== joinedRoom) {
        logger.error("Invalid leave-room roomId", { provided: roomId, joined: joinedRoom });
        return;
      }

      logger.info("👋 User leaving room", { userId: joinedUserId, roomId });

      removeUser(roomId, socket.id);

      socket.to(roomId).emit("user-left", {
        userId: joinedUserId,
      });

      socket.leave(roomId);
      joinedRoom = null;
      joinedUserId = null;

      logger.info("✅ User left successfully", { roomId });
    } catch (error) {
      logger.error("leave-room exception", error);
    }
  });

  /**
   * DISCONNECT EVENT
   * Socket disconnected (network issue, browser close, etc.)
   */
  socket.on("disconnect", () => {
    try {
      logger.info("🔌 Socket disconnected", { socketId: socket.id, joinedRoom });

      if (!joinedRoom) {
        return;
      }

      // Mark user as temporarily disconnected (grace period for reconnect)
      disconnectUser(joinedRoom, socket.id);

      // Notify others
      socket.to(joinedRoom).emit("user-disconnected", {
        userId: joinedUserId,
      });

      logger.info("✅ Disconnect handled", { joinedRoom, userId: joinedUserId });
    } catch (error) {
      logger.error("disconnect exception", error);
    }
  });

  /**
   * ERROR HANDLER
   * Socket error occurred
   */
  socket.on("error", (error) => {
    logger.error("Socket error", error);
  });
};
