const { prisma } = require('../prisma/prisma');

const LikeController = {
  likePost: async (req, res) => {
    const userId = req.user.userId;
    const { postId } = req.params;

    if (!postId) {
      return res.status(404).json({ message: 'Post id not found' });
    }

    try {
      const likeExisting = await prisma.like.findFirst({
        where: { postId, userId },
      });
      if (likeExisting) {
        await prisma.like.deleteMany({
          where: { postId, userId },
        });
        await prisma.notification.deleteMany({
          where: {
            authorId: userId,
            postId,
          },
        });
        return res.status(200).json({ message: 'You unlike post' });
      }
      const findAuthorPost = await prisma.post.findUnique({
        where: { id: postId },
      });
      await prisma.like.create({
        data: { postId, userId },
      });
      if (findAuthorPost.authorId !== userId)
        await prisma.notification.create({
          data: {
            authorId: userId,
            userId: findAuthorPost.authorId,
            postId,
            type: 'like',
          },
        });
      res.status(201).json({ message: 'You liked post' });
    } catch (error) {
      console.error(`Error in like post ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },

  likeComment: async (req, res) => {
    const userId = req.user.userId;
    const { commentId } = req.params;
    console.log('commentId', commentId);
    console.log('userId', userId);

    if (!commentId) {
      return res.status(404).json({ message: 'commentId  not found' });
    }

    try {
      const likeExisting = await prisma.like.findFirst({
        where: { commentId, userId },
      });
      const findAuthorComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      const findAuthorReplys = await prisma.reply.findUnique({
        where: { id: commentId },
      });
      if (likeExisting) {
        await prisma.like.deleteMany({
          where: { commentId, userId },
        });
        await prisma.notification.deleteMany({
          where: {
            authorId: userId,
            commentId,
          },
        });
        return res.status(200).json({ message: 'You unlike comment' });
      }
      await prisma.like.create({
        data: { commentId, userId },
      });
      if (
        findAuthorComment.userId !== userId ||
        findAuthorReplys.authorId !== userId
      )
        await prisma.notification.create({
          data: {
            type: 'like',
            authorId: userId,
            commentId,
            userId: findAuthorComment.userId,
          },
        });
      res.status(201).json({ message: 'You liked comment' });
    } catch (error) {
      console.error(`Error in like comment ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = LikeController;
