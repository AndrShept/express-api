const { prisma } = require('../prisma/prisma');

const MessageController = {
  addMessage: async (req, res) => {
    const { content, conversationId, authorId, imageUrl } = req.body;
    const userId = req.user.userId;


    if (!conversationId) {
      return res.status(404).json({ message: 'conversationId not found' });
    }
    if (!authorId) {
      return res.status(404).json({ message: 'authorId not found' });
    }
    try {
      const newMessage = await prisma.message.create({
        data: {
          content,
          conversationId,
          authorId,
          imageUrl,
        },
        include: { author: true, conversation: true },
      });
      res.status(201).json({ ...newMessage, type: 'create' });
    } catch (error) {
      console.error(`create  conversation error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  editMessage: async (req, res) => {
    const body = req.body;
    const { messageId } = req.params;
    const userId = req.user.userId;
    if (!body) {
      return res.status(404).json({ message: 'body not found ' });
    }
    if (!messageId) {
      return res.status(404).json({ message: 'messageId not found ' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { ...body },
      include: { author: true, conversation: true },
    });
    res.status(200).json({ ...updatedMessage, type: 'update' });

    try {
    } catch (error) {
      console.error(`Update message error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },

  deleteMessage: async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    if (!messageId) {
      return res.status(404).json({ message: 'messageId not found ' });
    }

    const deletedMessage = await prisma.message.delete({
      where: { id: messageId },
      include: {conversation: true}
    });
    res.status(200).json({ ...deletedMessage, type: 'delete' });

    try {
    } catch (error) {
      console.error(`Update message error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = MessageController;
