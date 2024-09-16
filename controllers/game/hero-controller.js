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
        include: {
          buffs: true,
          equipment: true,
          inventorys: true,
          modifier: true,
        },
      });
      res.status(200).json(hero);
    } catch (error) {
      next(error);
    }
  },

  createHero: async (req, res, next) => {
    const userId = req.user.userId;
    const body = req.body;

    const {
      name,
      statPoint: statPoints,
      breastplate,
      avatarUrl,
      weapon,
      modifier,
    } = body;

    try {
      const heroNameExist = await prisma.hero.findUnique({
        where: { name: body.name },
      });
      if (heroNameExist) {
        return res.status(409).json({
          success: false,
          message:
            'There already a character with this nickname, please try another one.',
        });
      }

      const hero = await prisma.hero.create({
        data: {
          statPoints,
          name,
          avatarUrl,
          user: {
            connect: {
              id: userId,
            },
          },
          modifier: {
            create: {
              ...modifier,
            },
          },
          inventorys: {
            connect: [
              {
                id: weapon.id,
              },
              {
                id: breastplate.id,
              },
            ],
          },
        },
      });

      res.status(201).json(hero);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = HeroController;
