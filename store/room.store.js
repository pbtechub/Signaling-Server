// const rooms = {};

// const createRoom = (roomId, sessionData = {}) => {
//   console.log(sessionData);
//   if (!rooms[roomId]) {
//     rooms[roomId] = {
//       roomId,

//       users: {
//         tutor: null,
//         learner: null,
//       },

//       sockets: {},

//       session: {
//         sessionId: sessionData.sessionId || null,

//         roomId: sessionData.roomId || roomId,

//         meetingId: sessionData.meetingId || null,

//         startTime: sessionData.startTime || null,

//         endTime: sessionData.endTime || null,

//         duration: sessionData.duration || .5,

//         status: sessionData.status || "scheduled",

//         permissions: sessionData.permissions || {
//           chat: true,
//           screenShare: false,
//           recording: false,
//           handRaise: true,
//         },

//         tutorToken: sessionData.tutorToken || null,

//         learnerToken: sessionData.learnerToken || null,

//         metadata: sessionData.metadata || null,

//         role: sessionData.role || null,

//         timezone: sessionData.timezone || null,
//       },

//       status: "waiting",

//       startedAt: null,

//       endsAt: null,

//       warningSent: false,

//       createdAt: Date.now(),
//     };
//   }

//   return rooms[roomId];
// };

// const getRoom = (roomId) => rooms[roomId];

// const addUser = (roomId, user, socketId, sessionData = {}) => {
//   const room = createRoom(roomId, sessionData);

//   room.users[user.role] = {
//     id: user.id,
//     name: user.name,
//     email: user.email || null,
//     role: user.role,
//     socketId,
//     connected: true,
//     joinedAt: Date.now(),
//     lastSeen: Date.now(),
//   };

//   room.sockets[socketId] = user.id;

//   return room;
// };

// const reconnectUser = (roomId, user, socketId) => {
//   const room = rooms[roomId];

//   if (!room) return null;

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

// const disconnectUser = (roomId, socketId) => {
//   const room = rooms[roomId];

//   if (!room) return;

//   const userId = room.sockets[socketId];

//   if (!userId) return;

//   Object.values(room.users).forEach((participant) => {
//     if (participant && participant.id === userId) {
//       participant.connected = false;
//       participant.lastSeen = Date.now();
//     }
//   });

//   delete room.sockets[socketId];
// };

// const removeUser = (roomId, userId) => {
//   const room = rooms[roomId];

//   if (!room) return;

//   Object.keys(room.users).forEach((role) => {
//     if (room.users[role] && room.users[role].id === userId) {
//       room.users[role] = null;
//     }
//   });

//   Object.keys(room.sockets).forEach((socketId) => {
//     if (room.sockets[socketId] === userId) {
//       delete room.sockets[socketId];
//     }
//   });
// };

// const getRoomUsers = (roomId) => {
//   const room = getRoom(roomId);

//   if (!room) return [];

//   return Object.values(room.users).filter(Boolean);
// };

// const removeRoom = (roomId) => {
//   delete rooms[roomId];
// };

// const roomExists = (roomId) => !!rooms[roomId];

// const getParticipantCount = (roomId) => {
//   const room = rooms[roomId];

//   if (!room) return 0;

//   return Object.values(room.users).filter(Boolean).length;
// };

// module.exports = {
//   rooms,
//   createRoom,
//   getRoom,
//   addUser,
//   reconnectUser,
//   disconnectUser,
//   removeUser,
//   getRoomUsers,
//   removeRoom,
//   roomExists,
//   getParticipantCount,
// };

const rooms = {};

/**
 * Resolves the room's scheduled wall-clock start/end from the booking
 * data (session.startTime / session.endTime / session.duration), so the
 * timer can be driven off the actual booked slot rather than "whenever
 * the tutor happens to click Start".
 *
 * Returns { scheduledStart, scheduledEnd } in ms, or nulls if the booking
 * didn't include a real startTime (e.g. an ad-hoc/test room) - callers
 * fall back to the old manual-start behavior in that case.
 */
const resolveScheduledTimes = (session = {}) => {
  const scheduledStart = Date.parse(session.startTime);

  if (!Number.isFinite(scheduledStart)) {
    return { scheduledStart: null, scheduledEnd: null };
  }

  const explicitEnd = Date.parse(session.endTime);
  const duration = Number(session.duration) || 60;

  const scheduledEnd =
    Number.isFinite(explicitEnd) && explicitEnd > scheduledStart
      ? explicitEnd
      : scheduledStart + duration * 60 * 1000;

  return { scheduledStart, scheduledEnd };
};

const createRoom = (roomId, sessionData = {}) => {
  console.log(sessionData);
  if (!rooms[roomId]) {
    const { scheduledStart, scheduledEnd } = resolveScheduledTimes(sessionData);

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
        duration: sessionData.duration || 0.5,
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

      // "waiting" = not started yet, "active" = timer running, "ended" = done.
      status: "waiting",

      // Pre-computed from the booking's scheduled start/end, NOT from
      // whenever a participant happens to join or click a button. If the
      // booking had no real startTime (ad-hoc/test room), these stay null
      // and the room falls back to manual start-session.
      startedAt: scheduledStart,

      endsAt: scheduledEnd,

      // True once the scheduled start has actually passed and the room
      // has been flipped to "active" - lets the watcher tell "not started
      // yet" apart from "manually started with no real schedule".
      autoStartEligible: scheduledStart !== null,

      warningSent: false,

      createdAt: Date.now(),
    };
  }

  return rooms[roomId];
};

const getRoom = (roomId) => rooms[roomId];

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

const getRoomUsers = (roomId) => {
  const room = getRoom(roomId);

  if (!room) return [];

  return Object.values(room.users).filter(Boolean);
};

const removeRoom = (roomId) => {
  delete rooms[roomId];
};

const roomExists = (roomId) => !!rooms[roomId];

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
