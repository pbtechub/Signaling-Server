const { rooms } = require("../store/room.store");

// const addUser = (roomId, user) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = [];
//   }

//   rooms[roomId].push(user);
// };

// const addUser = (roomId, user) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = [];
//   }

//   const exists = rooms[roomId].find((u) => u.id === user.id);

//   if (!exists) {
//     rooms[roomId].push(user);
//   }
// };

const addUser = (roomId, user) => {
  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }

  const alreadyExists = rooms[roomId].find((u) => u.role === user.role);

  if (alreadyExists) {
    alreadyExists.id = user.id;
    alreadyExists.joinedAt = Date.now();

    return;
  }

  rooms[roomId].push(user);
};

const removeUser = (roomId, socketId) => {
  if (!rooms[roomId]) return;

  rooms[roomId] = rooms[roomId].filter((u) => u.id !== socketId);

  if (rooms[roomId].length === 0) {
    delete rooms[roomId];
  }
};

const getUsers = (roomId) => {
  return rooms[roomId] || [];
};

module.exports = {
  addUser,
  removeUser,
  getUsers,
};
