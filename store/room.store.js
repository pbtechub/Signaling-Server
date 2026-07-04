// // const rooms = {};

// // const sessions = {};

// // /**
// //  * Create or return room
// //  */
// // const createRoom = (roomId, sessionData = {}) => {
// //   if (!rooms[roomId]) {
// //     rooms[roomId] = {
// //       roomId,

// //       // users stored by permanent userId
// //       users: {
// //         tutor: null,

// //         learner: null,
// //       },

// //       // active sockets
// //       sockets: {},

// //       // session information
// //       session: {
// //         sessionId: sessionData.sessionId || null,

// //         startTime: sessionData.startTime || null,

// //         endTime: sessionData.endTime || null,

// //         duration: sessionData.duration || .5,
// //       },

// //       status: "waiting",

// //       startedAt: null,

// //       endsAt: null,

// //       createdAt: Date.now(),
// //     };
// //   }

// //   return rooms[roomId];
// // };

// // /**
// //  * Get room
// //  */
// // const getRoom = (roomId) => {
// //   return rooms[roomId];
// // };

// // /**
// //  * Add user
// //  *
// //  * user = {
// //  *   id,
// //  *   role,
// //  *   name
// //  * }
// //  */
// // const addUser = (roomId, user, socketId) => {
// //   const room = createRoom(roomId);

// //   room.users[user.role] = {
// //     id: user.id,

// //     name: user.name,

// //     role: user.role,

// //     connected: true,

// //     socketId,

// //     lastSeen: Date.now(),
// //   };

// //   room.sockets[socketId] = user.id;

// //   return room;
// // };

// // /**
// //  * User reconnect
// //  */
// // const reconnectUser = (roomId, user, socketId) => {
// //   const room = rooms[roomId];

// //   if (!room) return null;

// //   room.users[user.role] = {
// //     ...room.users[user.role],

// //     socketId,

// //     connected: true,

// //     lastSeen: Date.now(),
// //   };

// //   room.sockets[socketId] = user.id;

// //   return room;
// // };

// // /**
// //  * Remove socket only
// //  *
// //  * don't delete user
// //  * because refresh can reconnect
// //  */
// // const disconnectUser = (roomId, socketId) => {
// //   const room = rooms[roomId];

// //   if (!room) return;

// //   const userId = room.sockets[socketId];

// //   if (!userId) return;

// //   Object.values(room.users).forEach((user) => {
// //     if (user?.id === userId) {
// //       user.connected = false;

// //       user.lastSeen = Date.now();
// //     }
// //   });

// //   delete room.sockets[socketId];
// // };

// // /**
// //  * Remove complete room
// //  */
// // const removeRoom = (roomId) => {
// //   delete rooms[roomId];
// // };

// // module.exports = {
// //   rooms,

// //   sessions,

// //   createRoom,

// //   getRoom,

// //   addUser,

// //   reconnectUser,

// //   disconnectUser,

// //   removeRoom,
// // };

// const rooms = {};

// const sessions = {};

// /**
//  * Create or return room
//  *
//  * sessionData comes from meeting creation
//  */
// const createRoom = (roomId, sessionData = {}) => {
//   if (!rooms[roomId]) {
//     rooms[roomId] = {
//       roomId,

//       /**
//        * users by role
//        */
//       users: {
//         tutor: null,

//         learner: null,
//       },

//       /**
//        * socket mapping
//        *
//        * socketId -> userId
//        */
//       sockets: {},

//       /**
//        * Secure session data
//        */
//       session: {
//         sessionId: sessionData.sessionId || null,

//         meetingId: sessionData.meetingId || null,

//         startTime: sessionData.startTime || null,

//         endTime: sessionData.endTime || null,

//         duration: sessionData.duration || 60,

//         status: sessionData.status || "scheduled",

//         permissions: sessionData.permissions || {
//           chat: true,

//           screenShare: false,

//           recording: false,

//           handRaise: true,
//         },
//       },

//       status: "waiting",

//       startedAt: null,

//       endsAt: null,

//       createdAt: Date.now(),
//     };
//   }

//   return rooms[roomId];
// };

// /**
//  * Get room
//  */
// const getRoom = (roomId) => {
//   return rooms[roomId];
// };

// /**
//  * Add authenticated user
//  *
//  * user comes from JWT
//  *
//  * {
//  * id,
//  * name,
//  * role,
//  * email
//  * }
//  */
// const addUser = (roomId, user, socketId) => {
//   const room = createRoom(roomId);

//   const participant = {
//     id: user.id,

//     name: user.name,

//     email: user.email || null,

//     role: user.role,

//     socketId,

//     connected: true,

//     joinedAt: Date.now(),

//     lastSeen: Date.now(),
//   };

//   room.users[user.role] = participant;

//   room.sockets[socketId] = user.id;

//   return room;
// };

// /**
//  * Reconnect existing user
//  */
// const reconnectUser = (roomId, user, socketId) => {
//   const room = rooms[roomId];

//   if (!room) {
//     return null;
//   }

//   const existing = room.users[user.role];

//   if (!existing) {
//     return addUser(roomId, user, socketId);
//   }

//   room.users[user.role] = {
//     ...existing,

//     socketId,

//     connected: true,

//     lastSeen: Date.now(),
//   };

//   room.sockets[socketId] = user.id;

//   return room;
// };

