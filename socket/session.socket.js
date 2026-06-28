

const { sessions } = require("../store/room.store");

module.exports = (io, socket) => {
  // socket.on("start-session", (data) => {
  //   sessions[data.roomId] = Date.now();

  //   io.to(data.roomId).emit("session-started", {
  //     startedAt: sessions[data.roomId],
  //   });
  // });
};
