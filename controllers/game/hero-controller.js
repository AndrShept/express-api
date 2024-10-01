const { getLevelStatsPoints } = require('../../bin/level');
const {
  sumModifiers,
  getHeroId,
  equipItem,
  unEquipExistingItem,
  getHero,
} = require('../../bin/utils');
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
    const { inventoryItemId } = req.body;

    if (!inventoryItemId) {
      return res.status(400).json({
        success: false,
        message: 'inventoryItemId not found',
      });
    }

    try {
      const heroId = await getHeroId(userId);
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        include: { gameItem: true },
      });

      const { weaponType, type } = inventoryItem.gameItem;

      if (weaponType === 'TWO_HAND') {
        const rightHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'RIGHT_HAND' },
        });
        const leftHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'LEFT_HAND' },
        });

        if (rightHandOccupied || leftHandOccupied) {
          return res.status(409).json({
            success: false,
            message: 'Please unequip both hands first',
          });
        }
        await equipItem(heroId, inventoryItemId, 'RIGHT_HAND');
      } else if (weaponType === 'ONE_HAND') {
        const rightHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'RIGHT_HAND' },
        });
        const leftHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'LEFT_HAND' },
        });

        if (rightHandOccupied && leftHandOccupied) {
          return res.status(409).json({
            success: false,
            message: 'Please unequip both hands first',
          });
        }
        const slot = rightHandOccupied ? 'LEFT_HAND' : 'RIGHT_HAND';
        await equipItem(heroId, inventoryItemId, slot);
      } else if (type === 'SHIELD') {
        const leftHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'LEFT_HAND' },
        });
        const rightHandOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'RIGHT_HAND' },
          include: { inventoryItem: { include: { gameItem: true } } },
        });
        if (
          rightHandOccupied?.inventoryItem.gameItem.weaponType === 'TWO_HAND'
        ) {
          return res.status(409).json({
            success: false,
            message: 'Please unequip two-hand weapon first',
          });
        }
        if (leftHandOccupied) {
          return res.status(409).json({
            success: false,
            message: 'Please unequip left hand first',
          });
        }
        await equipItem(heroId, inventoryItemId, 'LEFT_HAND');
      } else if (type === 'RING') {
        const rightRingOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'RING_RIGHT' },
        });
        const leftRingOccupied = await prisma.equipment.findFirst({
          where: { heroId, slot: 'RING_LEFT' },
        });
        if (rightRingOccupied && leftRingOccupied) {
          return res
            .status(409)
            .json({ success: false, message: 'Both ring slots are occupied' });
        }
        const slot = rightRingOccupied ? 'RING_LEFT' : 'RING_RIGHT';
        await equipItem(heroId, inventoryItemId, slot);
      } else {
        const existingSlot = await prisma.equipment.findFirst({
          where: { heroId, slot: type },
        });
        if (existingSlot) {
          await unEquipExistingItem(heroId, type);
        }
        await equipItem(heroId, inventoryItemId, type);
      }

      res.status(200).json({
        success: true,
        message: 'Item has been equipped',
        data: inventoryItem,
      });
    } catch (error) {
      next(error);
    }
  },
  unEquipHeroItem: async (req, res, next) => {
    const userId = req.user.userId;
    const { inventoryItemId } = req.body;

    try {
      const hero = await prisma.hero.findFirst({
        where: { userId },
      });
      const inventoryLength = await prisma.inventoryItem.count({
        where: { isEquipped: false },
      });
      if (inventoryLength === hero.inventorySlots) {
        return res.status(409).json({
          success: false,
          message: 'Item cannot be unequipped because inventory is full',
        });
      }
      const [_, unEquippedItem] = await prisma.$transaction([
        prisma.equipment.deleteMany({
          where: {
            inventoryItemId,
            heroId: hero.id,
          },
        }),
        prisma.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { isEquipped: false },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Item has been unEquipped',
        data: unEquippedItem[1],
      });
    } catch (error) {
      next(error);
    }
  },

  addHeroItemInventory: async (req, res, next) => {
    const body = req.body;
    const userId = req.user.userId;

    const { gameItemId } = body;
    const heroId = await getHeroId(userId);

    if (!gameItemId) {
      return res
        .status(400)
        .json({ success: false, message: 'gameItemId not found' });
    }
    if (!heroId) {
      return res
        .status(400)
        .json({ success: false, message: 'heroId not found' });
    }

    try {
      const newItemInventory = await prisma.inventoryItem.create({
        data: {
          gameItemId,
          heroId,
        },
      });

      res.status(201).json(newItemInventory);
    } catch (error) {
      next(error);
    }
  },

  updateHero: async (req, res, next) => {
    const userId = req.user.userId;
    const body = req.body;

    try {
      const heroId = await getHeroId(userId);
      const updatedHero = await prisma.hero.update({
        where: { id: heroId },
        data: { ...body },
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
      const updatedHero = await prisma.hero.update({
        where: { id: hero.id },
        data: { ...getLevelStatsPoints(hero.level) },
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
