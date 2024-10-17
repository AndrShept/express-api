const { prisma } = require('../prisma/prisma');
const { HEALTH_REGEN, MANA_REGEN } = require('./constant');

const heroRegeneration = async (username, socket, hero) => {
  const healthTime =
    HEALTH_REGEN -
    (hero.modifier.constitution * 30 + hero.modifier.strength * 10);
  const manaTime = MANA_REGEN - hero.modifier.intelligence * 40;
  const healthInterval = setInterval(async () => {
    if (hero.health < hero.modifier.maxHealth) {
      const updatedHero = await prisma.hero?.update({
        where: { id: hero?.id },
        data: {  health: { increment: 1 } },
        include: { modifier: true },
      });
      const finalHealth = Math.min(
        updatedHero.health,
        updatedHero.modifier.maxHealth
      );
      socket.emit(username, { health: finalHealth });
      if (finalHealth === updatedHero.modifier.maxHealth) {
        clearInterval(healthInterval);
      }
    }
  }, healthTime);
  const manaInterval = setInterval(async () => {
    if (hero.mana < hero.modifier.maxMana) {
      const updatedHero = await prisma.hero?.update({
        where: { id: hero?.id },
        data: { mana: { increment: 1 } },
        include: { modifier: true },
      });
      const finalMana = Math.min(
        updatedHero.mana,
        updatedHero.modifier.maxMana
      );
      socket.emit(username, { mana: finalMana });
      if (finalMana === updatedHero.modifier.maxMana) {
        clearInterval(manaInterval);
      }
    }
  }, manaTime);

  socket.on('disconnect', () => {
    clearInterval(healthInterval);
    clearInterval(manaInterval);
  });
};

module.exports = heroRegeneration;
