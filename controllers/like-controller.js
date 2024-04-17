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
        return res.status(200).json({ message: 'You unlike post' });
      }
      await prisma.like.create({
        data: { postId, userId },
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

    if (!commentId) {
      return res.status(404).json({ message: 'commentId  not found' });
    }

    try {
      const likeExisting = await prisma.like.findFirst({
        where: { commentId, userId },
      });
      if (likeExisting) {
        await prisma.like.deleteMany({
          where: { commentId, userId },
        });
        return res.status(200).json({ message: 'You unlike comment' });
      }
      await prisma.like.create({
        data: { commentId, userId },
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
