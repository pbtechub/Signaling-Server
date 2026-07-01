// module.exports = (io, socket) => {
//   socket.on("chat-message", (data) => {
//     io.to(data.roomId).emit("chat-message", {
//       sender: socket.id,

//       text: data.text,

//       time: Date.now(),
//     });
//   });
// };

// socket/chat.socket.js

module.exports = (io, socket) => {
  socket.on("chat-message", (data) => {
    io.to(data.roomId).emit("chat-message", {
      sender: socket.user?.name || socket.user?.id || "User",

      senderId: socket.user?.id,

      text: data.text,

      time: Date.now(),
    });
  });
};
