const {
  createRoom,
  getRoom,
  addUser: storeAddUser,
  removeUser: storeRemoveUser,
  removeRoom,
  getRoomUsers,
} = require("../store/room.store");

/**
 * ============================================================
 * Add User
 * ============================================================
 */
const addUser = (roomId, user, socketId, session = {}) => {
  /**
   * Create room if not exists.
   * Session information comes from Main Backend.
   */
  const room = createRoom(roomId, {
    ...session,
    sessionId: session.sessionId,
    roomId: session.roomId || roomId,
    meetingId: session.meetingId,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    permissions: session.permissions,
    status: session.status,
    tutorToken: session.tutorToken,
    learnerToken: session.learnerToken,
    metadata: session.metadata,
    role: session.role,
    timezone: session.timezone,
  });

  if (!room) {
    return {
      success: false,
      message: "Unable to create room.",
    };
  }

  /**
   * Same user reconnecting
   */
  const existingUser = room.users[user.role];

  if (existingUser && existingUser.id === user.id) {
    storeAddUser(roomId, user, socketId);

    return {
      success: true,
      refreshed: true,
      room,
    };
  }

  /**
   * Another Tutor/Learner already exists
   */
  if (existingUser) {
    return {
      success: false,
      message: `${user.role} already exists in room.`,
    };
  }

  /**
   * Maximum 2 participants
   */
  const participantCount = Object.values(room.users).filter(Boolean).length;

  if (participantCount >= 2) {
    return {
      success: false,
      message: "Room already full.",
    };
  }

  /**
   * Store participant
   */
  storeAddUser(roomId, user, socketId);

  return {
    success: true,
    refreshed: false,
    room,
  };
};

/**
 * ============================================================
 * Remove User
 * ============================================================
 */
const removeUser = (roomId, userId) => {
  const room = getRoom(roomId);

  if (!room) return;

  storeRemoveUser(roomId, userId);

  const participantCount = Object.values(room.users).filter(Boolean).length;

  /**
   * Destroy room when empty
   */
  if (participantCount === 0) {
    removeRoom(roomId);
  }
};

/**
 * ============================================================
 * Get Users
 * ============================================================
 */
const getUsers = (roomId) => {
  const users = getRoomUsers(roomId);

  return users.map((user) => ({
    id: user.id,
    socketId: user.socketId,
    role: user.role,
    name: user.name,
    email: user.email,
    connected: user.connected,
    joinedAt: user.joinedAt,
    lastSeen: user.lastSeen,
  }));
};

/**
 * ============================================================
 * Get Room
 * ============================================================
 */
const getRoomDetails = (roomId) => {
  return getRoom(roomId);
};

module.exports = {
  addUser,
  removeUser,
  getUsers,
  getRoomDetails,
};

// const {
//   createRoom,
//   getRoom,
//   addUser: storeAddUser,
//   removeUser: storeRemoveUser,
//   removeRoom,
//   getRoomUsers,
// } = require("../store/room.store");

// const addUser = (roomId, user, socketId, session = {}) => {
//   const room = createRoom(roomId, {
//     ...session,
//     sessionId: session.sessionId,
//     roomId: session.roomId || roomId,
//     status: session.status,
//   });

//   if (!room) {
//     return { success: false, message: "Unable to create room." };
//   }

//   const existingUser = room.users[user.role];

//   // If the EXACT same user instance is re-connecting on a new socket
//   if (existingUser && existingUser.id === user.id) {
//     // Check if the socketId actually changed before overwriting
//     const isNewSocket = existingUser.socketId !== socketId;

//     storeAddUser(roomId, user, socketId);

//     return {
//       success: true,
//       refreshed: isNewSocket, // Flags if signaling channel needs resetting
//       room,
//     };
//   }

//   if (existingUser) {
//     return {
//       success: false,
//       message: `${user.role} already exists in room.`,
//     };
//   }

//   const participantCount = Object.values(room.users).filter(Boolean).length;
//   if (participantCount >= 2) {
//     return { success: false, message: "Room already full." };
//   }

//   storeAddUser(roomId, user, socketId);

//   return {
//     success: true,
//     refreshed: false,
//     room,
//   };
// };

// const removeUser = (roomId, userId) => {
//   const room = getRoom(roomId);
//   if (!room) return;

//   storeRemoveUser(roomId, userId);

//   const participantCount = Object.values(room.users).filter(Boolean).length;
//   if (participantCount === 0) {
//     removeRoom(roomId);
//   }
// };

// const getUsers = (roomId) => {
//   const users = getRoomUsers(roomId);
//   return users.map((user) => ({
//     id: user.id,
//     socketId: user.socketId,
//     role: user.role,
//     name: user.name,
//     email: user.email,
//     connected: user.connected,
//   }));
// };

// module.exports = { addUser, removeUser, getUsers, getRoomDetails: getRoom };
