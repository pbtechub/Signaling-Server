// const registerHandRaise = (io, socket) => {
//   socket.on("raise-hand", (data) => {
//     console.log("Hand raise:", socket.id, data.roomId);

//     socket.to(data.roomId).emit("hand-raised", {
//       userId: socket.id,
//     });
//   });
// };

// module.exports = registerHandRaise;

// socket/handRaise.socket.js

const logger = {
  info: (msg, data) => console.log(`[HAND RAISE] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[HAND RAISE ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  socket.on("raise-hand", (data) => {
    try {
      if (!data || !data.roomId) {
        logger.error("Invalid raise-hand data", data);
        return;
      }

      const userId = socket.user?.id || socket.id;
      const userName = socket.user?.name || data.name || "Participant";
      const userRole = socket.user?.role || data.role || "participant";

      logger.info("🙋 Hand raised", {
        userId,
        userName,
        roomId: data.roomId,
      });

      socket.to(data.roomId).emit("hand-raised", {
        userId,
        name: userName,
        role: userRole,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error("Failed to handle raise-hand", error);
    }
  });
};
