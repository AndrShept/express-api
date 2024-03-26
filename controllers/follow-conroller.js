const { prisma } = require('../prisma/prisma');

const FollowController = {
  followUser: async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
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
        include: { following: true },
      });

      res.status(201).json({
        message: `You following to ${followUser.following.username} `,
      });
    } catch (error) {
      console.error(`Error in register ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  unfollowUser: async (req, res) => {
    try {
    } catch (error) {
      console.error(`Error in register ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = FollowController;
