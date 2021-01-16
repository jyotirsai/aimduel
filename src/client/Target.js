const constants = require("../shared/constants");

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

export default class Target {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  render() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, constants.TARGET_RADIUS, 0, Math.PI * 2, false);
    ctx.fillStyle = constants.TARGET_COLOR;
    ctx.fill();
  }
}
