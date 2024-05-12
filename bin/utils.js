const { prisma } = require('../prisma/prisma');

const userOnline = async (userId) => {

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true },
  });
};

const userOffline = async (userId) => {

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false },
  });
};

module.exports = {
  userOnline,
  userOffline,
};
