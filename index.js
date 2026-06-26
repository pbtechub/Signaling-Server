// const express = require("express");
// const http = require("http");
// const cors = require("cors");

// const { Server } = require("socket.io");

// const registerSockets = require("./socket/index");

// const app = express();

// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// registerSockets(io);

// server.listen(5000, () => {
//   console.log("Signaling server running");
// });

// Deployment code

// const express = require("express");
// const http = require("http");
// const cors = require("cors");

// const { Server } = require("socket.io");

// const registerSockets = require("./socket/index");

// const app = express();

// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// registerSockets(io);

// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`Signaling server running on port ${PORT}`);
// });

const express = require("express");
const http = require("http");
const cors = require("cors");

const { Server } = require("socket.io");

const registerSockets = require("./socket/index");

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: false,
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

registerSockets(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