// /**
//  * Temporary disconnect
//  */
// const disconnectUser = (roomId, socketId) => {
//   const room = rooms[roomId];

//   if (!room) return;

//   const userId = room.sockets[socketId];

//   if (!userId) return;

//   Object.values(room.users).forEach((user) => {
//     if (user && user.id === userId) {
//       user.connected = false;

//       user.lastSeen = Date.now();
//     }
//   });

//   delete room.sockets[socketId];
// };

// /**
//  * Remove user after real leave
//  */
// const removeUser = (roomId, userId) => {
//   const room = rooms[roomId];

//   if (!room) return;

//   Object.keys(room.users).forEach((role) => {
//     if (room.users[role]?.id === userId) {
//       delete room.users[role];
//     }
//   });

//   Object.keys(room.sockets).forEach((socketId) => {
//     if (room.sockets[socketId] === userId) {
//       delete room.sockets[socketId];
//     }
//   });
// };

// /**
//  * Get room users
//  */
// const getRoomUsers = (roomId) => {
//   const room = getRoom(roomId);

//   if (!room) return [];

//   return Object.values(room.users).filter(Boolean);
// };

// const removeRoom = (roomId) => {
//   delete rooms[roomId];
// };

// module.exports = {
//   rooms,

//   sessions,

//   createRoom,

//   getRoom,

//   addUser,

//   reconnectUser,

//   disconnectUser,

//   removeUser,

//   getRoomUsers,

//   removeRoom,
// };

const rooms = {};

/**
 * ============================================================
 * Create Room
 * ============================================================
 */
const createRoom = (roomId, sessionData = {}) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,

      users: {
        tutor: null,
        learner: null,
      },

      sockets: {},

      session: {
        sessionId: sessionData.sessionId || null,

        roomId: sessionData.roomId || roomId,

        meetingId: sessionData.meetingId || null,

        startTime: sessionData.startTime || null,

        endTime: sessionData.endTime || null,

        duration: sessionData.duration || 60,

        status: sessionData.status || "scheduled",

        permissions: sessionData.permissions || {
          chat: true,
          screenShare: false,
          recording: false,
          handRaise: true,
        },

        tutorToken: sessionData.tutorToken || null,

        learnerToken: sessionData.learnerToken || null,

        metadata: sessionData.metadata || null,

        role: sessionData.role || null,

        timezone: sessionData.timezone || null,
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
 * ============================================================
 * Get Room
 * ============================================================
 */
const getRoom = (roomId) => rooms[roomId];

/**
 * ============================================================
 * Add User
 * ============================================================
 */
const addUser = (roomId, user, socketId, sessionData = {}) => {
  const room = createRoom(roomId, sessionData);

  room.users[user.role] = {
    id: user.id,

    name: user.name,

    email: user.email || null,

    role: user.role,

    socketId,

    connected: true,

    joinedAt: Date.now(),

    lastSeen: Date.now(),
  };

  room.sockets[socketId] = user.id;

  return room;
};

/**
 * ============================================================
 * Reconnect User
 * ============================================================
 */
const reconnectUser = (roomId, user, socketId) => {
  const room = rooms[roomId];

  if (!room) return null;

  const existing = room.users[user.role];

  if (!existing) {
    return addUser(roomId, user, socketId);
  }

  room.users[user.role] = {
    ...existing,

    socketId,

    connected: true,

    lastSeen: Date.now(),
  };

  room.sockets[socketId] = user.id;

  return room;
};

/**
 * ============================================================
 * Disconnect User
 * ============================================================
 */
const disconnectUser = (roomId, socketId) => {
  const room = rooms[roomId];

  if (!room) return;

  const userId = room.sockets[socketId];

  if (!userId) return;

  Object.values(room.users).forEach((participant) => {
    if (participant && participant.id === userId) {
      participant.connected = false;
      participant.lastSeen = Date.now();
    }
  });

  delete room.sockets[socketId];
};

/**
 * ============================================================
 * Remove User
 * ============================================================
 */
const removeUser = (roomId, userId) => {
  const room = rooms[roomId];

  if (!room) return;

  Object.keys(room.users).forEach((role) => {
    if (room.users[role] && room.users[role].id === userId) {
      room.users[role] = null;
    }
  });

  Object.keys(room.sockets).forEach((socketId) => {
    if (room.sockets[socketId] === userId) {
      delete room.sockets[socketId];
    }
  });
};

/**
 * ============================================================
 * Room Users
 * ============================================================
 */
const getRoomUsers = (roomId) => {
  const room = getRoom(roomId);

  if (!room) return [];

  return Object.values(room.users).filter(Boolean);
};

/**
 * ============================================================
 * Remove Room
 * ============================================================
 */
const removeRoom = (roomId) => {
  delete rooms[roomId];
};

/**
 * ============================================================
 * Room Exists
 * ============================================================
 */
const roomExists = (roomId) => !!rooms[roomId];

/**
 * ============================================================
 * Participant Count
 * ============================================================
 */
const getParticipantCount = (roomId) => {
  const room = rooms[roomId];

  if (!room) return 0;

  return Object.values(room.users).filter(Boolean).length;
};

module.exports = {
  rooms,

  createRoom,

  getRoom,

  addUser,

  reconnectUser,

  disconnectUser,

  removeUser,

  getRoomUsers,

  removeRoom,

  roomExists,

  getParticipantCount,
};
