// const { rooms } = require("../store/room.store");

// const addUser = (roomId, user) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = [];
//   }

//   const alreadyJoined = rooms[roomId].find((item) => item.role === user.role);

//   if (alreadyJoined) {
//     return {
//       success: false,
//       message: `${user.role} already joined`,
//     };
//   }

//   rooms[roomId].push(user);

//   return {
//     success: true,
//     users: rooms[roomId],
//   };
// };

// const removeUser = (roomId, socketId) => {
//   if (!rooms[roomId]) {
//     return;
//   }

//   rooms[roomId] = rooms[roomId].filter((user) => user.id !== socketId);

//   if (rooms[roomId].length === 0) {
//     delete rooms[roomId];
//   }
// };

// const getUsers = (roomId) => {
//   return rooms[roomId] || [];
// };

// module.exports = {
//   addUser,
//   removeUser,
//   getUsers,
//   removeUser,
// };

const { createRoom, getRoom, removeRoom } = require("../store/room.store");

// const addUser = (roomId, user) => {
//   const room = createRoom(roomId);

//   if (user.role === "tutor") {
//     // allow tutor refresh
//     if (room.tutor) {
//       room.tutor = user.id;

//       return {
//         success: true,
//         refreshed: true,
//         room,
//       };
//     }

//     room.tutor = user.id;
//   }

//   if (user.role === "learner") {
//     if (room.learner) {
//       return {
//         success: false,
//         message: "Learner already joined",
//       };
//     }

//     room.learner = user.id;
//   }

//   return {
//     success: true,
//     room,
//   };
// };

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
