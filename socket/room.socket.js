// const { addUser, removeUser, getUsers } = require("../services/room.service");

// const { getRoom, disconnectUser } = require("../store/room.store");

// const { startSessionExpiryWatcher } = require("../services/session.service");

// const normalizeSessionPayload = (data = {}) => {
//   const payload = data?.data || data || {};
//   const session = payload?.sessionData || payload?.data || payload || {};
//   const role = data?.role || payload?.role || session?.role || null;
//   const participant =
//     role === "tutor"
//       ? session?.tutor
//       : role === "learner"
//         ? session?.learner
//         : null;

//   const userId =
//     data?.userId ||
//     data?.id ||
//     data?.user?.id ||
//     data?.user?.userId ||
//     participant?._id ||
//     session?.userId ||
//     null;

//   const name =
//     data?.name ||
//     data?.user?.name ||
//     [participant?.first_name, participant?.last_name]
//       .filter(Boolean)
//       .join(" ")
//       .trim() ||
//     session?.name ||
//     null;

//   const email =
//     data?.email ||
//     data?.user?.email ||
//     participant?.email ||
//     session?.email ||
//     null;

//   const roomId = data?.roomId || payload?.roomId || session?.roomId || null;
//   const sessionId =
//     data?.sessionId || payload?.sessionId || session?.sessionId || null;

//   return {
//     roomId,
//     sessionId,
//     userId,
//     role,
//     name,
//     email,
//     sessionData: {
//       ...session,
//       roomId,
//       sessionId,
//       role,
//       status: payload?.status || session?.status || "scheduled",
//       startTime: payload?.startTime || session?.startTime || null,
//       endTime: payload?.endTime || session?.endTime || null,
//       duration: payload?.duration || session?.duration || 60,
//       tutorToken: payload?.tutorToken || session?.tutorToken || null,
//       learnerToken: payload?.learnerToken || session?.learnerToken || null,
//       metadata: session?.metadata || null,
//       timezone: session?.timezone || null,
//       permissions: session?.permissions || {
//         chat: true,
//         screenShare: false,
//         recording: false,
//         handRaise: true,
//       },
//     },
//   };
// };

// module.exports = (io, socket) => {
//   let joinedRoom = null;
//   let joinedUserId = null;

//   socket.on("join-room", (data) => {
//     try {
//       const normalized = normalizeSessionPayload(data);
//       const { roomId, sessionId, userId, role, name, email, sessionData } =
//         normalized;

//       if (!roomId || !sessionId || !userId || !role) {
//         socket.emit("room-error", { message: "Invalid room payload." });
//         return;
//       }

//       const user = { id: userId, role, name, email };

//       joinedRoom = roomId;
//       joinedUserId = userId;

//       socket.user = { ...user, roomId, sessionId, sessionData };

//       socket.join(roomId);

//       const result = addUser(roomId, user, socket.id, sessionData);

//       if (!result.success) {
//         socket.leave(roomId);
//         socket.emit("room-error", { message: result.message });
//         return;
//       }

//       const users = getUsers(roomId);

//       io.to(roomId).emit("room-users", users);
//       socket.to(roomId).emit("user-joined", user);
//       socket.emit("room-joined", { roomId, users });

//       const room = getRoom(roomId);

//       if (room?.status === "active") {
//         socket.emit("session-started", {
//           startedAt: room.startedAt,
//           endsAt: room.endsAt,
//           duration: room.session.duration,
//         });
//       }

//       console.log(`[ROOM] ${role} joined room ${roomId}`);
//     } catch (err) {
//       console.error(err);
//       socket.emit("room-error", { message: "Unable to join room." });
//     }
//   });

//   /**
//    * ============================================================
//    * START SESSION
//    * Only Tutor
//    * ============================================================
//    */
//   socket.on("start-session", () => {
//     if (!joinedRoom) return;

//     const room = getRoom(joinedRoom);

//     if (!room) return;

//     if (socket.user.role !== "tutor") {
//       socket.emit("session-error", {
//         message: "Only tutor can start the session.",
//       });
//       return;
//     }

