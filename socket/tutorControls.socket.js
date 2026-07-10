const { getRoom } = require("../store/room.store");
const { stopSessionExpiryWatcher } = require("../services/session.service");

const logger = {
  info: (msg, data) => console.log(`[TUTOR CONTROLS] ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`[TUTOR CONTROLS WARN] ${msg}`, data || ""),
  error: (msg, error) =>
    console.error(`[TUTOR CONTROLS ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  const resolveRoomId = (data) => {
    if (socket.user?.roomId) return socket.user.roomId;
    const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    return data?.roomId || joinedRooms[0] || null;
  };

  /**
   * Every handler in this file is tutor-only. The client hides the
   * buttons for learners, but that's UX only - this is the actual
   * enforcement.
   */
  const requireTutor = () => {
    if (socket.user?.role !== "tutor") {
      logger.warn("Blocked non-tutor attempt", {
        socketId: socket.id,
        userId: socket.user?.id,
        role: socket.user?.role,
      });
      return false;
    }
    return true;
  };

  /**
   * ============================================================
   * FORCE MUTE (tutor -> learner)
   * Relayed to the other participant(s) in the room. The learner can
   * self-unmute afterwards - one-time push, not a lock.
   * ============================================================
   */
  socket.on("force-mute", (data) => {
    try {
      if (!requireTutor()) {
        socket.emit("tutor-control-error", {
          message: "Only the tutor can mute participants.",
        });
        return;
      }

      const roomId = resolveRoomId(data);
      if (!roomId) {
        logger.warn("force-mute blocked: no room resolved", { socketId: socket.id });
        return;
      }

      logger.info("🔇 Tutor forced mute", { roomId, tutorId: socket.user.id });

      socket.to(roomId).emit("force-mute", {
        mutedBy: socket.user.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error("Failed to handle force-mute", error);
    }
  });

  /**
   * ============================================================
   * END SESSION FOR EVERYONE (tutor -> room)
   * Broadcast to the WHOLE room including the tutor's own socket
   * (io.to, not socket.to), so both sides run the exact same
   * session-ended cleanup already implemented client-side in
   * signaling.js.
   * ============================================================
   */
  socket.on("end-session", (data) => {
    try {
      if (!requireTutor()) {
        socket.emit("tutor-control-error", {
          message: "Only the tutor can end the session for everyone.",
        });
        return;
      }

      const roomId = resolveRoomId(data);
      if (!roomId) {
        logger.warn("end-session blocked: no room resolved", { socketId: socket.id });
        return;
      }

      const room = getRoom(roomId);
      if (room) {
        room.status = "ended";
      }

      stopSessionExpiryWatcher(roomId);

      logger.info("🛑 Session ended by tutor", { roomId, tutorId: socket.user.id });

      io.to(roomId).emit("session-ended", {
        endedAt: Date.now(),
        endedBy: socket.user.id,
        reason: "ended-by-tutor",
      });
    } catch (error) {
      logger.error("Failed to handle end-session", error);
    }
  });
};