const { prisma } = require('../prisma/prisma');
const { getMapJson } = require('./utils');

const building2DMap = (mapObjects, jsonMap) => {
  const dungeonMap = [];
  for (let i = 0; i < jsonMap.height; i++) {
    const row = [];
    for (let j = 0; j < jsonMap.width; j++) {
      row.push(null);
    }
    dungeonMap.push(row);
  }
  mapObjects.forEach((obj) => {
    const x = obj.x / jsonMap.tilewidth;
    const y = obj.y / jsonMap.tilewidth - 1;

    dungeonMap[y][x] = obj;
  });

  return dungeonMap;
};

const startDungeon = async (socket, hero) => {
  socket.on('dungeon-init', async (dungeonSessionId) => {
    const dungeonSession = await prisma.dungeonSession.findFirst({
      where: { heroId: hero.id, status: 'INPROGRESS' },
      include: { tiles: true },
    });
    const jsonMap = getMapJson(dungeonSession?.dungeonId);
    if (!jsonMap) return;
    const mapObjects = jsonMap.layers[0].objects;
    const tilewidth = jsonMap.tilewidth;

    if (!dungeonSession?.tiles.length) {
      mapObjects.push({
        id: Math.random(),
        gid: 35,
        height: tilewidth,
        width: tilewidth,
        name: 'hero',
        x: tilewidth,
        y: tilewidth * 2,
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
          x: tilewidth,
          y: tilewidth * 2,
          heroId: hero.id,
        },
      });
    }

    const tiles = await prisma.tile.findMany({
      where: { dungeonSessionId },
      include: { hero: true, monster: true },
    });
    const dungeonMap = building2DMap(tiles, jsonMap);
    socket.emit(dungeonSessionId, {
      dungeonMap,
      height: jsonMap.height,
      width: jsonMap.width,
      tileSize: jsonMap.tilewidth,
    });
  });
};

module.exports = startDungeon;
