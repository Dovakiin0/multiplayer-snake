const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const { initGame, gameLoop, getUpdatedVelocity } = require("./src/game");
const { FRAME_RATE } = require("./src/constants");

const state = {};
const clientRooms = {};

io.on("connection", (socket) => {
  socket.on("keydown", handleKeyDown);
  socket.on("newGame", handleNewGame);

  function handleNewGame() {
    let roomName = makeId(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = initGame();

    socket.join(roomName);
    socket.number = 1;
    socket.emit("init", 1);
  }

  function handleKeyDown(keyCode) {
    try {
      keyCode = parseInt(keyCode);
    } catch (error) {
      console.error(error);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);
    if (vel) {
      state.player.vel = vel;
    }
  }

  startGameInterval(socket, state);
});

function startGameInterval(socket, state) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state);

    if (!winner) {
      socket.emit("gameState", JSON.stringify(state));
    } else {
      socket.emit("gameOver");
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

server.listen(3000, () => {
  console.log("Server running on 3000");
});
