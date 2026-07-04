const { generateMeetingToken } = require("./token.service");

const createMeeting = (session) => {
  const roomId = "room_" + Math.random().toString(36).substring(2, 10);

  const tokenPayload = {
    meetingId: session.sessionId,

    roomId,

    tutor: {
      id: session.tutor.id,
      name: session.tutor.name,
      role: "tutor",
    },

    learner: {
      id: session.learner.id,
      name: session.learner.name,
      role: "learner",
    },

    permissions: session.permissions,
  };

  const token = generateMeetingToken(tokenPayload);

  return {
    roomId,

    token,

    expiresAt: session.endTime,
  };
};

module.exports = {
  createMeeting,
};
