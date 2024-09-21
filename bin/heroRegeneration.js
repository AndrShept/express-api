const { prisma } = require('../prisma/prisma');
const { HEALTH_REGEN, MANA_REGEN } = require('./constant');

const heroRegeneration = async (username, socket, hero) => {
  const healthTime =
    HEALTH_REGEN -
    (hero.modifier.constitution * 30 + hero.modifier.strength * 10);
  const manaTime = MANA_REGEN - hero.modifier.intelligent * 40;
  const healthInterval = setInterval(async () => {
    if (hero.modifier.health < hero.modifier.maxHealth) {
      const updatedHero = await prisma.hero?.update({
        where: { id: hero?.id },
        data: { modifier: { update: { health: { increment: 1 } } } },
        include: { modifier: true },
      });
      socket.emit(username, { health: updatedHero.modifier.health });
      if (updatedHero.modifier.health >= updatedHero.modifier.maxHealth) {
        clearInterval(healthInterval);
      }
    }
  }, healthTime);
  const manaInterval = setInterval(async () => {
    if (hero.modifier.mana < hero.modifier.maxMana) {
      const updatedHero = await prisma.hero?.update({
        where: { id: hero?.id },
        data: { modifier: { update: { mana: { increment: 1 } } } },
        include: { modifier: true },
      });
      socket.emit(username, { mana: updatedHero.modifier.mana });
      if (updatedHero.modifier.mana >= updatedHero.modifier.maxMana) {
        clearInterval(manaInterval);
      }
    }
  }, 5000);

  socket.on('disconnect', () => {
    clearInterval(healthInterval);
    clearInterval(manaInterval);
  });
};

module.exports = heroRegeneration;
