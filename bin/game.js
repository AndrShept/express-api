const heroRegeneration = require('./heroRegeneration');
const startDungeon = require('./startDungeon');

const game = async (username, socket, hero) => {
  heroRegeneration(username, socket, hero);
  startDungeon(socket, hero)
};

module.exports = game;