//     if (room.status === "active") return;

//     if (room.status === "ended") {
//       socket.emit("session-error", {
//         message: "This session has already ended.",
//       });
//       return;
//     }

//     const duration = room.session.duration || 60;

//     room.status = "active";
//     room.startedAt = Date.now();

//     /**
//      * Prefer the booked slot's fixed end time over a rolling
//      * duration-from-actual-start. A session booked for 3:00-4:00 should
//      * still end at 4:00 even if the tutor starts it late at 3:10 - it's a
//      * fixed slot, not an elastic one. Falls back to duration-based
//      * calculation if no explicit endTime was provided by the booking.
//      */
//     const bookedEndsAt = Date.parse(room.session.endTime);

//     room.endsAt =
//       Number.isFinite(bookedEndsAt) && bookedEndsAt > room.startedAt
//         ? bookedEndsAt
//         : room.startedAt + duration * 60 * 1000;

//     room.warningSent = false;

//     startSessionExpiryWatcher(io, joinedRoom);

//     io.to(joinedRoom).emit("session-started", {
//       startedAt: room.startedAt,
//       endsAt: room.endsAt,
//       duration,
//     });

//     console.log(`[SESSION] Started ${joinedRoom}`);
//   });

//   socket.on("leave-room", () => {
//     if (!joinedRoom) return;

//     removeUser(joinedRoom, joinedUserId);
//     socket.leave(joinedRoom);

//     io.to(joinedRoom).emit("user-left", { userId: joinedUserId });

//     console.log(`[ROOM] ${joinedUserId} left ${joinedRoom}`);
//   });

//   socket.on("disconnect", () => {
//     if (!joinedRoom) return;

//     disconnectUser(joinedRoom, socket.id);

//     io.to(joinedRoom).emit("user-disconnected", { userId: joinedUserId });

//     console.log(`[ROOM] ${joinedUserId} disconnected`);
//   });
// };

const { addUser, removeUser, getUsers } = require("../services/room.service");
const { getRoom, disconnectUser } = require("../store/room.store");
const { startSessionWatcher } = require("../services/session.service");

