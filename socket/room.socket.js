const { addUser, removeUser, getUsers } = require("../services/room.service");

const { getRoom, disconnectUser } = require("../store/room.store");

const { startSessionExpiryWatcher } = require("../services/session.service");

const normalizeSessionPayload = (data = {}) => {
  const payload = data?.data || data || {};
  const session = payload?.sessionData || payload?.data || payload || {};
  const role = data?.role || payload?.role || session?.role || null;
  const participant =
    role === "tutor"
      ? session?.tutor
      : role === "learner"
        ? session?.learner
        : null;

  const userId =
    data?.userId ||
    data?.id ||
    data?.user?.id ||
    data?.user?.userId ||
    participant?._id ||
    session?.userId ||
    null;

  const name =
    data?.name ||
    data?.user?.name ||
    [participant?.first_name, participant?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    session?.name ||
    null;

  const email =
    data?.email ||
    data?.user?.email ||
    participant?.email ||
    session?.email ||
    null;

  const roomId = data?.roomId || payload?.roomId || session?.roomId || null;
  const sessionId =
    data?.sessionId || payload?.sessionId || session?.sessionId || null;

  return {
    roomId,
    sessionId,
    userId,
    role,
    name,
    email,
    sessionData: {
      ...session,
      roomId,
      sessionId,
      role,
      status: payload?.status || session?.status || "scheduled",
      startTime: payload?.startTime || session?.startTime || null,
      endTime: payload?.endTime || session?.endTime || null,
      duration: payload?.duration || session?.duration || 60,
      tutorToken: payload?.tutorToken || session?.tutorToken || null,
      learnerToken: payload?.learnerToken || session?.learnerToken || null,
      metadata: session?.metadata || null,
      timezone: session?.timezone || null,
      permissions: session?.permissions || {
        chat: true,
        screenShare: false,
        recording: false,
        handRaise: true,
      },
    },
  };
};

module.exports = (io, socket) => {
  let joinedRoom = null;
  let joinedUserId = null;

  /**
   * ============================================================
   * JOIN ROOM
   * ============================================================
   */
  socket.on("join-room", (data) => {
    try {
      const normalized = normalizeSessionPayload(data);
      const { roomId, sessionId, userId, role, name, email, sessionData } =
        normalized;

      if (!roomId || !sessionId || !userId || !role) {
        socket.emit("room-error", {
          message: "Invalid room payload.",
        });

        return;
      }

      const user = {
        id: userId,
        role,
        name,
        email,
      };

      joinedRoom = roomId;
      joinedUserId = userId;

      socket.user = {
        ...user,
        roomId,
        sessionId,
        sessionData,
      };

      socket.join(roomId);

      const result = addUser(roomId, user, socket.id, sessionData);

      if (!result.success) {
        socket.leave(roomId);

        socket.emit("room-error", {
          message: result.message,
        });

        return;
      }

      const users = getUsers(roomId);

      /**
       * Send participant list
       */
      io.to(roomId).emit("room-users", users);

      /**
       * Notify existing peer
       */
      socket.to(roomId).emit("user-joined", user);

      /**
       * Notify newly joined user
       */
      socket.emit("room-joined", {
        roomId,
        users,
      });

      /**
       * Send active session state if session already started
       */
      const room = getRoom(roomId);

      if (room?.status === "active") {
        socket.emit("session-started", {
          startedAt: room.startedAt,
          endsAt: room.endsAt,
          duration: room.session.duration,
        });
      }

      console.log(`[ROOM] ${role} joined room ${roomId}`);
    } catch (err) {
      console.error(err);

      socket.emit("room-error", {
        message: "Unable to join room.",
      });
    }
  });

  /**
   * ============================================================
   * START SESSION
   * Only Tutor
   * ============================================================
   */
  socket.on("start-session", () => {
    if (!joinedRoom) return;

    const room = getRoom(joinedRoom);

    if (!room) return;

    if (socket.user.role !== "tutor") {
      socket.emit("session-error", {
        message: "Only tutor can start the session.",
      });

      return;
    }

    if (room.status === "active") return;

    const duration = room.session.duration || 60;

    room.status = "active";

    room.startedAt = Date.now();

    room.endsAt = room.startedAt + duration * 60 * 1000;

    startSessionExpiryWatcher(io, joinedRoom);

    io.to(joinedRoom).emit("session-started", {
      startedAt: room.startedAt,
      endsAt: room.endsAt,
      duration,
    });

    console.log(`[SESSION] Started ${joinedRoom}`);
  });

  /**
   * ============================================================
   * LEAVE ROOM
   * ============================================================
   */
  socket.on("leave-room", () => {
    if (!joinedRoom) return;

    removeUser(joinedRoom, joinedUserId);

    socket.leave(joinedRoom);

    io.to(joinedRoom).emit("user-left", {
      userId: joinedUserId,
    });

    console.log(`[ROOM] ${joinedUserId} left ${joinedRoom}`);
  });

  /**
   * ============================================================
   * DISCONNECT
   * ============================================================
   */
  socket.on("disconnect", () => {
    if (!joinedRoom) return;

    disconnectUser(joinedRoom, socket.id);

    io.to(joinedRoom).emit("user-disconnected", {
      userId: joinedUserId,
    });

    console.log(`[ROOM] ${joinedUserId} disconnected`);
  });
};
