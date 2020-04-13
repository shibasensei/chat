const matColours = require("./colors.json");
const moment = require("moment");
const newColour = () => {
  let coloridx = Math.floor(Math.random() * matColours.colours.length) + 1;
  return matColours.colours[coloridx];
};
const getTime = () => {
  return moment().format("h:mm:ss a");
};
module.exports = {
  newColour,
  getTime,
};
