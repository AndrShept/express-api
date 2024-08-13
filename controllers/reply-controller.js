const { prisma } = require('../prisma/prisma');

const ReplyController = {
  addReply: async (req, res) => {
    const userId = req.user.userId;
    const { content, commentId, id } = req.body;
    if (!commentId) {
      return res.status(404).json({ message: 'commentId not found' });
    }
    if (!content) {
      return res.status(404).json({ message: 'content not found' });
    }


    try {
      const newReply = await prisma.comment.create({
        data: {
          replyId: commentId,
          authorId: userId,
          content,
          parentId: id
         
        },
      });
      res.status(200).json(newReply);
    } catch (error) {
      console.error(`addReply comments error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getReplysByCommentId: async (req, res) => {
    const userId = req.user.userId;
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(404).json({ message: 'commentId not found' });
    }

    try {
      const replys = await prisma.reply.findMany({
        where: {
          commentId,
        },
        include: { author: true, comment: true, likes: true },
      });
      res.status(200).json(replys);
    } catch (error) {
      console.error(`getReplysByCommentId  error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  deleteReply: async (req, res) => {
    const userId = req.user.userId;
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(404).json({ message: 'commentId not found' });
    }

    try {
      const deletedComment = await prisma.reply.delete({
        where: {
          id: commentId,
        },
        select: { commentId: true },
      });
      res.status(200).json({
        message: 'comment success deleted',
        commentId: deletedComment.commentId,
      });
    } catch (error) {
      console.error(`deleteReply comments error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = ReplyController;
