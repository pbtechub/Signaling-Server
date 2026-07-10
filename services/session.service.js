const { getRoom } = require("../store/room.store");

// Cache to keep track of active room intervals
const activeWatchers = new Map();

const startSessionExpiryWatcher = (io, roomId) => {
  // Prevent duplicate intervals for the same room
  if (activeWatchers.has(roomId)) {
    clearInterval(activeWatchers.get(roomId));
  }

  const interval = setInterval(() => {
    const room = getRoom(roomId);

    if (!room) {
      console.log(`[WATCHER] Cleaning up orphaned watcher for room: ${roomId}`);
      clearInterval(interval);
      activeWatchers.delete(roomId);
      return;
    }

    if (room.status === "active" && room.endsAt && Date.now() >= room.endsAt) {
      console.log("⏰ Session expired:", roomId);

      room.status = "ended";

      io.to(roomId).emit("session-ended", {
        endedAt: Date.now(),
      });

      clearInterval(interval);
      activeWatchers.delete(roomId);
    }
  }, 1000);

  activeWatchers.set(roomId, interval);
};

/**
 * ============================================================
 * Stop Session Expiry Watcher
 * Used when a session ends early (tutor manually ends it) so the
 * per-room interval doesn't keep ticking forever with nothing to do.
 * ============================================================
 */
const stopSessionExpiryWatcher = (roomId) => {
  if (activeWatchers.has(roomId)) {
    clearInterval(activeWatchers.get(roomId));
    activeWatchers.delete(roomId);
  }
};

module.exports = {
  startSessionExpiryWatcher,
  stopSessionExpiryWatcher,
};
