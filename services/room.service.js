// const {
//   createRoom,
//   getRoom,
//   addUser: storeAddUser,
//   removeUser: storeRemoveUser,
//   removeRoom,
//   getRoomUsers,
// } = require("../store/room.store");

// /**
//  * Add user into room
//  *
//  * user comes from verified JWT
//  */
// const addUser = (roomId, user, socketId) => {
//   const room = createRoom(roomId);

//   if (!room) {
//     return {
//       success: false,
//       message: "Room creation failed",
//     };
//   }

//   const existingUser = room.users[user.role];

//   /**
//    * Same user reconnecting
//    */
//   if (existingUser && existingUser.id === user.id) {
//     storeAddUser(roomId, user, socketId);

//     return {
//       success: true,
//       refreshed: true,
//       room,
//     };
//   }

//   /**
//    * Different user same role
//    */
//   if (existingUser) {
//     return {
//       success: false,

//       message: `A ${user.role} already exists in this room`,
//     };
//   }

//   /**
//    * Room capacity check
//    */
//   const hasTutor = !!room.users.tutor;

//   const hasLearner = !!room.users.learner;

//   if (hasTutor && hasLearner) {
//     return {
//       success: false,

//       message: "Room already has maximum participants",
//     };
//   }

//   storeAddUser(roomId, user, socketId);

//   return {
//     success: true,

//     refreshed: false,

//     room,
//   };
// };

// /**
//  * Explicit leave
//  */
// const removeUser = (roomId, userId) => {
//   const room = getRoom(roomId);

//   if (!room) return;

//   storeRemoveUser(roomId, userId);

//   const empty = !room.users.tutor && !room.users.learner;

//   if (empty) {
//     removeRoom(roomId);
//   }
// };

// /**
//  * Return participants
//  */
// const getUsers = (roomId) => {
//   const users = getRoomUsers(roomId);

//   return users.map((user) => ({
//     id: user.id,

//     socketId: user.socketId,

//     role: user.role,

//     name: user.name,

//     email: user.email,

//     status: user.connected ? "connected" : "disconnected",
//   }));
// };

// module.exports = {
//   addUser,

//   removeUser,

//   getUsers,
// };

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
