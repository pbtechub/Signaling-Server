const logger = {
  info: (msg, data) => console.log(`[WebRTC] ${msg}`, data || ""),
  error: (msg, error) => console.error(`[WebRTC ERROR] ${msg}`, error || ""),
};

module.exports = (io, socket) => {
  /**
   * OFFER - user initiating connection
   */
  socket.on("offer", (data) => {
    try {
      if (!data || !data.roomId || !data.offer) {
        logger.error("Invalid offer data", data);
        socket.emit("signaling-error", {
          message: "Invalid offer data",
        });
        return;
      }

      logger.info("📤 Offer received and forwarded", {
        from: data.from,
        roomId: data.roomId,
      });

      socket.to(data.roomId).emit("offer", {
        offer: data.offer,
        from: data.from,
      });
    } catch (error) {
      logger.error("Offer relay failed", error);
      socket.emit("signaling-error", {
        message: "Failed to relay offer",
      });
    }
  });

  /**
   * ANSWER - user accepting connection
   */
  socket.on("answer", (data) => {
    try {
      if (!data || !data.roomId || !data.answer) {
        logger.error("Invalid answer data", data);
        socket.emit("signaling-error", {
          message: "Invalid answer data",
        });
        return;
      }

      logger.info("📥 Answer received and forwarded", {
        from: data.from,
        roomId: data.roomId,
      });

      socket.to(data.roomId).emit("answer", {
        answer: data.answer,
        from: data.from,
      });
    } catch (error) {
      logger.error("Answer relay failed", error);
      socket.emit("signaling-error", {
        message: "Failed to relay answer",
      });
    }
  });

  /**
   * ICE CANDIDATE - network discovery
   */
  socket.on("ice-candidate", (data) => {
    try {
      if (!data || !data.roomId || !data.candidate) {
        logger.error("Invalid ICE candidate data", data);
        return;
      }

      socket.to(data.roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: data.from,
      });
    } catch (error) {
      logger.error("ICE candidate relay failed", error);
    }
  });

  /**
   * ICE RESTART OFFER
   */
  socket.on("restart-offer", (data) => {
    try {
      if (!data || !data.roomId || !data.offer) {
        logger.error("Invalid restart offer data", data);
        return;
      }

      logger.info("🔄 ICE restart offer forwarded", { roomId: data.roomId });
      socket.to(data.roomId).emit("restart-offer", {
        offer: data.offer,
        from: data.from,
      });
    } catch (error) {
      logger.error("Restart offer relay failed", error);
    }
  });

  /**
   * ICE RESTART ANSWER
   */
  socket.on("restart-answer", (data) => {
    try {
      if (!data || !data.roomId || !data.answer) {
        logger.error("Invalid restart answer data", data);
        return;
      }

      logger.info("🔄 ICE restart answer forwarded", { roomId: data.roomId });
      socket.to(data.roomId).emit("restart-answer", {
        answer: data.answer,
        from: data.from,
      });
    } catch (error) {
      logger.error("Restart answer relay failed", error);
    }
  });
};
