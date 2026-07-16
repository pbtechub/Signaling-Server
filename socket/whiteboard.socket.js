const logger = {
  info: (msg, data) => console.log(`[WHITEBOARD] ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`[WHITEBOARD WARN] ${msg}`, data || ""),
};

module.exports = (io, socket) => {
  const resolveRoomId = (data) => {
    if (socket.user?.roomId) return socket.user.roomId;

    const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);

    return data?.roomId || joinedRooms[0] || null;
  };

  /**
   * ============================================================
   * WHITEBOARD DRAW
   * Pure relay, no server-side storage in this version - a participant
   * who opens the whiteboard after strokes were already drawn won't see
   * the earlier strokes. Fine for a live 1:1 session; would need a
   * per-room stroke log (and a "whiteboard-sync" event on join) to
   * persist across a reconnect or a late-open.
   * ============================================================
   */
  socket.on("whiteboard-draw", (data) => {
    const roomId = resolveRoomId(data);

    if (!roomId) return;

    socket.to(roomId).emit("whiteboard-draw", data.stroke);
  });

  socket.on("whiteboard-clear", (data) => {
    const roomId = resolveRoomId(data);

    if (!roomId) return;

    logger.info("Board cleared", { roomId, by: socket.user?.id });

    socket.to(roomId).emit("whiteboard-clear");
  });
};
