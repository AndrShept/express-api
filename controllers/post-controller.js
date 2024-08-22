const { s3 } = require('../middleware/multer');
const { prisma } = require('../prisma/prisma');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const PostController = {
  getPosts: async (req, res) => {
    const userId = req.user.userId;
    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true,
          favoritePost: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true, view: true } },
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
  getAllUserPosts: async (req, res) => {
    const userId = req.user.userId;
    const { username } = req.params;
    try {
      const posts = await prisma.post.findMany({
        where: { author: { username } },
        include: {
          author: true,
          favoritePost: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true, view: true } },
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
      console.error(`Get posts users error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getFavoritePosts: async (req, res) => {
    const userId = req.user.userId;
    try {
      const favoritePost = await prisma.favoritePost.findMany({
        where: {
          userId,
        },
        include: {
          post: {
            include: {
              author: true,
              favoritePost: true,
              likes: { include: { user: true } },
              _count: { select: { comments: true, view: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      const newFavoritePosts = favoritePost.map((item) => item.post);

      const postsWithLikeWithFavorite = newFavoritePosts.map((post) => ({
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
      const viewUserExist = await prisma.view.findFirst({
        where: { postId: id, userId },
      });
      if (!viewUserExist) {
        await prisma.view.create({
          data: { postId: id, userId },
        });
      }
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: true,
          favoritePost: true,
          likes: { include: { user: true } },
          _count: { select: { comments: true, view: true } },
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
    const content = req.body.content;
    const authorId = req.user.userId;
    const file = req?.file;
    const fileUrl = file?.mimetype.startsWith('image/')
      ? { imageUrl: file?.location }
      : { videoUrl: file?.location };

    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }

    try {
      const userFollowers = await prisma.follows.findMany({
        where: { followingId: authorId },
      });

      const newPost = await prisma.post.create({
        data: { content, authorId, ...fileUrl },
        include: { author: true },
      });

      const notificationsAllFollowerUsers = userFollowers.map((follower) => {
        return {
          type: 'post',
          postId: newPost.id,
          userId: follower.followerId,
          authorId,
        };
      });

      if (notificationsAllFollowerUsers.length) {
        const newNotifications = await prisma.notification.createMany({
          data: notificationsAllFollowerUsers,
        });
      }

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

    const post = await prisma.post.findUnique({
      where: { id },
    });
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (authorId !== post.authorId) {
      return res.status(403).json({ message: 'not access' });
    }

    if (post.imageUrl) {
      const key = post.imageUrl.split('/').pop();
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      };
      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);
    }

    try {
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
