const heroRegeneration = require('./heroRegeneration');

const game = async (username, socket, hero) => {

    heroRegeneration(username, socket, hero);

};

module.exports = game;
