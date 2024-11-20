const { getHeroId, getHero } = require('../../bin/utils');
const { prisma } = require('../../prisma/prisma');

const DungeonController = {
  getDungeons: async (req, res, next) => {
    try {
      const dungeons = await prisma.dungeon.findMany();

      res.status(200).json(dungeons);
    } catch (error) {
      next(error);
    }
  },
  getDungeonsSessionById: async (req, res, next) => {
    const { dungeonSessionId } = req.params;
    const heroId = req.hero.id;
    try {
      const dungeonSession = await prisma.dungeonSession.findUnique({
        where: { id: dungeonSessionId },
        include: { heroes: true, monsters: true ,dungeon: true},
      });



      res.status(200).json(dungeonSession);
    } catch (error) {
      next(error);
    }
  },

  createDungSession: async (req, res, next) => {
    const heroId = req.hero.id;
    const { dungeonId } = req.body;

    if (!dungeonId) {
      return res.status(404).json('dungeonId not found');
    }
    const dungeon = await prisma.dungeon.findUnique({
      where: { id: dungeonId },
    });
    if (!dungeon) {
      return res.status(404).json('dungeon not found');
    }

    const dungSessionInProgress = await prisma.dungeonSession.findMany({
      where: {
        heroId: { has: heroId },
        status: 'INPROGRESS',
      },
    });
    if (dungSessionInProgress.length >= 1) {
      return res
        .status(409)
        .json(
          'A dungeon session is already in progress. You must finish or exit the current session before starting a new one'
        );
    }

    try {
      const dungeonSession = await prisma.dungeonSession.create({
        data: {
          difficulty: 'EASY',
          duration: dungeon.duration,
          status: 'INPROGRESS',
          dungeonId,
          heroId: { set: [heroId] },
        },
      });
      await prisma.hero.update({
        where: { id: heroId },
        data: {
          dungeonSessionId: { push: dungeonSession.id },
        },
      });

      res.status(201).json(dungeonSession);
    } catch (error) {
      next(error);
    }
  },
  updateDungeonSessionStatus: async (req, res, next) => {
    const heroId = req.hero.id;
    const { status, dungeonSessionId } = req.body;

    if (!heroId) {
      return res.status(404).json('HeroId not found');
    }
    try {
      const dungeons = await prisma.dungeonSession.update({
        where: { id: dungeonSessionId },
        data: { status, endTime: new Date().toISOString() },
      });

      res.status(200).json(dungeons);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = DungeonController;
