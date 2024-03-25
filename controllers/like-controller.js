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
};

module.exports = LikeController;