const normalizeSessionPayload = (data = {}) => {
  const payload = data?.data || data || {};
  const session = payload?.sessionData || payload?.data || payload || {};
  const role = data?.role || payload?.role || session?.role || null;
  const participant =
    role === "tutor"
      ? session?.tutor
      : role === "learner"
        ? session?.learner
        : null;

  const userId =
    data?.userId ||
    data?.id ||
    data?.user?.id ||
    data?.user?.userId ||
    participant?._id ||
    session?.userId ||
    null;

  const name =
    data?.name ||
    data?.user?.name ||
    [participant?.first_name, participant?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    session?.name ||
    null;

  const email =
    data?.email ||
    data?.user?.email ||
    participant?.email ||
    session?.email ||
    null;

  const roomId = data?.roomId || payload?.roomId || session?.roomId || null;
  const sessionId =
    data?.sessionId || payload?.sessionId || session?.sessionId || null;

  return {
    roomId,
    sessionId,
    userId,
    role,
    name,
    email,
    sessionData: {
      ...session,
      roomId,
      sessionId,
      role,
      status: payload?.status || session?.status || "scheduled",
      startTime: payload?.startTime || session?.startTime || null,
      endTime: payload?.endTime || session?.endTime || null,
      duration: payload?.duration || session?.duration || 60,
      tutorToken: payload?.tutorToken || session?.tutorToken || null,
      learnerToken: payload?.learnerToken || session?.learnerToken || null,
      metadata: session?.metadata || null,
      timezone: session?.timezone || null,
      permissions: session?.permissions || {
        chat: true,
        screenShare: false,
        recording: false,
        handRaise: true,
      },
    },
  };
};

module.exports = (io, socket) => {
  let joinedRoom = null;
  let joinedUserId = null;

  socket.on("join-room", (data) => {
    try {
      const normalized = normalizeSessionPayload(data);
      const { roomId, sessionId, userId, role, name, email, sessionData } =
        normalized;

      if (!roomId || !sessionId || !userId || !role) {
        socket.emit("room-error", { message: "Invalid room payload." });
        return;
      }

      const user = { id: userId, role, name, email };

      joinedRoom = roomId;
      joinedUserId = userId;

      socket.user = { ...user, roomId, sessionId, sessionData };

      socket.join(roomId);

      const result = addUser(roomId, user, socket.id, sessionData);

      if (!result.success) {
        socket.leave(roomId);
        socket.emit("room-error", { message: result.message });
        return;
      }

      /**
       * Start (or re-attach to) this room's lifecycle watcher every time
       * someone joins. Idempotent - startSessionWatcher clears any
       * existing interval for this roomId first, so this is safe to call
       * on every join without spawning duplicate timers. This is what
       * makes the session timer start automatically at the scheduled
       * time regardless of when either participant actually joins,
       * rather than waiting for a manual "Start session" click.
       */
      startSessionWatcher(io, roomId);

      const users = getUsers(roomId);

      io.to(roomId).emit("room-users", users);
      socket.to(roomId).emit("user-joined", user);
      socket.emit("room-joined", { roomId, users });

      const room = getRoom(roomId);

      if (room?.status === "active") {
        socket.emit("session-started", {
          startedAt: room.startedAt,
          endsAt: room.endsAt,
          duration: room.session.duration,
        });
      }

      console.log(`[ROOM] ${role} joined room ${roomId}`);
    } catch (err) {
      console.error(err);
      socket.emit("room-error", { message: "Unable to join room." });
    }
  });

  /**
   * ============================================================
   * START SESSION (manual) - now an OPTIONAL EARLY-START OVERRIDE
   * ============================================================
   * The room's watcher (startSessionWatcher, attached on join above)
   * already auto-starts the timer at the booking's scheduled time for
   * any room with real startTime/endTime data - that's the normal path,
   * nobody needs to click anything.
   *
   * This event now only matters in two cases:
   *   1. Tutor wants to begin before the scheduled time (both are ready
   *      early) - starts now, keeps the ORIGINAL scheduled endsAt as-is
   *      (so starting early just gives bonus time, doesn't shift the
   *      booked end later).
   *   2. Room has no real schedule at all (autoStartEligible: false -
   *      e.g. an ad-hoc/test room with no startTime) - the only way
   *      such a room can start, since the watcher has nothing to
   *      auto-trigger off.
   */
  socket.on("start-session", () => {
    if (!joinedRoom) return;

    const room = getRoom(joinedRoom);

    if (!room) return;

    if (socket.user.role !== "tutor") {
      socket.emit("session-error", {
        message: "Only tutor can start the session.",
      });
      return;
    }

    if (room.status === "active") return;

    if (room.status === "ended") {
      socket.emit("session-error", {
        message: "This session has already ended.",
      });
      return;
    }

    const duration = room.session.duration || 60;

    room.status = "active";
    room.startedAt = Date.now();

    if (!room.autoStartEligible) {
      room.endsAt = room.startedAt + duration * 60 * 1000;
    }
    // else: room.endsAt was already computed at room-creation time - leave
    // it untouched so an early start doesn't shift the booked end later.

    room.warningSent = false;

    startSessionWatcher(io, joinedRoom);

    io.to(joinedRoom).emit("session-started", {
      startedAt: room.startedAt,
      endsAt: room.endsAt,
      duration,
    });

    console.log(`[SESSION] Manually started early: ${joinedRoom}`);
  });

  socket.on("leave-room", () => {
    if (!joinedRoom) return;

    removeUser(joinedRoom, joinedUserId);
    socket.leave(joinedRoom);

    io.to(joinedRoom).emit("user-left", { userId: joinedUserId });

    console.log(`[ROOM] ${joinedUserId} left ${joinedRoom}`);
  });

  socket.on("disconnect", () => {
    if (!joinedRoom) return;

    disconnectUser(joinedRoom, socket.id);

    io.to(joinedRoom).emit("user-disconnected", { userId: joinedUserId });

    console.log(`[ROOM] ${joinedUserId} disconnected`);
  });
};
