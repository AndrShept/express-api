const { prisma } = require('../../prisma/prisma');

const ItemController = {
  getAllItems: async (req, res, next) => {
    try {
      const gameItems = await prisma.gameItem.findMany({
        // where: { tag: 'ALL' },
        include: { modifier: true },
      });

      res.status(200).json(gameItems);
    } catch (error) {
      next(error);
    }
  },
  getNoviceItems: async (req, res, next) => {
    try {
      const noviceItems = await prisma.gameItem.findMany({
        where: { tag: 'NOVICE' },
        include: { modifier: true },
      });

      res.status(200).json(noviceItems);
    } catch (error) {
      next(error);
    }
  },
  createItem: async (req, res, next) => {
    const body = req.body;
    const { modifier, ...data } = body;

    try {
      const newItem = await prisma.gameItem.create({
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
  deleteItem: async (req, res, next) => {
    const body = req.body;
    const { id } = body;

    if (!id) {
      return res.status(404).json('id not found');
    }

    try {
      await prisma.inventoryItem.delete({
        where: { id },
      });
      res.status(201).json({ success: true, message: 'Item success deleted' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ItemController;
