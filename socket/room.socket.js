// const { addUser, removeUser, getUsers } = require("../services/room.service");
// const { getRoom } = require("../store/room.store");

// const { startSessionExpiryWatcher } = require("../services/session.service");

// const timers = {};
// module.exports = (io, socket) => {
//   let joinedRoom = null;

//   socket.on("join-room", (data) => {
//     const { roomId, role } = data;

//     const user = {
//       id: socket.id,
//       role,
//       joinedAt: Date.now(),
//     };

//     joinedRoom = roomId;

//     socket.join(roomId);

//     const result = addUser(roomId, user);

//     if (!result.success) {
//       console.log("Join rejected:", result.message);

//       socket.emit("room-full", {
//         message: result.message,
//       });

//       socket.leave(roomId);

//       return;
//     }

//     console.log(`User ${socket.id} joined ${roomId} as ${role}`);

//     socket.emit("room-users", getUsers(roomId));

//     const room = getRoom(roomId);

//     if (room && room.startedAt && room.endsAt && room.status === "active") {
//       console.log("Sending existing session to:", role);

//       socket.emit("session-started", {
//         startedAt: room.startedAt,
//         endsAt: room.endsAt,
//         duration: room.duration,
//       });
//     }

//     // IMPORTANT PART

//     if (result.refreshed) {
//       console.log("User refreshed:", role);

//       socket.to(roomId).emit("user-refreshed", user);
//     } else {
//       socket.to(roomId).emit("user-joined", user);
//     }
//   });

//   socket.on("start-session", ({ roomId }) => {
//     console.log("🔥 START SESSION RECEIVED");
//     console.log("socket:", socket.id);
//     console.log("roomId:", roomId);

//     const room = getRoom(roomId);

//     if (!room) {
//       console.log("Room not found");
//       socket.emit("session-error", {
//         message: "Room not found",
//       });
//       return;
//     }

//     console.log("Current room:", room);

//     if (room.tutor !== socket.id) {
//       console.log("Not tutor", "expected:", room.tutor, "received:", socket.id);

//       socket.emit("session-error", {
//         message: "Only tutor can start session",
//       });

//       return;
//     }

//     if (room.status === "active") {
//       console.log("Session already active");
//       return;
//     }

//     room.status = "active";

//     const duration = room.duration ?? 90;

//     const startedAt = Date.now();

//     const endsAt = startedAt + duration * 60 * 1000;

//     room.startedAt = startedAt;
//     room.endsAt = endsAt;
//     room.duration = duration;

//     startSessionExpiryWatcher(io, roomId);

//     console.log("✅ Session started", {
//       roomId,
//       startedAt,
//       endsAt,
//       duration,
//     });

//     io.to(roomId).emit("session-started", {
//       startedAt,
//       endsAt,
//       duration,
//     });
//   });

//   socket.on("leave-room", (data) => {
//     const { roomId } = data;

//     removeUser(roomId, socket.id);

//     socket.to(roomId).emit("user-left", {
//       id: socket.id,
//     });

//     socket.leave(roomId);
//   });

//   socket.on("disconnect", () => {
//     console.log("Temporary disconnect:", socket.id);

//     timers[socket.id] = setTimeout(() => {
//       const room = getRoom(joinedRoom);

//       if (!room) {
//         return;
//       }

//       const isStillActive =
//         room.tutor === socket.id || room.learner === socket.id;

//       if (!isStillActive) {
//         console.log("Old socket ignored:", socket.id);

//         return;
//       }

//       removeUser(joinedRoom, socket.id);

//       socket.to(joinedRoom).emit("user-disconnected", {
//         id: socket.id,
//       });
//     }, 10000);
//   });
// };

// socket/room.socket.js

const { addUser, removeUser, getUsers } = require("../services/room.service");

const {
  getRoom,
  reconnectUser,
  disconnectUser,
} = require("../store/room.store");

const { startSessionExpiryWatcher } = require("../services/session.service");

module.exports = (io, socket) => {
  let joinedRoom = null;

  /*
    JOIN ROOM
  */

  socket.on("join-room", (data) => {
    const { roomId, role, userId, refreshed } = data;

    const user = {
      // permanent user identity
      id: userId,

      // current socket
      socketId: socket.id,

      role,

      joinedAt: Date.now(),
    };

    joinedRoom = roomId;

    socket.join(roomId);

    /*
        Refresh reconnect
      */

    if (refreshed) {
      const room = reconnectUser(roomId, user, socket.id);

      console.log("User reconnected", user.id);

      socket.emit("room-users", getUsers(roomId));

      socket.to(roomId).emit("user-reconnected", user);

      return;
    }

    const result = addUser(roomId, user, socket.id);

    if (!result.success) {
      console.log("Join rejected:", result.message);

      socket.emit("room-full", {
        message: result.message,
      });

      socket.leave(roomId);

      return;
    }

    console.log(`User ${user.id} joined ${roomId} as ${role}`);

    socket.emit("room-users", getUsers(roomId));

    const room = getRoom(roomId);

    /*
        existing active session
      */

    if (room && room.startedAt && room.endsAt && room.status === "active") {
      socket.emit("session-started", {
        startedAt: room.startedAt,

        endsAt: room.endsAt,

        duration: room.duration,
      });
    }

    socket.to(roomId).emit("user-joined", user);
  });

  /*
     START SESSION
  */

  socket.on("start-session", ({ roomId }) => {
    const room = getRoom(roomId);

    if (!room) {
      socket.emit("session-error", {
        message: "Room not found",
      });

      return;
    }

    // only tutor

    if (room.users?.tutor?.socketId !== socket.id) {
      socket.emit("session-error", {
        message: "Only tutor can start session",
      });

      return;
    }

    if (room.status === "active") {
      return;
    }

    room.status = "active";

    const duration = room.duration || 90;

    const startedAt = Date.now();

    const endsAt = startedAt + duration * 60 * 1000;

    room.startedAt = startedAt;

    room.endsAt = endsAt;

    startSessionExpiryWatcher(io, roomId);

    io.to(roomId).emit("session-started", {
      startedAt,
      endsAt,
      duration,
    });
  });

  /*
      LEAVE BUTTON
  */

  socket.on("leave-room", ({ roomId }) => {
    removeUser(roomId, socket.id);

    socket.to(roomId).emit("user-left", {
      id: socket.id,
    });

    socket.leave(roomId);
  });

  /*
      DISCONNECT
      refresh / browser close
  */

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);

    if (!joinedRoom) {
      return;
    }

    disconnectUser(joinedRoom, socket.id);

    socket.to(joinedRoom).emit("user-disconnected", {
      id: socket.id,
    });
  });
};
