const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const { initGame, gameLoop, getUpdatedVelocity } = require("./src/game");
const { makeId } = require("./src/utils");
const { FRAME_RATE } = require("./src/constants");
const path = require("path");

const state = {};
const clientRooms = {};

app.use(express.static(path.join(__dirname, "client")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

io.on("connection", (socket) => {
  socket.on("keydown", handleKeyDown);
  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName);

    let numClients = 0;
    if (room) {
      numClients = room.size;
    }

    if (numClients === 0) {
      socket.emit("unknownCode");
      return;
    } else if (numClients > 1) {
      socket.emit("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = roomName;

    socket.join(roomName);
    socket.number = 2;
    socket.emit("init", 2);

    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeId();
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = initGame();

    socket.join(roomName);
    socket.number = 1;
    socket.emit("init", 1);
  }

  function handleKeyDown(keyCode) {
    const roomName = clientRooms[socket.id];

    if (!roomName) {
      return;
    }

    try {
      keyCode = parseInt(keyCode);
    } catch (error) {
      console.error(error);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);
    if (vel) {
      state[roomName].players[socket.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);

    if (!winner) {
      emitGameState(roomName, state[roomName]);
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
  io.sockets.in(roomName).emit("gameState", JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
}

server.listen(3000, () => {
  console.log("Server running on 3000");
});
