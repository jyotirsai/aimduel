const constants = require("../shared/constants");

module.exports = {
  initGame,
  randomTarget,
  initMGame,
};

function initGame() {
  const state = createGameState();
  randomTarget(state);

  return state;
}

function initMGame() {
  const state = createMGameState();
  randomTarget(state);

  return state;
}

function createGameState() {
  return {
    target: {
      x: null,
      y: null,
    },
    playerOneTimes: [],
  };
}

function createMGameState() {
  return {
    target: {
      x: null,
      y: null,
    },
    playerOneTimes: [],
    playerTwoTimes: [],
  };
}

function randomTarget(state) {
  target = {
    x: Math.random(),
    y: Math.random(),
  };
  state.target = target;
}
