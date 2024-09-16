const { prisma } = require('../../prisma/prisma');

const ItemController = {
  getAllItems: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { tag: 'ALL' },
        include: { modifier: true },
      });

      res.status(200).json(inventoryItems);
    } catch (error) {
      next(error);
    }
  },
  getNoviceItems: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const noviceItems = await prisma.inventoryItem.findMany({
        where: { tag: 'NOVICE' },
        include: { modifier: true },
      });

      res.status(200).json(noviceItems);
    } catch (error) {
      next(error);
    }
  },
  createItem: async (req, res, next) => {
    const userId = req.user.userId;
    const body = req.body;
    const { modifier, ...data } = body;

    try {
      const newItem = await prisma.inventoryItem.create({
        data: {
          ...data,
          modifier: { create: { ...modifier } },
        },
        include: { modifier: true },
      });

      res.status(201).json(newItem);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ItemController;
