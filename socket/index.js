const roomSocket = require("./room.socket");

const webrtcSocket = require("./webrtc.socket");

const chatSocket = require("./chat.socket");

const sessionSocket = require("./session.socket");

const registerHandRaise = require("./handRaise.socket");

const registerRecordingConsent = require("./recordingConsent.socket");

const registerTutorControls = require("./tutorControls.socket");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected", socket.id);

    roomSocket(io, socket);

    webrtcSocket(io, socket);

    chatSocket(io, socket);

    sessionSocket(io, socket);

    registerHandRaise(io, socket);

    registerRecordingConsent(io, socket);

     registerTutorControls(io, socket);
  });
};
