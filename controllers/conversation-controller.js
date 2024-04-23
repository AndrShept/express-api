const { prisma } = require('../prisma/prisma');

const ConversationController = {
  getAllConversations: async (req, res) => {
    const userId = req.user.userId;
    try {
      const conversations = await prisma.conversation.findMany({
        where: { OR: [{ receiverId: userId }, { senderId: userId }] },
        // where: { senderId: userId },

        include: { receiverUser: true, senderUser: true, messages: true },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(conversations);
    } catch (error) {
      console.error(`Get all conversation error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getConversationById: async (req, res) => {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(404).json({ message: 'conversationId not fount' });
    }
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },

        include: { receiverUser: true, senderUser: true, messages: true },
      });

      res.status(200).json(conversation);
    } catch (error) {
      console.error(`Get conversation by ID error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  addConversation: async (req, res) => {
    const { receiverId } = req.body;
    console.log('receiverId', receiverId);
    const userId = req.user.userId;
    if (!receiverId) {
      return res.status(404).json({ message: 'receiver Id not found' });
    }
    try {
      const existConversation = await prisma.conversation.findFirst({
        where: { OR: [{ receiverId: userId }, { senderId: userId }] },
      });
      if (existConversation) {
        return res.status(200).json(existConversation);
      }
      const conversation = await prisma.conversation.create({
        data: { receiverId: receiverId, senderId: userId },
      });
      res.status(200).json(conversation);
    } catch (error) {
      console.error(`create  conversation error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  deleteConversation: async (req, res) => {
    const userId = req.user.userId;

    try {
      await prisma.conversation.deleteMany({});

      res.status(200).json({ message: 'delete ALL' });
    } catch (error) {
      console.error(`Get all conversation error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = ConversationController;
