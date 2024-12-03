const heroRegeneration = require('./heroRegeneration');
const initDungeon = require('./initDungeon');
const moveHero = require('./moveHero');

const game = async (username, socket, hero) => {
  heroRegeneration(username, socket, hero);
  initDungeon(socket, hero);
  moveHero(socket, hero)
};

module.exports = game;
