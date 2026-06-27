// const rooms = {};

// const sessions = {};

// module.exports = {
//   rooms,
//   sessions,
// };

const rooms = {};

const sessions = {};

const createRoom = (roomId) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      tutor: null,

      learner: null,

      createdAt: Date.now(),

      status: "active",
    };
  }

  return rooms[roomId];
};

const getRoom = (roomId) => {
  return rooms[roomId];
};

const removeRoom = (roomId) => {
  delete rooms[roomId];
};

module.exports = {
  rooms,
  sessions,
  createRoom,
  getRoom,
  removeRoom,
};
