import Target from "./Target.js";
import "./css/main.css"; // need this for webpack
import io from "socket.io-client";

const socket = io(`https://stormy-spire-67616.herokuapp.com/`);

const gameMenu = document.getElementById("game-menu");
const playButton = document.getElementById("start-button");
const gameOverDiv = document.getElementById("game-over");
const mGameOverDiv = document.getElementById("mgame-over");
const replayButton = document.getElementById("replay-button");
const soloBackButton = document.getElementById("solo-back-button");
const rTimeText = document.getElementById("rtime-text");
const endText = document.getElementById("endgame-text");
const createButton = document.getElementById("create-button");
const joinButton = document.getElementById("join-button");
const lobby = document.getElementById("lobby");
const roomCode = document.getElementById("room-code");
const startRoom = document.getElementById("start-room");
const codeInput = document.getElementById("code-input");
const readyMessage = document.getElementById("ready-message");
const mReplayButton = document.getElementById("mreplay-button");
const mBackButton = document.getElementById("mback-button");
const lobbyBack = document.getElementById("lobby-back-button");

// globals
let canvas, ctx;
let state = {};
let startTime;
let reactionTime;
let avgReactionTime;
let playerNumber;
let playerOneTime;
let playerTwoTime;

socket.on("gameState", handleGameState);
socket.on("gameOver", handleGameOver);
socket.on("roomName", handleRoomName);
socket.on("initM", handleInitM);
socket.on("ready", handleReady);
socket.on("mGameState", handleMGameState);
socket.on("initMulti", handleInitMulti);
socket.on("mGameOver", handleMGameOver);

playButton.onclick = () => {
  playSolo();
};

createButton.onclick = () => {
  createRoom();
  readyMessage.innerText = "Waiting for Player 2...";
};

joinButton.onclick = () => {
  joinRoom();
};

startRoom.onclick = () => {
  socket.emit("roomCode", roomCode.innerText);
  playMulti();
};

replayButton.onclick = () => {
  gameOverDiv.classList.add("hidden");
  playSolo();
};

soloBackButton.onclick = () => {
  gameOverDiv.classList.add("hidden");
  gameMenu.style.display = "block";
};

mReplayButton.onclick = () => {
  mGameOverDiv.classList.add("hidden");
  socket.emit("roomCode", roomCode.innerText);
  playMulti();
};

mBackButton.onclick = () => {
  mGameOverDiv.classList.add("hidden");
  gameMenu.style.display = "block";
};

lobbyBack.onclick = () => {
  lobby.classList.add("hidden");
  gameMenu.style.display = "block";
};

function playSolo() {
  socket.emit("playSolo");
  init();
}

function playMulti() {
  socket.emit("playMulti");
}

function handleInitMulti() {
  initMulti();
}

function createRoom() {
  socket.emit("createRoom");
  initRoom();
}

function joinRoom() {
  const code = codeInput.value;
  socket.emit("joinRoom", code);
  initRoom();
  handleRoomName(code);
}

function handleReady() {
  readyMessage.innerText = "Player 2 has joined!";
  startRoom.disabled = false;
}

function init() {
  gameMenu.style.display = "none";
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  renderBackground();
  addEventListener("click", handleOnClick);
}

function initMulti() {
  lobby.classList.add("hidden");
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  renderBackground();
  addEventListener("click", handleOnMClick);
}

function handleInitM(number) {
  playerNumber = number;
  console.log(playerNumber);
}

function initRoom() {
  gameMenu.style.display = "none";
  lobby.classList.remove("hidden");
}

function handleRoomName(roomName) {
  roomCode.innerText = roomName;
}

function handleOnClick(event) {
  if (Object.keys(state).length != 0) {
    const diffX = event.clientX - state.target.x * canvas.width;
    const diffY = event.clientY - state.target.y * canvas.height;
    const deltaSquared = Math.pow(diffX, 2) + Math.pow(diffY, 2);
    if (deltaSquared <= Math.pow(20, 2)) {
      reactionTime = Date.now() - startTime;
      socket.emit("clickedTarget", reactionTime);
      renderBackground();
    }
  }
}

function handleOnMClick(event) {
  if (Object.keys(state).length != 0) {
    const diffX = event.clientX - state.target.x * canvas.width;
    const diffY = event.clientY - state.target.y * canvas.height;
    const deltaSquared = Math.pow(diffX, 2) + Math.pow(diffY, 2);
    if (deltaSquared <= Math.pow(20, 2)) {
      reactionTime = Date.now() - startTime;
      socket.emit("clickedMTarget", {
        reactionTime: reactionTime,
        playerNumber: playerNumber,
      });
      renderBackground();
    }
  }
}

function renderBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function handleGameState(gameState) {
  state = JSON.parse(gameState);
  if (state.playerOneTimes.length < 10) {
    renderTarget(state.target.x, state.target.y);
  }
}

function handleMGameState(gameState) {
  state = JSON.parse(gameState);
  if (state.playerOneTimes.length < 10 || state.playerTwoTimes.length < 10) {
    renderTarget(state.target.x, state.target.y);
  }
}

function calculateReactionTime(times) {
  return times.reduce((a, b) => a + b, 0) / times.length;
}

function renderTarget(x, y) {
  let renderInterval = Math.random() * 1000;
  setTimeout(() => {
    const target = new Target(x * canvas.width, y * canvas.height);
    target.render();
    startTime = Date.now();
  }, renderInterval);
}

function handleGameOver(state) {
  removeEventListener("click", handleOnClick);
  renderBackground();
  state = JSON.parse(state);
  avgReactionTime = calculateReactionTime(state.playerOneTimes);
  gameOverDiv.classList.remove("hidden");
  rTimeText.innerText = avgReactionTime + " ms";
}

function handleMGameOver(state) {
  removeEventListener("click", handleOnMClick);
  renderBackground();
  state = JSON.parse(state);
  playerOneTime = calculateReactionTime(state.playerOneTimes);
  playerTwoTime = calculateReactionTime(state.playerTwoTimes);
  mGameOverDiv.classList.remove("hidden");
  if (playerOneTime > playerTwoTime) {
    endText.innerText = "player two wins!";
  } else if (playerOneTime < playerTwoTime) {
    endText.innerText = "player one wins!";
  }
}
