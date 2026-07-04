const rooms = {};

const createRoom = (roomId, sessionData = {}) => {
  console.log(sessionData);
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

        duration: sessionData.duration || .5,

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
