

const logger = {
  info: (msg, data) => console.log(`[WebRTC] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[WebRTC ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  const getRoomId = () => {
    return socket.user?.roomId;
  };

  const validateRoom = (data) => {
    const roomId = getRoomId();

    if (!roomId) {
      return false;
    }

    if (data.roomId && data.roomId !== roomId) {
      return false;
    }

    return true;
  };

  /**
   * OFFER
   */
  socket.on("offer", (data) => {
    try {
      if (!data?.offer || !validateRoom(data)) {
        socket.emit("signaling-error", {
          message: "Invalid offer",
        });

        return;
      }

      const roomId = getRoomId();

      socket.to(roomId).emit("offer", {
        offer: data.offer,

        from: socket.user.id,
      });

      logger.info("Offer forwarded", {
        roomId,
      });
    } catch (error) {
      logger.error("Offer failed", error);
    }
  });

  /**
   * ANSWER
   */
  socket.on("answer", (data) => {
    try {
      if (!data?.answer || !validateRoom(data)) return;

      const roomId = getRoomId();

      socket.to(roomId).emit("answer", {
        answer: data.answer,

        from: socket.user.id,
      });
    } catch (error) {
      logger.error("Answer failed", error);
    }
  });

  /**
   * ICE
   */
  socket.on("ice-candidate", (data) => {
    try {
      if (!data?.candidate || !validateRoom(data)) return;

      const roomId = getRoomId();

      socket.to(roomId).emit("ice-candidate", {
        candidate: data.candidate,

        from: socket.user.id,
      });
    } catch (error) {
      logger.error("ICE failed", error);
    }
  });

  /**
   * ICE restart offer
   */
  socket.on("restart-offer", (data) => {
    if (!data?.offer || !validateRoom(data)) return;

    const roomId = getRoomId();

    socket.to(roomId).emit("restart-offer", {
      offer: data.offer,

      from: socket.user.id,
    });
  });

  /**
   * ICE restart answer
   */
  socket.on("restart-answer", (data) => {
    if (!data?.answer || !validateRoom(data)) return;

    const roomId = getRoomId();

    socket.to(roomId).emit("restart-answer", {
      answer: data.answer,

      from: socket.user.id,
    });
  });
};
