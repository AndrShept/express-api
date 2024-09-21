const { prisma } = require('../prisma/prisma');

 const getHero = async (username) => {
  const hero = await prisma.hero.findFirst({
    where: {
      user: { username },
    },
    include: {
      buffs: true,
      modifier: true,
      equipments: true,
      inventorys: { include: { gameItem: { include: { modifier: true } } } },
    },
  });
  
  return hero;
};

module.exports = getHero;
