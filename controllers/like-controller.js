const { prisma } = require('../prisma/prisma');

const LikeController = {
  addLike: async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { type } = req.body;

    if (!id) {
      return res.status(404).json({ message: 'like id not found' });
    }
    if (!type) {
      return res.status(404).json({ message: 'like type not found' });
    }

    try {
      if (type === 'post') {
        const likeExisting = await prisma.like.findFirst({
          where: { postId: id, userId },
        });
        if (likeExisting) {
          await prisma.like.deleteMany({
            where: { postId: id, userId },
          });
          await prisma.notification.deleteMany({
            where: {
              authorId: userId,
              postId: id,
            },
          });
          return res.status(200).json({ message: 'You unlike post' });
        }
        const findAuthorPost = await prisma.post.findUnique({
          where: { id },
        });
        await prisma.like.create({
          data: { postId: id, userId },
        });
        if (findAuthorPost.authorId !== userId)
          await prisma.notification.create({
            data: {
              authorId: userId,
              userId: findAuthorPost.authorId,
              postId: id,
              type: 'like',
            },
          });
        res.status(201).json({ message: 'You liked post' });
      }
      if (type === 'comment') {
        const likeExisting = await prisma.like.findFirst({
          where: { commentId: id, userId },
        });
        if (likeExisting) {
          await prisma.like.deleteMany({
            where: { commentId: id, userId },
          });
          await prisma.notification.deleteMany({
            where: {
              authorId: userId,
              commentId: id,
            },
          });
          return res.status(200).json({ message: 'You unlike comment' });
        }
        const findAuthorComment = await prisma.comment.findUnique({
          where: { id },
        });
        await prisma.like.create({
          data: { commentId: id, userId },
        });
        if (findAuthorComment.authorId !== userId)
          await prisma.notification.create({
            data: {
              authorId: userId,
              userId: findAuthorComment.authorId,
              commentId: id,
              type: 'like',
            },
          });
        res.status(201).json({ message: 'You liked comment' });
      }
    } catch (error) {
      console.error(`Error in create like  ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = LikeController;
