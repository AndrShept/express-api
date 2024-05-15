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

// const newMessageCount = async ({ conversationId, userId }) => {
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { messages: { include: { author: true, conversation: true } } },
//   });

//   const conversationsWithNewMessagesCount = conversation.messages.filter(
//     (message) => message.isRead === false && message.authorId !== userId
//   ).length;

//   return { conversationId, conversationsWithNewMessagesCount };
// };

module.exports = {
  userOnline,
  userOffline,
  
};
