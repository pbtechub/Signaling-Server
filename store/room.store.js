// const rooms = {};

// const sessions = {};

// const createRoom = (roomId) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = {
//       roomId,

//       tutor: null,

//       learner: null,

//       // session data

//       status: "waiting",

//       duration: 0.5, // minutes

//       startedAt: null,

//       endsAt: null,

//       createdAt: Date.now(),
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

// room.store.js

const rooms = {};

const sessions = {};

/**
 * Create or return room
 */
const createRoom = (roomId, sessionData = {}) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,

      // users stored by permanent userId
      users: {
        tutor: null,

        learner: null,
      },

      // active sockets
      sockets: {},

      // session information
      session: {
        sessionId: sessionData.sessionId || null,

        startTime: sessionData.startTime || null,

        endTime: sessionData.endTime || null,

        duration: sessionData.duration || 60,
      },

      status: "waiting",

      startedAt: null,

      endsAt: null,

      createdAt: Date.now(),
    };
  }

  return rooms[roomId];
};

/**
 * Get room
 */
const getRoom = (roomId) => {
  return rooms[roomId];
};

/**
 * Add user
 *
 * user = {
 *   id,
 *   role,
 *   name
 * }
 */
const addUser = (roomId, user, socketId) => {
  const room = createRoom(roomId);

  room.users[user.role] = {
    id: user.id,

    name: user.name,

    role: user.role,

    connected: true,

    socketId,

    lastSeen: Date.now(),
  };

  room.sockets[socketId] = user.id;

  return room;
};

/**
 * User reconnect
 */
const reconnectUser = (roomId, user, socketId) => {
  const room = rooms[roomId];

  if (!room) return null;

  room.users[user.role] = {
    ...room.users[user.role],

    socketId,

    connected: true,

    lastSeen: Date.now(),
  };

  room.sockets[socketId] = user.id;

  return room;
};

/**
 * Remove socket only
 *
 * don't delete user
 * because refresh can reconnect
 */
const disconnectUser = (roomId, socketId) => {
  const room = rooms[roomId];

  if (!room) return;

  const userId = room.sockets[socketId];

  if (!userId) return;

  Object.values(room.users).forEach((user) => {
    if (user?.id === userId) {
      user.connected = false;

      user.lastSeen = Date.now();
    }
  });

  delete room.sockets[socketId];
};

/**
 * Remove complete room
 */
const removeRoom = (roomId) => {
  delete rooms[roomId];
};

module.exports = {
  rooms,

  sessions,

  createRoom,

  getRoom,

  addUser,

  reconnectUser,

  disconnectUser,

  removeRoom,
};
