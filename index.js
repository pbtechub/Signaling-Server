const express = require("express");
const http = require("http");
const cors = require("cors");

const { Server } = require("socket.io");

const registerSockets = require("./socket/index");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

registerSockets(io);

server.listen(5000, () => {
  console.log("Signaling server running");
});
