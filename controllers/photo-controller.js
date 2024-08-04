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
    const { page } = req.query;
    let { search } = req.query;
    if (search === 'undefined' || search === 'null') {
      search = '';
    }
    const pageNumber = Number(page);
    const pageSize = 10;
    const take = pageNumber * pageSize;
    console.log('pageNumber', pageNumber);
    console.log('search =', search);
    if (!username) {
      return res.status(404).json({ message: 'username not found' });
    }
    try {
      const photos = await prisma.photo.findMany({
        where: { user: { username }, name: { startsWith: search } },
        take,
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

  getPhotosById: async (req, res) => {
    const userId = req.user.userId;
    const { photoId } = req.params;

    if (!photoId) {
      return res.status(404).json({ message: 'photoId not found' });
    }
    try {
      const photos = await prisma.photo.findUnique({
        where: { id: photoId },

        include: {
          user: true,
          comments: true,
          likes: true,
          _count: { select: { comments: true, likes: true, view: true } },
        },
      });

      const isLikeUsers = photos.likes.some(like => like.userId === userId)
      
      res.status(201).json({...photos , likedByUser: isLikeUsers });
    } catch (error) {
      console.error(`get photos by ID error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  deletePhotos: async (req, res) => {
    const userId = req.user.userId;
    const body = req.body;

    const photoIdArray = body.map((photo) => photo.id);

    try {
      const result = await prisma.photo.deleteMany({
        where: { id: { in: photoIdArray } },
      });
      res.status(200).json(result);
    } catch (error) {
      console.error(`delete photos  error ${error} `);
      return res.status(500).json({ error: `Internal database error ` });
    }
  },
};

module.exports = PhotoController;
