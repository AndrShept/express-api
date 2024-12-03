const { prisma } = require('../prisma/prisma');
const { getMapJson, building2DMap } = require('./utils');


const initDungeon = async (socket, hero) => {
  socket.on('dungeon-init', async (dungeonSessionId) => {
    const dungeonSession = await prisma.dungeonSession.findFirst({
      where: { heroId: hero.id, status: 'INPROGRESS' },
      include: { tiles: true },
    });
    const jsonMap = getMapJson(dungeonSession?.dungeonId);
    if (!jsonMap) return;
    const mapObjects = jsonMap.layers[0].objects.map((tile) => ({
      ...tile,
      x: tile.x / jsonMap.tilewidth,
      y: tile.y / jsonMap.tilewidth - 1,
    }));
    const tilewidth = jsonMap.tilewidth;

    if (!dungeonSession?.tiles.length) {
      mapObjects.push({
        id: Math.random(),
        gid: 35,
        height: tilewidth,
        width: tilewidth,
        name: 'hero',
        x: 1,
        y: 1,
        hero,
      });

      await prisma.tile.createMany({
        data: mapObjects.map((item) => ({
          gid: item.gid,
          height: item.height,
          width: item.width,
          name: item.name,
          x: item.x,
          y: item.y,
          heroId: item.hero?.id,
          dungeonSessionId,
        })),
      });
      const dungeonMap = building2DMap(mapObjects, jsonMap);

      socket.emit(dungeonSessionId, {
        dungeonMap,
        height: jsonMap.height,
        width: jsonMap.width,
        tileSize: jsonMap.tilewidth,
      });
    }

    if (dungeonSession?.tiles?.some((item) => item.hero?.id !== hero.id)) {
      await prisma.tile.create({
        data: {
          gid: 35,
          height: tilewidth,
          width: tilewidth,
          name: 'hero',
          x: 1,
          y: 2,
          heroId: hero.id,
        },
      });
    }

    const tiles = await prisma.tile.findMany({
      where: { dungeonSessionId },
      include: { hero: true, monster: true },
    });
    const dungeonMap = building2DMap(tiles, jsonMap);
   const findHero = tiles.find(tile => tile.heroId === hero.id)
    socket.emit(dungeonSessionId, {
      dungeonMap,
      height: jsonMap.height,
      width: jsonMap.width,
      tileSize: jsonMap.tilewidth,
      heroPos : {x: findHero.x, y: findHero.y}
    });
  });
};

module.exports = initDungeon;
