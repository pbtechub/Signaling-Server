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

const logger = {
  info: (msg, data) => console.log(`[CHAT] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[CHAT ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  socket.on("chat-message", (data) => {
    try {
      if (!data || !data.roomId || !data.text) {
        logger.error("Invalid chat-message data", data);
        return;
      }

      const senderName = socket.user?.name || socket.user?.id || "User";
      const senderId = socket.user?.id || socket.id;

      logger.info("💬 Chat message received", {
        from: senderId,
        roomId: data.roomId,
        length: data.text.length,
      });

      io.to(data.roomId).emit("chat-message", {
        id: Date.now() + Math.random(),
        sender: senderName,
        senderId,
        text: data.text,
        time: Date.now(),
      });
    } catch (error) {
      logger.error("Failed to handle chat-message", error);
    }
  });
};
