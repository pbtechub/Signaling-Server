const logger = {
  info: (msg, data) => console.log(`[RECORDING CONSENT] ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`[RECORDING CONSENT WARN] ${msg}`, data || ""),
  error: (msg, error) =>
    console.error(`[RECORDING CONSENT ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  const resolveRoomId = (data) => {
    if (socket.user?.roomId) return socket.user.roomId;
    const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    return data?.roomId || joinedRooms[0] || null;
  };

  socket.on("recording-consent-request", (data) => {
    try {
      const roomId = resolveRoomId(data);
      if (!roomId) {
        logger.warn("Consent request blocked: no room resolved", { socketId: socket.id });
        return;
      }

      const user = socket.user;
      if (!user) {
        logger.error("Unauthorized recording consent request");
        return;
      }

      const requestedBy = data?.requestedBy || { id: user.id, name: user.name };

      logger.info("🔴 Recording consent requested", { roomId, requestedBy });

      socket.to(roomId).emit("recording-consent-request", { requestedBy });
    } catch (error) {
      logger.error("Failed to handle recording-consent-request", error);
    }
  });

  socket.on("recording-consent-response", (data) => {
    try {
      const roomId = resolveRoomId(data);
      if (!roomId) {
        logger.warn("Consent response blocked: no room resolved", { socketId: socket.id });
        return;
      }

      const accepted = Boolean(data?.accepted);

      logger.info(accepted ? "✅ Recording consent accepted" : "🚫 Recording consent declined", {
        roomId,
        respondedBy: socket.user?.id,
      });

      socket.to(roomId).emit("recording-consent-response", { accepted });
    } catch (error) {
      logger.error("Failed to handle recording-consent-response", error);
    }
  });

  // Bonus: relays these so RecordingIndicator.jsx shows the badge on BOTH
  // sides, not just whoever clicked Record - nothing previously handled these.
  socket.on("recording-started", (data) => {
    const roomId = resolveRoomId(data);
    if (!roomId) return;

    logger.info("⏺️ Recording started", { roomId, by: socket.user?.id });

    socket.to(roomId).emit("recording-started", {
      startedBy: socket.user?.id || null,
      timestamp: Date.now(),
    });
  });

  socket.on("recording-stopped", (data) => {
    const roomId = resolveRoomId(data);
    if (!roomId) return;

    logger.info("⏹️ Recording stopped", { roomId, by: socket.user?.id });

    socket.to(roomId).emit("recording-stopped", {
      stoppedBy: socket.user?.id || null,
      timestamp: Date.now(),
    });
  });
};