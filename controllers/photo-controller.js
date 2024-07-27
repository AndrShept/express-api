const { prisma } = require('../prisma/prisma');

const PhotoController = {
  addPhotos: async (req, res) => {
    const userId = req.user.userId;
    const files = req.files;

    // if (req.file && req.file.size > 3 * 1024 * 1024) {
    //   return res.send({ message: 'File image cannot be larger than 3mb.' });
    // }

    try {
      const newPhotos = await prisma.photo.createMany({
        data: files.map((file) => ({
          url: `/uploads/images/${file.filename}`,
          userId,
          name: file.originalname,
          size: file.size,
        })),
      });
      res.status(201).json(newPhotos);
    } catch (error) {
      console.error(`create  photos error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getPhotosByUsername: async (req, res) => {
    const userId = req.user.userId;
    const { username } = req.params;

    if (!username) {
      return res.status(404).json({ message: 'username not found' });
    }
    try {
      const photos = await prisma.photo.findMany({
        where: { user: { username } },
        include: {
          comments: true,
          likes: true,
          _count: { select: { view: true, comments: true, likes: true } },
        },
        orderBy: { id: 'desc' },
      });

      const postsWithLike = photos.map((photo) => ({
        ...photo,
        likedByUser: photo.likes.some((like) => like.userId === userId),
      }));
      res.status(201).json(postsWithLike);
    } catch (error) {
      console.error(`get photos by username error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = PhotoController;
