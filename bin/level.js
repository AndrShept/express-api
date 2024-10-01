const getLevelStatsPoints = (level) => {
  return {
    statsPoints: level * 10,
    freeStatsPoints: level * 10,
    modifier: {
      update: {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        luck: 5,
      },
    },
  };
};

module.exports = {
  getLevelStatsPoints,
};
