const { getLevelStatsPoints } = require('../../bin/level');
const {
  sumModifiers,
  getHeroId,
  getHero,
  sumModifierEquipStatsBuffs,
  addModifiers,
  addBuffsTimeRemaining,
  subtractModifiers,
  calculateTimeRemaining,
} = require('../../bin/utils');
const { prisma } = require('../../prisma/prisma');

const HeroController = {
  getMyHero: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const heroId = await getHeroId(userId);

    if (!heroId) {
      return res.status(404).json('Hero not found');
    }
    const sumModifier = await sumModifierEquipStatsBuffs(userId);

    try {
      const dungeonSessions = await prisma.dungeonSession.findMany({
        where: { status: 'INPROGRESS', heroId: { has: heroId } },
        include: { dungeon: true },
      });
      const hero = await prisma.hero.update({
        where: { id: heroId },
        data: { modifier: { update: { ...sumModifier, id: undefined } } },
        include: {
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
            include: { gameItem: { include: { modifier: true } } },
            orderBy: { updatedAt: 'asc' },
          },
        },
      });
      const updatedDungeonSessions = dungeonSessions.map((dungeon) => ({
        ...dungeon,
        timeRemaining: calculateTimeRemaining(dungeon),
      }));
      if (updatedDungeonSessions[0]?.timeRemaining === 0) {
        await prisma.dungeonSession.update({
          where: { id: updatedDungeonSessions[0].id },
          data: {
            status: 'FAILED',
            endTime: new Date().toISOString(),
          },
        });
      }
      res.status(200).json({
        ...hero,
        buffs: await addBuffsTimeRemaining(heroId),
        dungeonSessions: updatedDungeonSessions,
      });
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

  drinkPotion: async (req, res, next) => {
    const { inventoryItemId } = req.body;
    const userId = req.user.userId;

    if (!inventoryItemId) {
      return res.status(400).json('inventoryItemId not found');
    }
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: { gameItem: { include: { modifier: true } } },
    });
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    const hero = await prisma.hero.findFirst({
      where: {
        userId,
      },
      include: { modifier: true },
    });
    if (!hero) {
      return res.status(404).json({ message: 'Hero  not found' });
    }

    const { maxHealth, maxMana, duration } = inventoryItem.gameItem.modifier;
    const isHealthFull = hero.health === hero.modifier.maxHealth;
    const isManaFull = hero.mana === hero.modifier.maxMana;

    if (
      (isHealthFull && !maxMana && !duration) ||
      (isManaFull && !maxHealth && !duration)
    ) {
      return res.status(409).json({
        success: false,
        message: `Your ${
          maxMana ? 'mana' : 'health'
        } is already full. Nothing to restore.`,
      });
    }
    const updateQuantity =
      inventoryItem.quantity > 1
        ? {
            update: {
              where: { id: inventoryItemId },
              data: { quantity: { decrement: 1 } },
            },
          }
        : { delete: { id: inventoryItemId } };
    const sumModifier = addModifiers(
      hero.modifier,
      inventoryItem.gameItem.modifier
    );
    try {
      const findExistBuff = await prisma.buff.findFirst({
        where: { gameItemId: inventoryItem.gameItemId },
      });
      if (findExistBuff) {
        await prisma.buff.delete({
          where: { id: findExistBuff.id },
        });
      }

      await prisma.hero.update({
        where: { id: hero.id },

        data: {
          health: {
            set: Math.min(hero.health + maxHealth, hero.modifier.maxHealth),
          },
          mana: {
            set: Math.min(hero.mana + maxMana, hero.modifier.maxMana),
          },
          modifier: inventoryItem.gameItem.modifier.duration
            ? {
                update: { ...sumModifier, id: undefined },
              }
            : undefined,
          buffs: inventoryItem.gameItem.modifier.duration
            ? {
                create: {
                  duration: inventoryItem.gameItem.modifier.duration,
                  imageUrl: inventoryItem.gameItem.imageUrl,
                  name: inventoryItem.gameItem.name,
                  gameItemId: inventoryItem.gameItemId,
                  modifierId: inventoryItem.gameItem.modifierId,
                },
              }
            : undefined,
          inventorys: updateQuantity,
        },
      });

      res.status(200).json({
        success: true,
        message: 'You successfully drank ',
        data: inventoryItem,
      });
    } catch (error) {
      next(error);
    }
  },

  removeBuff: async (req, res, next) => {
    const { buffId } = req.body;
    const userId = req.user.userId;

    if (!buffId) {
      return res.status(404).json('buffId not found');
    }
    const buff = await prisma.buff.findFirst({
      where: { gameItemId: buffId },
      include: { modifier: true },
    });
    if (!buff) {
      return res.status(404).json('buff not found');
    }
    const hero = await prisma.hero.findFirst({
      where: { userId },
      include: { modifier: true },
    });
    if (!hero) {
      return res.status(404).json('hero not found');
    }
    const sumModifier = subtractModifiers(hero.modifier, buff.modifier);

    try {
      await prisma.hero.update({
        where: { id: hero.id },
        data: {
          buffs: { delete: { id: buff.id } },

          modifier: { update: { ...sumModifier, id: undefined } },
        },
      });

      await prisma.hero.update({
        where: { id: hero.id },
        data: {
          health: Math.min(hero.health, hero.modifier.maxHealth),
          mana: Math.min(hero.mana, hero.modifier.maxMana),
        },
      });

      res.status(200).json({
        message: 'Buff success deleted',
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
