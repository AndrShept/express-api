const { prisma } = require('../../prisma/prisma');

const ItemController = {
  getAllItems: async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.userId;

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
    const { id } = req.params;
    const userId = req.user.userId;

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
    const userId = req.user.userId;
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
};

module.exports = ItemController;
