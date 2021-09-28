const BG_COLOR = "#231F20";
const SNAKE_COLOR = "#C2C2C2";
const FOOD_COLOR = "#E66916";

const socket = io();

socket.on("init", handleInit);
socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("gameCode", handleGameCode);
socket.on("unknownCode", handleUnknownCode);
socket.on("tooManyPlayers", handleTooManyPlayers);

let playerNumber;
let canvas, ctx;
let gameActive = false;

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const gameCodeInput = document.getElementById("gameCodeInput");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

function newGame() {
  socket.emit("newGame");
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit("joinGame", code.trim());
  init();
}

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";
  scoreDisplay.innerText = "0";

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener("keydown", keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit("keydown", e.keyCode);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { food, gridSize } = state;
  const size = canvas.width / gridSize;

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  scoreDisplay.innerText = state.players[playerNumber - 1].score.toString();

  paintPlayer(state.players[0], size, SNAKE_COLOR);
  paintPlayer(state.players[1], size, "red");
}

function paintPlayer(player, size, color) {
  const { snake } = player;

  ctx.fillStyle = color;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
}

function handleGameState(gameState) {
  if (!gameActive) return;
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) return;
  data = JSON.parse(data);
  gameActive = false;
  if (data.winner === playerNumber) {
    alert("You Win!");
  } else {
    alert("You Lose!");
  }
}

function handleGameCode(code) {
  gameCodeDisplay.innerText = code;
}

function handleUnknownCode() {
  reset();
  alert("UNknown game code!");
}

function handleTooManyPlayers() {
  reset();
  alert("Game in Progess");
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = "";
  scoreDisplay.innerText = "0";
  gameCodeDisplay.innerText = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "block";
}
