// const { addUser, removeUser, getUsers } = require("../services/room.service");

// const { getRoom, disconnectUser } = require("../store/room.store");

// const { verifyMeetingToken } = require("../services/token.service");

// const { startSessionExpiryWatcher } = require("../services/session.service");

// module.exports = (io, socket) => {
//   let joinedRoom = null;

//   let joinedUserId = null;

//   socket.on("join-room", (data) => {
//     try {
//       const { roomId, token } = data;

//       if (!roomId || !token) {
//         socket.emit("room-error", {
//           message: "Invalid meeting credentials",
//         });

//         return;
//       }

//       /**
//        * verify JWT
//        */
//       const payload = verifyMeetingToken(token);

//       if (payload.roomId !== roomId) {
//         socket.emit("room-error", {
//           message: "Invalid room access",
//         });

//         return;
//       }

//       const user = payload.role === "tutor" ? payload.tutor : payload.learner;

//       const userData = {
//         id: user.id,

//         name: user.name,

//         email: user.email,

//         role: payload.role,
//       };

//       joinedRoom = roomId;

//       joinedUserId = user.id;

//       socket.user = {
//         ...userData,

//         roomId,
//       };

//       socket.join(roomId);

//       const result = addUser(roomId, userData, socket.id);

//       if (!result.success) {
//         socket.emit("room-full", {
//           message: result.message,
//         });

//         socket.leave(roomId);

//         return;
//       }

//       socket.emit("room-users", getUsers(roomId));

//       const room = getRoom(roomId);

//       /**
//        * send active session
//        */

//       if (room && room.status === "active") {
//         socket.emit("session-started", {
//           startedAt: room.startedAt,

//           endsAt: room.endsAt,

//           duration: room.session.duration,
//         });
//       }

//       if (result.refreshed) {
//         socket.to(roomId).emit("user-reconnected", userData);
//       } else {
//         socket.to(roomId).emit("user-joined", userData);
//       }
//     } catch (error) {
//       console.log("join-room error", error);

//       socket.emit("room-error", {
//         message: "Meeting authentication failed",
//       });
//     }
//   });

//   socket.on("start-session", () => {
//     const room = getRoom(joinedRoom);

//     if (!room) return;

//     if (socket.user.role !== "tutor") {
//       socket.emit("session-error", {
//         message: "Only tutor can start",
//       });

//       return;
//     }

//     if (room.status === "active") return;

//     const duration = room.session.duration || 60;

//     const startedAt = Date.now();

//     const endsAt = startedAt + duration * 60 * 1000;

//     room.status = "active";

//     room.startedAt = startedAt;

//     room.endsAt = endsAt;

//     startSessionExpiryWatcher(io, joinedRoom);

//     io.to(joinedRoom).emit("session-started", {
//       startedAt,
//       endsAt,
//       duration,
//     });
//   });

//   socket.on("leave-room", () => {
//     if (!joinedRoom) return;

//     removeUser(joinedRoom, joinedUserId);

//     socket.to(joinedRoom).emit("user-left", {
//       userId: joinedUserId,
//     });

//     socket.leave(joinedRoom);
//   });

//   socket.on("disconnect", () => {
//     if (!joinedRoom) return;

//     disconnectUser(joinedRoom, socket.id);

//     socket.to(joinedRoom).emit("user-disconnected", {
//       userId: joinedUserId,
//     });
//   });
// };

const { addUser, removeUser, getUsers } = require("../services/room.service");

const { getRoom, disconnectUser } = require("../store/room.store");

const { startSessionExpiryWatcher } = require("../services/session.service");

module.exports = (io, socket) => {
  let joinedRoom = null;
  let joinedUserId = null;

  /**
   * ============================================================
   * JOIN ROOM
   * ============================================================
   */
  socket.on("join-room", (data) => {
    try {
      const { roomId, sessionId, userId, role, name, email } = data;

      if (!roomId || !sessionId || !userId || !role) {
        socket.emit("room-error", {
          message: "Invalid room payload.",
        });

        return;
      }

      const user = {
        id: userId,
        role,
        name,
        email,
      };

      joinedRoom = roomId;
      joinedUserId = userId;

      socket.user = {
        ...user,
        roomId,
        sessionId,
      };

      socket.join(roomId);

      const result = addUser(roomId, user, socket.id, {
        sessionId,
      });

      if (!result.success) {
        socket.leave(roomId);

        socket.emit("room-error", {
          message: result.message,
        });

        return;
      }

      const users = getUsers(roomId);

      /**
       * Send participant list
       */
      io.to(roomId).emit("room-users", users);

      /**
       * Notify existing peer
       */
      socket.to(roomId).emit("user-joined", user);

      /**
       * Notify newly joined user
       */
      socket.emit("room-joined", {
        roomId,
        users,
      });

      /**
       * Send active session state if session already started
       */
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

      socket.emit("room-error", {
        message: "Unable to join room.",
      });
    }
  });

  /**
   * ============================================================
   * START SESSION
   * Only Tutor
   * ============================================================
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

    const duration = room.session.duration || 60;

    room.status = "active";

    room.startedAt = Date.now();

    room.endsAt = room.startedAt + duration * 60 * 1000;

    startSessionExpiryWatcher(io, joinedRoom);

    io.to(joinedRoom).emit("session-started", {
      startedAt: room.startedAt,
      endsAt: room.endsAt,
      duration,
    });

    console.log(`[SESSION] Started ${joinedRoom}`);
  });

  /**
   * ============================================================
   * LEAVE ROOM
   * ============================================================
   */
  socket.on("leave-room", () => {
    if (!joinedRoom) return;

    removeUser(joinedRoom, joinedUserId);

    socket.leave(joinedRoom);

    io.to(joinedRoom).emit("user-left", {
      userId: joinedUserId,
    });

    console.log(`[ROOM] ${joinedUserId} left ${joinedRoom}`);
  });

  /**
   * ============================================================
   * DISCONNECT
   * ============================================================
   */
  socket.on("disconnect", () => {
    if (!joinedRoom) return;

    disconnectUser(joinedRoom, socket.id);

    io.to(joinedRoom).emit("user-disconnected", {
      userId: joinedUserId,
    });

    console.log(`[ROOM] ${joinedUserId} disconnected`);
  });
};
