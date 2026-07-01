// module.exports = (io, socket) => {
//   socket.on("offer", (data) => {
//     socket.to(data.roomId).emit("offer", data.offer);
//   });

//   socket.on("answer", (data) => {
//     socket.to(data.roomId).emit("answer", data.answer);
//   });

//   socket.on("ice-candidate", (data) => {
//     socket.to(data.roomId).emit("ice-candidate", data.candidate);
//   });
// };

// socket/webrtc.socket.js

module.exports = (io, socket) => {
  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", {
      offer: data.offer,

      from: socket.user?.id,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", {
      answer: data.answer,

      from: socket.user?.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", {
      candidate: data.candidate,

      from: socket.user?.id,
    });
  });
};
