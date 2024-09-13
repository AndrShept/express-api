const { prisma } = require('../../prisma/prisma');

const HeroController = {
  getMyHero: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const hero = await prisma.hero.findFirst({
        where: {
          userId,
        },
      });

      res.status(200).json(hero);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = HeroController;
