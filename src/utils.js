module.exports = {
  makeId,
};

function makeId() {
  return Math.random().toString(36).substring(7);
}
