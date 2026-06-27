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

module.exports = (io, socket) => {
  // JOIN ROOM

  socket.on("join-room", (data) => {
    const { roomId, role } = data;

    console.log(`User ${socket.id} joined room ${roomId} as ${role}`);

    const user = {
      id: socket.id,

      role,

      joinedAt: Date.now(),
    };

    socket.join(roomId);

    addUser(roomId, user);

    // send current participants
    socket.emit("room-users", getUsers(roomId));

    // notify existing users
    socket.to(roomId).emit("user-joined", user);
  });

  // LEAVE ROOM

  socket.on("leave-room", (data) => {
    const { roomId } = data;

    console.log("User leaving:", socket.id, roomId);

    removeUser(roomId, socket.id);

    socket.to(roomId).emit("user-left", {
      id: socket.id,
    });

    socket.leave(roomId);
  });

  // DISCONNECT (browser close / refresh)

  // socket.on("disconnect", () => {
  //   const rooms = require("../store/room.store").rooms;

  //   for (const roomId in rooms) {
  //     removeUser(roomId, socket.id);

  //     socket.to(roomId).emit("user-left", {
  //       id: socket.id,
  //     });
  //   }
  // });

  socket.on("disconnect", () => {
    console.log("Temporary disconnect:", socket.id);
  });
};
