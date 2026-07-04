const logger = {
  info: (msg, data) => console.log(`[CHAT] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[CHAT ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  socket.on("chat-message", (data) => {
    try {
      if (!data?.roomId || !data?.text?.trim()) {
        logger.error("Invalid chat payload", data);

        return;
      }

      const user = socket.user;

      if (!user) {
        logger.error("Chat attempt without user");

        return;
      }

      const message = {
        id: `${Date.now()}-${socket.id}`,

        sender: user.name,

        senderId: user.id,

        role: user.role,

        profileImage: user.profileImage || null,

        text: data.text.trim(),

        time: Date.now(),
      };

      io.to(data.roomId).emit("chat-message", message);

      logger.info("Message sent", {
        roomId: data.roomId,
        user: user.id,
      });
    } catch (error) {
      logger.error("chat failed", error);
    }
  });
};
