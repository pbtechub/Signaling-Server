const { getRoom } = require("../store/room.store");

const startSessionExpiryWatcher = (io, roomId) => {
  const interval = setInterval(() => {
    const room = getRoom(roomId);

    if (!room) {
      clearInterval(interval);
      return;
    }

    if (room.status === "active" && room.endsAt && Date.now() >= room.endsAt) {
      console.log("⏰ Session expired:", roomId);

      room.status = "ended";

      io.to(roomId).emit("session-ended", {
        endedAt: Date.now(),
      });

      clearInterval(interval);
    }
  }, 1000);
};

module.exports = {
  startSessionExpiryWatcher,
};
