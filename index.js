// const express = require("express");
// const http = require("http");
// const cors = require("cors");

// const { Server } = require("socket.io");
// const sessionRoutes = require("./routes/session.routes");

// app.use("/api/session", sessionRoutes);
// const registerSockets = require("./socket/index");

// const app = express();

// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST"],
//   credentials: false,
// };

// app.use(cors(corsOptions));

// app.use("/api/session", sessionRoutes);

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: corsOptions,
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

const registerSockets = require("./socket");


const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());



const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

registerSockets(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Signaling server running on ${PORT}`);
});
