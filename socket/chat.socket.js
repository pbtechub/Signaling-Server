module.exports = (io, socket) => {
  socket.on("chat-message", (data) => {
    io.to(data.roomId).emit("chat-message", {
      sender: socket.id,

      text: data.text,

      time: Date.now(),
    });
  });
};
