const { createRoom, getRoom, addUser: storeAddUser, removeRoom } = require("../store/room.store");

const addUser = (roomId, user) => {
  const room = storeAddUser(roomId, user, user.socketId);

  if (!room) {
    return {
      success: false,
      message: "Failed to add user to room",
    };
  }

  // Check room capacity (max 2 users: 1 tutor, 1 learner)
  const tutorCount = room.users?.tutor ? 1 : 0;
  const learnerCount = room.users?.learner ? 1 : 0;
  const totalUsers = tutorCount + learnerCount;

  // If this is a new user and room is full, reject
  if (totalUsers >= 2 && !room.users[user.role]?.id) {
    return {
      success: false,
      message: "Room is full. Maximum 2 participants allowed (1 tutor, 1 learner)",
    };
  }

  // If same role already exists but different user, reject
  const existingUser = room.users[user.role];
  if (existingUser && existingUser.id !== user.id) {
    return {
      success: false,
      message: `A ${user.role} is already in this room`,
    };
  }

  return {
    success: true,
    refreshed: existingUser?.id === user.id, // true if same user reconnecting
    room,
  };
};

const removeUser = (roomId, socketId) => {
  const room = getRoom(roomId);

  if (!room) return;

  // Find and clear the user from room
  if (room.users?.tutor?.socketId === socketId) {
    room.users.tutor = null;
  }

  if (room.users?.learner?.socketId === socketId) {
    room.users.learner = null;
  }

  // Remove room if empty
  if (!room.users?.tutor && !room.users?.learner) {
    removeRoom(roomId);
  }
};

const getUsers = (roomId) => {
  const room = getRoom(roomId);

  if (!room) return [];

  const users = [];

  if (room.users?.tutor) {
    users.push({
      id: room.users.tutor.id,
      socketId: room.users.tutor.socketId,
      role: "tutor",
      name: room.users.tutor.name || "Tutor",
      status: room.users.tutor.connected ? "connected" : "disconnected",
    });
  }

  if (room.users?.learner) {
    users.push({
      id: room.users.learner.id,
      socketId: room.users.learner.socketId,
      role: "learner",
      name: room.users.learner.name || "Learner",
      status: room.users.learner.connected ? "connected" : "disconnected",
    });
  }

  return users;
};

module.exports = {
  addUser,
  removeUser,
  getUsers,
};
