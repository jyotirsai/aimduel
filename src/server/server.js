const express = require("express");
const webpack = require("webpack");
const webpackConfig = require("../../webpack.dev.js");
const webpackDevMiddleware = require("webpack-dev-middleware");
const dotenv = require("dotenv");
const socketio = require("socket.io");
const { initGame, randomTarget, initMGame } = require("./Game.js");
const { makeid } = require("./utils");
dotenv.config();

const app = express();
const PORT = process.env.PORT;
app.use(express.static("public"));

if (process.env.NODE_ENV === "development") {
  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler));
} else {
  app.use(express.static("dist"));
}

const server = app.listen(process.env.PORT || 3000);

const io = socketio(server);

// globals
let state = {};
let clientRooms = {};
let rCode;

io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  socket.on("playSolo", handlePlaySolo);
  socket.on("createRoom", handleCreateRoom);
  socket.on("clickedTarget", handleClickedTarget);
  socket.on("joinRoom", handleJoinRoom);
  socket.on("playMulti", handlePlayMulti);
  socket.on("roomCode", handleRoomCode);
  socket.on("clickedMTarget", handleClickedMTarget);

  function handlePlaySolo() {
    state = initGame();
    emitGameState(state);
  }

  function handlePlayMulti() {
    state = initMGame();

    emitMGameState(state);
  }

  function handleCreateRoom() {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("roomName", roomName);

    state[roomName] = initMGame(); // might want to wait until user 2 joins
    socket.join(roomName);
    socket.number = 1;
    socket.emit("initM", 1);
  }

  function handleJoinRoom(code) {
    const room = io.sockets.adapter.rooms.get(code);

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients;

    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      socket.emit("unknownGame");
      console.log("unknown game");
      return;
    } else if (numClients > 1) {
      socket.emit("tooManyPlayers");
      console.log("too many players");
      return;
    }

    clientRooms[socket.id] = code;

    socket.join(code);
    socket.number = 2;
    socket.emit("initM", 2);
    io.in(code).emit("ready");
  }

  function emitGameState(state) {
    socket.emit("gameState", JSON.stringify(state));
  }

  function handleRoomCode(roomCode) {
    rCode = roomCode;
    io.in(rCode).emit("initMulti");
  }

  function emitMGameState(state) {
    io.in(rCode).emit("mGameState", JSON.stringify(state));
  }

  function handleClickedTarget(reactionTime) {
    state.playerOneTimes.push(reactionTime);
    if (state.playerOneTimes.length >= 10) {
      socket.emit("gameOver", JSON.stringify(state));
    } else {
      randomTarget(state);
    }
    emitGameState(state);
  }

  function handleClickedMTarget(data) {
    if (
      state.playerOneTimes.length === 10 ||
      state.playerTwoTimes.length === 10
    ) {
      io.in(clientRooms[socket.id]).emit("mGameOver", JSON.stringify(state));
    } else {
      if (data.playerNumber === 1) {
        state.playerOneTimes.push(data.reactionTime);
        randomTarget(state);
        io.to(socket.id).emit("mGameState", JSON.stringify(state));
      } else if (data.playerNumber === 2) {
        state.playerTwoTimes.push(data.reactionTime);
        randomTarget(state);
        io.to(socket.id).emit("mGameState", JSON.stringify(state));
      }
    }
  }
});
