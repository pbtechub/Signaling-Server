// const rooms = {};

// const sessions = {};

// const createRoom = (roomId) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = {
//       tutor: null,

//       learner: null,

//       createdAt: Date.now(),

//       status: "active",
//     };
//   }

//   return rooms[roomId];
// };

// const getRoom = (roomId) => {
//   return rooms[roomId];
// };

// const removeRoom = (roomId) => {
//   delete rooms[roomId];
// };

// module.exports = {
//   rooms,
//   sessions,
//   createRoom,
//   getRoom,
//   removeRoom,
// };

// const rooms = {};

// const sessions = {};

// const ROOM_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour

// const createRoom = (roomId) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = {
//       tutor: null,

//       learner: null,

//       createdAt: Date.now(),

//       status: "active",
//     };
//   }

//   return rooms[roomId];
// };

// const getRoom = (roomId) => {
//   const room = rooms[roomId];

//   if (!room) {
//     return null;
//   }

//   const expired = Date.now() - room.createdAt > ROOM_EXPIRY_TIME;

//   if (expired) {
//     delete rooms[roomId];

//     return null;
//   }

//   return room;
// };

// const removeRoom = (roomId) => {
//   delete rooms[roomId];
// };

// module.exports = {
//   rooms,
//   sessions,
//   createRoom,
//   getRoom,
//   removeRoom,
// };

const rooms = {};

const sessions = {};

const createRoom = (roomId) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,

      tutor: null,

      learner: null,

      // session data

      status: "waiting",

      duration: 90, // minutes

      startedAt: null,

      endsAt: null,

      createdAt: Date.now(),
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
