const logger = {
  info: (msg, data) => console.log(`[HAND RAISE] ${msg}`, data || ""),
  error: (msg, error) =>
    console.error(`[HAND RAISE ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  socket.on("raise-hand", (data) => {
    try {
      if (!data?.roomId) {
        logger.error("Invalid raise-hand payload", data);
        return;
      }

      const user = socket.user;

      if (!user) {
        logger.error("Unauthorized hand raise");
        return;
      }

      const payload = {
        userId: user.id,

        name: user.name,

        role: user.role,

        profileImage: user.profileImage || null,

        timestamp: Date.now(),
      };

      logger.info("🙋 Hand raised", payload);

      socket.to(data.roomId).emit("hand-raised", payload);
    } catch (error) {
      logger.error("Failed to handle raise-hand", error);
    }
  });
};
