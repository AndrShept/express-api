const { getLevelStatsPoints } = require('../../bin/level');
const {
  sumModifiers,
  getHeroId,
  getHero,
  sumModifierEquipStatsBuffs,
} = require('../../bin/utils');
const { prisma } = require('../../prisma/prisma');

const HeroController = {
  getMyHero: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const sumModifier = await sumModifierEquipStatsBuffs(userId);
    try {
      const heroId = await getHeroId(userId);
      const hero = await prisma.hero.update({
        where: { id: heroId },
        data: { modifier: { update: { ...sumModifier, id: undefined } } },
        include: {
          buffs: { include: { modifier: true } },
          modifier: true,
          baseStats: true,
          equipments: {
            include: {
              inventoryItem: {
                include: { gameItem: { include: { modifier: true } } },
              },
            },
          },
          inventorys: {
            where: {
              isEquipped: false,
            },
            include: { gameItem: { include: { modifier: true } } },
            orderBy: { updatedAt: 'asc' },
          },
        },
      });

      res.status(200).json({ ...hero });
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
        where: { name },
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
    const userId = req.user.userId;
    const { inventoryItemId, slot } = req.body;
    if (!inventoryItemId) {
      return res.status(400).json({
        success: false,
        message: 'inventoryItemId not found',
      });
    }
    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'slot not found',
      });
    }

    try {
      const hero = await getHero(userId);
      const heroId = hero.id;

      const newEquipment = await prisma.equipment.create({
        data: {
          slot,
          heroId,
          inventoryItemId,
        },
      });

      const sumModifier = await sumModifierEquipStatsBuffs(userId);

      await prisma.hero.update({
        where: { id: heroId },
        data: {
          health: Math.min(sumModifier.maxHealth, hero.health),
          mana: Math.min(sumModifier.maxMana, hero.mana),
          modifier: { update: { ...sumModifier, id: undefined } },
          inventorys: {
            update: {
              where: { id: inventoryItemId },
              data: { isEquipped: true },
            },
          },
        },
      });
      res.status(200).json({
        success: true,
        message: 'Item has been equipped',
        data: newEquipment,
      });
    } catch (error) {
      next(error);
    }
  },
  unEquipHeroItem: async (req, res, next) => {
    const userId = req.user.userId;
    const { inventoryItemId } = req.body;

    if (!inventoryItemId) {
      return res.status(404).json({
        success: false,
        message: 'inventoryItemId not found',
      });
    }

    try {
      const hero = await getHero(userId);
      const heroId = hero.id;
      const deletedEquip = await prisma.equipment.deleteMany({
        where: {
          heroId,
          inventoryItemId,
        },
      });

      const sumModifier = await sumModifierEquipStatsBuffs(userId);

      await prisma.hero.update({
        where: { id: heroId },
        data: {
          health: Math.min(sumModifier.maxHealth, hero.health),
          mana: Math.min(sumModifier.maxMana, hero.mana),

          modifier: {
            update: {
              ...sumModifier,
              id: undefined,
            },
          },
          inventorys: {
            update: {
              where: { id: inventoryItemId },
              data: { isEquipped: false },
            },
          },
        },
      });
      res.status(200).json({
        success: true,
        message: 'Item has been unEquipped',
        data: deletedEquip,
      });
    } catch (error) {
      next(error);
    }
  },

  addHeroItemInventory: async (req, res, next) => {
    const body = req.body;
    const userId = req.user.userId;

    const { gameItemId } = body;
    if (!gameItemId) {
      return res
        .status(400)
        .json({ success: false, message: 'gameItemId not found' });
    }

    try {
      const hero = await getHero(userId);

      if (!hero.id) {
        return res
          .status(400)
          .json({ success: false, message: 'heroId not found' });
      }
      const freeInvSlots = await prisma.inventoryItem.count({
        where: { isEquipped: false, heroId: hero.id },
      });

      if (hero.inventorySlots < freeInvSlots) {
        return res.status(409).json({
          success: false,
          message: 'Item cannot be acquired because inventory is full',
        });
      }
      const gameItem = await prisma.gameItem.findUnique({
        where: { id: gameItemId },
      });

      if (gameItem.price > hero.gold) {
        return res.status(400).json({
          success: false,
          message: 'Not enough gold',
        });
      }

      const isPotionMiscType =
        gameItem.type === 'POTION' || gameItem.type === 'MISC';
      existInventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          gameItemId,
          heroId: hero.id,
        },
        include: { gameItem: true },
      });
      if (isPotionMiscType && existInventoryItem) {
        await prisma.$transaction([
          prisma.inventoryItem.updateMany({
            where: {
              heroId: hero.id,
              gameItemId,
            },
            data: { quantity: { increment: 1 } },
          }),
          prisma.hero.update({
            where: { id: hero.id },
            data: { gold: { decrement: gameItem.price ? gameItem.price : 0 } },
          }),
        ]);
        return res.status(201).json({
          success: true,
          message: 'Congratulations! You have acquired',
          data: existInventoryItem,
        });
      }

      const [newItemInventory, _] = await prisma.$transaction([
        prisma.inventoryItem.create({
          data: {
            gameItemId,
            heroId: hero.id,
            isCanEquipped: !isPotionMiscType,
          },
          include: { gameItem: true },
        }),
        prisma.hero.update({
          where: { id: hero.id },
          data: { gold: { decrement: gameItem.price ? gameItem.price : 0 } },
        }),
      ]);
      res.status(201).json({
        success: true,
        message: 'Congratulations! You have acquired',
        data: newItemInventory,
      });
    } catch (error) {
      next(error);
    }
  },

  updateHero: async (req, res, next) => {
    const userId = req.user.userId;
    const body = req.body;

    const { modifier, baseStats, ...allBody } = body;

    try {
      const heroId = await getHeroId(userId);
      const updatedHero = await prisma.hero.update({
        where: { id: heroId },
        data: {
          ...allBody,
          modifier: { update: { ...modifier } },
          baseStats: { update: { ...baseStats } },
        },
      });
      res.status(200).json(updatedHero);
    } catch (error) {
      next(error);
    }
  },
  resetStats: async (req, res, next) => {
    const userId = req.user.userId;

    try {
      const hero = await getHero(userId);
      if (hero.gold < 100) {
        return res.status(400).json({
          success: false,
          message: 'Not enough gold to reset hero stats ',
        });
      }

      const updatedHero = await prisma.hero.update({
        where: { id: hero.id },
        data: { ...getLevelStatsPoints(hero.level), gold: { decrement: 100 } },
      });
      res.status(200).json({
        success: true,
        message: 'Hero stats have been successfully reset. ',
        data: updatedHero,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = HeroController;
