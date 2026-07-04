const jwt = require("jsonwebtoken");

const SECRET = process.env.MEETING_SECRET;

const generateMeetingToken = (payload) => {
  return jwt.sign(payload, SECRET, {
    expiresIn: "2h",
  });
};

const verifyMeetingToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = {
  generateMeetingToken,
  verifyMeetingToken,
};
