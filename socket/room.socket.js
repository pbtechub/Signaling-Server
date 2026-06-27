// const { addUser, removeUser, getUsers } = require("../services/room.service");

// module.exports = (io, socket) => {
//   socket.on("join-room", (data) => {
//     const { roomId, role } = data;

//     console.log(`User ${socket} joined room ${roomId} as ${role}`);

//     const user = {
//       id: socket.id,

//       role,

//       joinedAt: Date.now(),
//     };

//     socket.join(roomId);

//     addUser(roomId, user);

//     // send current users

//     socket.emit("room-users", getUsers(roomId));

//     // notify others

//     socket.to(roomId).emit("user-joined", user);
//   });

//   // socket.on("leave-room", (roomId) => {
//   //   removeUser(roomId, socket.id);

//   //   socket.to(roomId).emit("user-left", {
//   //     id: socket.id,
//   //   });

//   //   socket.leave(roomId);
//   // });

//   socket.on("leave-room", (data) => {
//     const roomId = data.roomId;

//     console.log("User leaving:", socket.id, roomId);

//     removeUser(roomId, socket.id);

//     socket.to(roomId).emit("user-left", {
//       id: socket.id,
//     });

//     socket.leave(roomId);
//   });

//   socket.on("disconnect", () => {
//     for (const roomId in require("../store/room.store").rooms) {
//       removeUser(roomId, socket.id);

//       socket.to(roomId).emit("user-left", {
//         id: socket.id,
//       });
//     }
//   });
// };

const { addUser, removeUser, getUsers } = require("../services/room.service");
const timers = {};
module.exports = (io, socket) => {
  let joinedRoom = null;

  socket.on("join-room", (data) => {
    const { roomId, role } = data;

    const user = {
      id: socket.id,
      role,
      joinedAt: Date.now(),
    };

    joinedRoom = roomId;

    socket.join(roomId);

    const result = addUser(roomId, user);

    if (!result.success) {
      console.log("Join rejected:", result.message);

      socket.emit("room-full", {
        message: result.message,
      });

      socket.leave(roomId);

      return;
    }

    console.log(`User ${socket.id} joined ${roomId} as ${role}`);

    socket.emit("room-users", getUsers(roomId));

    // IMPORTANT PART

    if (result.refreshed) {
      console.log("User refreshed:", role);

      socket.to(roomId).emit("user-refreshed", user);
    } else {
      socket.to(roomId).emit("user-joined", user);
    }
  });

  socket.on("leave-room", (data) => {
    const { roomId } = data;

    removeUser(roomId, socket.id);

    socket.to(roomId).emit("user-left", {
      id: socket.id,
    });

    socket.leave(roomId);
  });



  socket.on("disconnect", () => {
    console.log("Temporary disconnect:", socket.id);

    timers[socket.id] = setTimeout(() => {
      if (joinedRoom) {
        removeUser(joinedRoom, socket.id);

        socket.to(joinedRoom).emit("user-disconnected", {
          id: socket.id,
        });
      }
    }, 10000);
  });
};
