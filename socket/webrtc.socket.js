// const logger = {
//   info: (msg, data) => console.log(`[WebRTC] ${msg}`, data || ""),
//   error: (msg, error) => console.error(`[WebRTC ERROR] ${msg}`, error || ""),
// };

// module.exports = (io, socket) => {
//   const getRoomId = () => {
//     return socket.user?.roomId;
//   };

//   const validateRoom = (data) => {
//     const roomId = getRoomId();

//     if (!roomId) {
//       return false;
//     }

//     if (data.roomId && data.roomId !== roomId) {
//       return false;
//     }

//     return true;
//   };

//   /**
//    * OFFER
//    */
//   socket.on("offer", (data) => {
//     try {
//       if (!data?.offer || !validateRoom(data)) {
//         socket.emit("signaling-error", {
//           message: "Invalid offer",
//         });

//         return;
//       }

//       const roomId = getRoomId();

//       socket.to(roomId).emit("offer", {
//         offer: data.offer,

//         from: socket.user.id,
//       });

//       logger.info("Offer forwarded", {
//         roomId,
//       });
//     } catch (error) {
//       logger.error("Offer failed", error);
//     }
//   });

//   /**
//    * ANSWER
//    */
//   socket.on("answer", (data) => {
//     try {
//       if (!data?.answer || !validateRoom(data)) return;

//       const roomId = getRoomId();

//       socket.to(roomId).emit("answer", {
//         answer: data.answer,

//         from: socket.user.id,
//       });
//     } catch (error) {
//       logger.error("Answer failed", error);
//     }
//   });

//   /**
//    * ICE
//    */
//   socket.on("ice-candidate", (data) => {
//     try {
//       if (!data?.candidate || !validateRoom(data)) return;

//       const roomId = getRoomId();

//       socket.to(roomId).emit("ice-candidate", {
//         candidate: data.candidate,

//         from: socket.user.id,
//       });
//     } catch (error) {
//       logger.error("ICE failed", error);
//     }
//   });

//   /**
//    * ICE restart offer
//    */
//   socket.on("restart-offer", (data) => {
//     if (!data?.offer || !validateRoom(data)) return;

//     const roomId = getRoomId();

//     socket.to(roomId).emit("restart-offer", {
//       offer: data.offer,

//       from: socket.user.id,
//     });
//   });

//   /**
//    * ICE restart answer
//    */
//   socket.on("restart-answer", (data) => {
//     if (!data?.answer || !validateRoom(data)) return;

//     const roomId = getRoomId();

//     socket.to(roomId).emit("restart-answer", {
//       answer: data.answer,

//       from: socket.user.id,
//     });
//   });
// };

const logger = {
  info: (msg, data) =>
    console.log(`[WebRTC] ${msg}`, data ? JSON.stringify(data) : ""),
  warn: (msg, data) =>
    console.warn(`[WebRTC WARN] ${msg}`, data ? JSON.stringify(data) : ""),
  error: (msg, error) =>
    console.error(`[WebRTC ERROR] ${msg}`, error?.message || error || ""),
};

module.exports = (io, socket) => {
  /**
   * Resolves the target Room ID securely with fallback methods
   */
  const resolveRoomId = (data) => {
    // Priority 1: Check memory-bound socket user session object
    if (socket.user?.roomId) return socket.user.roomId;

    // Priority 2: Check explicit incoming packet payload field
    if (data?.roomId) return data.roomId;

    // Priority 3: Fallback check active Socket.io room joins list
    const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    return joinedRooms[0] || null;
  };

  /**
   * Refactored Room Validator
   */
  const validateRoom = (data) => {
    const roomId = resolveRoomId(data);

    if (!roomId) {
      logger.warn("Signaling blocked: Unable to determine target Room ID", {
        socketId: socket.id,
        userId: socket.user?.id,
      });
      return null;
    }

    // Verify consistency if roomId is passed in payload explicitly
    if (data?.roomId && data.roomId !== roomId) {
      logger.warn("Signaling blocked: Payload Room ID mismatch", {
        socketRoom: socket.user?.roomId,
        payloadRoom: data.roomId,
      });
      return null;
    }

    return roomId;
  };

  /**
   * ============================================================
   * WebRTC SDP OFFER
   * ============================================================
   */
  socket.on("offer", (data) => {
    try {
      const roomId = validateRoom(data);
      if (!data?.offer || !roomId) {
        return socket.emit("signaling-error", {
          message: "Invalid offer or unauthorized room scope.",
        });
      }

      const senderId = socket.user?.id || data?.from || socket.id;

      // Broadcast payload explicitly out to peer target
      socket.to(roomId).emit("offer", {
        offer: data.offer,
        from: senderId,
      });

      logger.info("Offer forwarded successfully", { roomId, from: senderId });
    } catch (error) {
      logger.error("Offer signaling transmission failed", error);
    }
  });

  /**
   * ============================================================
   * WebRTC SDP ANSWER
   * ============================================================
   */
  socket.on("answer", (data) => {
    try {
      const roomId = validateRoom(data);
      if (!data?.answer || !roomId) return;

      const senderId = socket.user?.id || data?.from || socket.id;

      socket.to(roomId).emit("answer", {
        answer: data.answer,
        from: senderId,
      });

      logger.info("Answer forwarded successfully", { roomId, from: senderId });
    } catch (error) {
      logger.error("Answer signaling transmission failed", error);
    }
  });

  /**
   * ============================================================
   * ICE CANDIDATES TRICKLE
   * ============================================================
   */
  socket.on("ice-candidate", (data) => {
    try {
      const roomId = validateRoom(data);
      if (!data?.candidate || !roomId) return;

      const senderId = socket.user?.id || data?.from || socket.id;

      socket.to(roomId).emit("ice-candidate", {
        candidate: data.candidate,
        from: senderId,
      });
    } catch (error) {
      logger.error("ICE Candidate routing failed", error);
    }
  });

  /**
   * ============================================================
   * ICE RESTART OFFER
   * ============================================================
   */
  socket.on("restart-offer", (data) => {
    try {
      const roomId = validateRoom(data);
      if (!data?.offer || !roomId) return;

      const senderId = socket.user?.id || data?.from || socket.id;

      socket.to(roomId).emit("restart-offer", {
        offer: data.offer,
        from: senderId,
      });

      logger.info("ICE Restart Offer routed", { roomId });
    } catch (error) {
      logger.error("Restart Offer routing failed", error);
    }
  });

  /**
   * ============================================================
   * ICE RESTART ANSWER
   * ============================================================
   */
  socket.on("restart-answer", (data) => {
    try {
      const roomId = validateRoom(data);
      if (!data?.answer || !roomId) return;

      const senderId = socket.user?.id || data?.from || socket.id;

      socket.to(roomId).emit("restart-answer", {
        answer: data.answer,
        from: senderId,
      });

      logger.info("ICE Restart Answer routed", { roomId });
    } catch (error) {
      logger.error("Restart Answer routing failed", error);
    }
  });
};
