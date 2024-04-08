const { prisma } = require('../prisma/prisma');

const FollowController = {
  followUser: async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    if (userId === id) {
      return res
        .status(400)
        .json({ message: 'You cannot follow to yourself' });
    }
    try {
      const existingFollow = await prisma.follows.findFirst({
        where: {
          followerId: userId,
          followingId: id,
        },
      });

      if (existingFollow) {
        await prisma.follows.deleteMany({
          where: {
            followerId: userId,
            followingId: id,
          },
        });
        return res.status(200).json({ message: 'Unfollow user' });
      }
      const followUser = await prisma.follows.create({
        data: {
          followerId: userId,
          followingId: id,
        },
        include: { following: { select: { username: true } } },
      });

      res.status(201).json({
        message: `You following user ${followUser.following.username} `,
      });
    } catch (error) {
      console.error(`Error in follow user ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = FollowController;
