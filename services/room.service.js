const { createRoom, getRoom, removeRoom } = require("../store/room.store");

const addUser = (roomId, user) => {
  const room = createRoom(roomId);

  let refreshed = false;

  if (user.role === "tutor") {
    if (room.tutor) {
      // same role reconnecting after refresh
      refreshed = true;

      room.tutor = user.id;
    } else {
      room.tutor = user.id;
    }
  }

  if (user.role === "learner") {
    if (room.learner) {
      refreshed = true;

      room.learner = user.id;
    } else {
      room.learner = user.id;
    }
  }

  return {
    success: true,
    refreshed,
    room,
  };
};

const removeUser = (roomId, socketId) => {
  const room = getRoom(roomId);

  if (!room) return;

  if (room.tutor === socketId) {
    room.tutor = null;
  }

  if (room.learner === socketId) {
    room.learner = null;
  }

  if (!room.tutor && !room.learner) {
    removeRoom(roomId);
  }
};

const getUsers = (roomId) => {
  const room = getRoom(roomId);

  if (!room) return [];

  const users = [];

  if (room.tutor) {
    users.push({
      id: room.tutor,
      role: "tutor",
    });
  }

  if (room.learner) {
    users.push({
      id: room.learner,
      role: "learner",
    });
  }

  return users;
};

module.exports = {
  addUser,
  removeUser,
  getUsers,
};
