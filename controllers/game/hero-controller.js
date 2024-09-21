const { sumModifiers } = require('../../bin/utils');
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
          modifier: true,
          equipments: {
            include: {
              inventoryItem: {
                include: { gameItem: { include: { modifier: true } } },
              },
              gameItem: { include: { modifier: true } },
            },
          },
          inventorys: {
            include: { gameItem: { include: { modifier: true } } },
          },
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
      avatarUrl,
      breastplate,
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
              ...sumModifiers(modifier),
              health: 50,
              mana: 50,
            },
          },
        },
      });
      await prisma.inventoryItem.createMany({
        data: [
          {
            heroId: hero.id,
            gameItemId: weapon.id,
          },
          {
            heroId: hero.id,
            gameItemId: breastplate.id,
          },
        ],
      });

      res.status(201).json(hero);
    } catch (error) {
      next(error);
    }
  },

  equipHeroItem: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { heroId, inventoryItemId, slot } = req.body;
    try {
      const newEquip = await prisma.equipment.create({
        data: { heroId, inventoryItemId, slot },
        include: { inventoryItem: true },
      });
      await prisma.inventoryItem.delete({
        where: {
          heroId,
          id: inventoryItemId,
        },
      });
      res.status(200).json(newEquip);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = HeroController;
