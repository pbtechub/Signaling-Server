// const registerHandRaise = (io, socket) => {
//   socket.on("raise-hand", (data) => {
//     console.log("Hand raise:", socket.id, data.roomId);

//     socket.to(data.roomId).emit("hand-raised", {
//       userId: socket.id,
//     });
//   });
// };

// module.exports = registerHandRaise;

// socket/hand.socket.js

module.exports = (io, socket) => {
  socket.on("raise-hand", (data) => {
    console.log("Hand raise", socket.user);

    socket.to(data.roomId).emit("hand-raised", {
      userId: socket.user?.id,

      name: socket.user?.name,

      role: socket.user?.role,
    });
  });
};
