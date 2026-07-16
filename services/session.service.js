// const { getRoom } = require("../store/room.store");

// // Cache to keep track of active room intervals
// const activeWatchers = new Map();

// // How long before the scheduled end to warn both participants.
// const WARNING_MS = 5 * 60 * 1000; // 5 minutes

// const startSessionExpiryWatcher = (io, roomId) => {
//   // Prevent duplicate intervals for the same room
//   if (activeWatchers.has(roomId)) {
//     clearInterval(activeWatchers.get(roomId));
//   }

//   const interval = setInterval(() => {
//     const room = getRoom(roomId);

//     if (!room) {
//       console.log(`[WATCHER] Cleaning up orphaned watcher for room: ${roomId}`);
//       clearInterval(interval);
//       activeWatchers.delete(roomId);
//       return;
//     }

//     if (room.status !== "active" || !room.endsAt) return;

//     const remainingMs = room.endsAt - Date.now();

//     /**
//      * Warn once, WARNING_MS before the actual end. Checked before the
//      * expiry branch below so both can never fire in the same tick for a
//      * session shorter than WARNING_MS - expiry always wins in that case.
//      */
//     if (!room.warningSent && remainingMs > 0 && remainingMs <= WARNING_MS) {
//       room.warningSent = true;

//       console.log(
//         "⏳ Session ending soon:",
//         roomId,
//         `${Math.round(remainingMs / 1000)}s left`,
//       );

//       io.to(roomId).emit("session-ending-soon", {
//         remainingMs,
//         endsAt: room.endsAt,
//       });
//     }

//     if (remainingMs <= 0) {
//       console.log("⏰ Session expired:", roomId);

//       room.status = "ended";

//       io.to(roomId).emit("session-ended", {
//         endedAt: Date.now(),
//         reason: "expired",
//       });

//       clearInterval(interval);
//       activeWatchers.delete(roomId);
//     }
//   }, 1000);

//   activeWatchers.set(roomId, interval);
// };

// /**
//  * ============================================================
//  * Stop Session Expiry Watcher
//  * Used when a session ends early (tutor manually ends it) so the
//  * per-room interval doesn't keep ticking forever with nothing to do.
//  * ============================================================
//  */
// const stopSessionExpiryWatcher = (roomId) => {
//   if (activeWatchers.has(roomId)) {
//     clearInterval(activeWatchers.get(roomId));
//     activeWatchers.delete(roomId);
//   }
// };

// module.exports = {
//   startSessionExpiryWatcher,
//   stopSessionExpiryWatcher,
//   WARNING_MS,
// };

const { getRoom } = require("../store/room.store");

// Cache to keep track of active room intervals
const activeWatchers = new Map();

// How long before the scheduled end to warn both participants.
const WARNING_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Runs continuously for a room from the moment it's created until the
 * session ends. Handles two transitions off the SAME pre-computed
 * startedAt/endsAt (set at room-creation time from the booking data, see
 * store/room.store.js's resolveScheduledTimes):
 *
 *   1. "waiting" -> "active"  the instant Date.now() reaches startedAt
 *      (only if the room has a real scheduled time - autoStartEligible).
 *      This is the auto-start: nobody has to click a button, the timer
 *      starts exactly at the booked time regardless of when either
 *      participant actually joined.
 *   2. "active" -> warning (5 min out) -> "ended" at endsAt, same as
 *      before.
 *
 * A room with no real booking (autoStartEligible: false, e.g. an ad-hoc
 * test room with no startTime) just sits in "waiting" forever here -
 * those still rely on the manual "start-session" event as a fallback.
 */
const startSessionWatcher = (io, roomId) => {
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

    // --- Auto-start: waiting -> active at the scheduled time ---
    if (room.status === "waiting" && room.autoStartEligible && room.startedAt) {
      if (Date.now() >= room.startedAt) {
        room.status = "active";

        console.log(
          "▶️ Session auto-started (scheduled time reached):",
          roomId,
        );

        io.to(roomId).emit("session-started", {
          startedAt: room.startedAt,
          endsAt: room.endsAt,
          duration: room.session.duration,
        });
      }

      return; // not active yet, nothing else to check this tick
    }

    if (room.status !== "active" || !room.endsAt) return;

    const remainingMs = room.endsAt - Date.now();

    if (!room.warningSent && remainingMs > 0 && remainingMs <= WARNING_MS) {
      room.warningSent = true;

      console.log(
        "⏳ Session ending soon:",
        roomId,
        `${Math.round(remainingMs / 1000)}s left`,
      );

      io.to(roomId).emit("session-ending-soon", {
        remainingMs,
        endsAt: room.endsAt,
      });
    }

    if (remainingMs <= 0) {
      console.log("⏰ Session expired:", roomId);

      room.status = "ended";

      io.to(roomId).emit("session-ended", {
        endedAt: Date.now(),
        reason: "expired",
      });

      clearInterval(interval);
      activeWatchers.delete(roomId);
    }
  }, 1000);

  activeWatchers.set(roomId, interval);
};

const stopSessionWatcher = (roomId) => {
  if (activeWatchers.has(roomId)) {
    clearInterval(activeWatchers.get(roomId));
    activeWatchers.delete(roomId);
  }
};

module.exports = {
  startSessionWatcher,
  stopSessionWatcher,
  // Back-compat aliases - same functions, old names, in case anything
  // else in the codebase still imports under the previous names.
  startSessionExpiryWatcher: startSessionWatcher,
  stopSessionExpiryWatcher: stopSessionWatcher,
  WARNING_MS,
};
