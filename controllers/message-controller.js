const { prisma } = require('../prisma/prisma');

const MessageController = {
  addMessage: async (req, res) => {
    const { content, conversationId, authorId } = req.body;
    const userId = req.user.userId;
    if (!content) {
      return res.status(404).json({ message: 'content not found ' });
    }
    if (!conversationId) {
      return res.status(404).json({ message: 'conversationId not found' });
    }
    if (!authorId) {
      return res.status(404).json({ message: 'authorId not found' });
    }
    try {
      const newMessage = await prisma.message.create({
        data: { content, conversationId, authorId },
      });
      res.status(201).json(newMessage);
    } catch (error) {
      console.error(`create  conversation error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = MessageController;
