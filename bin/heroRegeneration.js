const { prisma } = require('../prisma/prisma');
const { HEALTH_REGEN, MANA_REGEN } = require('./constant');

const heroRegeneration = async (username, socket, hero) => {
  let health;
  let healthTimer;
  let mana;
  let manaTimer;
  let constitution = hero.modifier.constitution;
  let strength = hero.modifier.strength;
  let intelligence = hero.modifier.intelligence;

  const startHealthRegen = (data) => {
    const healthTime = HEALTH_REGEN - (constitution * 30 + strength * 10);
    clearInterval(healthTimer);
    health = data.health;
    healthTimer = setInterval(async () => {
   
      health += 1;
      const updatedHero = await prisma.hero.update({
        where: { id: hero.id },
        data: { health: Math.min(health, data.maxHealth) },
        include: { modifier: true },
      });
      constitution = updatedHero.modifier.constitution;
      strength = updatedHero.modifier.strength;
      console.log('constitution', constitution);
      console.log('healthTime', healthTime);
      socket.emit(username, { health: updatedHero.health });
    }, healthTime);
  };
  const startManaRegen = (data) => {
    const manaTime = MANA_REGEN - intelligence * 40;
    clearInterval(manaTimer);
    mana = data.mana;
    manaTimer = setInterval(async () => {
      mana += 1;
      const updatedHero = await prisma.hero.update({
        where: { id: hero.id },
        data: { mana: Math.min(mana, data.maxMana) },
        include: { modifier: true },
      });
      intelligence = updatedHero.modifier.intelligence;
      console.log('intelligence', intelligence);
      console.log('manaTime', manaTime);
      socket.emit(username, { mana });
    }, manaTime);
  };

  socket.on('go-health', (data) => {
    console.log('go-health', data);
    startHealthRegen(data);
  });
  socket.on('go-mana', (data) => {
    console.log('go-mana', data);
    startManaRegen(data);
  });

  socket.on('stop-health', (data) => {
    console.log('stop-health', data);
    clearInterval(healthTimer);
  });
  socket.on('stop-mana', (data) => {
    console.log('stop-mana', data);
    clearInterval(manaTimer);
  });

  socket.on('disconnect', () => {
    clearInterval(healthTimer);
    clearInterval(manaTimer);
  });
};

module.exports = heroRegeneration;
