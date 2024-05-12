const { prisma } = require('../prisma/prisma');

const PostController = {
  getPosts: async (req, res) => {
    const userId = req.user.userId;
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true,
          favoritePost: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const postsWithLikeWithFavorite = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
        isFavoritePost: post.favoritePost.some(
          (post) => post.userId === userId
        ),
      }));
      res.status(200).json(postsWithLikeWithFavorite);
    } catch (error) {
      console.error(`Get all posts error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: true,
          favoritePost: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true } },
        },
      });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const isPostWithLikeUser = post.likes.some(
        (like) => like.userId === userId
      );
      const isFavoritePost = post.favoritePost.some(
        (post) => post.userId === userId
      );

      res
        .status(200)
        .json({ ...post, likedByUser: isPostWithLikeUser, isFavoritePost });
    } catch (error) {
      console.error(`Get  post by ID error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },

  addPost: async (req, res) => {
    const { content, imageUrl } = req.body;
    const authorId = req.user.userId;
    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }

    try {
      const newPost = await prisma.post.create({
        data: { content, authorId, imageUrl: imageUrl ? `${imageUrl}` : '' },
        include: { author: true },
      });
      res.status(201).json(newPost);
    } catch (error) {
      console.error(`Create post error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  editPost: async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const body = req.body;

    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }
    if (!id) {
      return res.status(404).json({ message: 'Post ID not found' });
    }
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      if (post.authorId !== req.user.userId) {
        return res.status(403).json({ message: 'not access' });
      }
      const updatePost = await prisma.post.update({
        data: { ...body },
        where: { id },
      });
      res.status(200).json(updatePost);
    } catch (error) {
      console.error(`Update post error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  deletePost: async (req, res) => {
    const { id } = req.params;
    const authorId = req.user.userId;

    if (!id) {
      return res.status(404).json({ message: 'Post ID not found' });
    }
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      if (authorId !== post.authorId) {
        return res.status(403).json({ message: 'not access' });
      }

      await prisma.post.delete({
        where: { id },
      });
      res.status(200).json({ message: `Post success deleted ${post.id}` });
    } catch (error) {
      console.error(`Delete post error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = PostController;
