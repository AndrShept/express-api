const { prisma } = require('../prisma/prisma');

const getHero = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const hero = await prisma.hero.findFirst({
      where: { userId },
    });
    if (!hero) {
      return res.status(404).json('Hero not found');
    }

    req.hero = hero;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = getHero;
