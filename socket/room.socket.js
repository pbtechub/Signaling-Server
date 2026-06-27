const { addUser, removeUser, getUsers } = require("../services/room.service");
const { getRoom } = require("../store/room.store");
const timers = {};
module.exports = (io, socket) => {
  let joinedRoom = null;

  socket.on("join-room", (data) => {
    const { roomId, role } = data;

    const user = {
      id: socket.id,
      role,
      joinedAt: Date.now(),
    };

    joinedRoom = roomId;

    socket.join(roomId);

    const result = addUser(roomId, user);

    if (!result.success) {
      console.log("Join rejected:", result.message);

      socket.emit("room-full", {
        message: result.message,
      });

      socket.leave(roomId);

      return;
    }

    console.log(`User ${socket.id} joined ${roomId} as ${role}`);

    socket.emit("room-users", getUsers(roomId));

    // IMPORTANT PART

    if (result.refreshed) {
      console.log("User refreshed:", role);

      socket.to(roomId).emit("user-refreshed", user);
    } else {
      socket.to(roomId).emit("user-joined", user);
    }
  });

  socket.on("leave-room", (data) => {
    const { roomId } = data;

    removeUser(roomId, socket.id);

    socket.to(roomId).emit("user-left", {
      id: socket.id,
    });

    socket.leave(roomId);
  });

  // socket.on("disconnect", () => {
  //   console.log("Temporary disconnect:", socket.id);

  //   timers[socket.id] = setTimeout(() => {
  //     if (joinedRoom) {
  //       removeUser(joinedRoom, socket.id);

  //       socket.to(joinedRoom).emit("user-disconnected", {
  //         id: socket.id,
  //       });
  //     }
  //   }, 10000);
  // });

  socket.on("disconnect", () => {
    console.log("Temporary disconnect:", socket.id);

    timers[socket.id] = setTimeout(() => {
      const room = getRoom(joinedRoom);

      if (!room) {
        return;
      }

      const isStillActive =
        room.tutor === socket.id || room.learner === socket.id;

      if (!isStillActive) {
        console.log("Old socket ignored:", socket.id);

        return;
      }

      removeUser(joinedRoom, socket.id);

      socket.to(joinedRoom).emit("user-disconnected", {
        id: socket.id,
      });
    }, 10000);
  });
};
