const { prisma } = require('../prisma/prisma');

const CommentController = {
  getComments: async (req, res) => {
    const userId = req.user.userId;
    const { postId } = req.params;
    if (!postId) {
      return res.status(404).json({ message: 'post ID not found' });
    }
    try {
      const comments = await prisma.comment.findMany({
        where: { postId },
        include: { likes: true, user: true, post: true },
      });
      res.status(200).json(comments);
    } catch (error) {
      console.error(`Get all comments error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  //   getCommentById: async (req, res) => {
  //     const { id } = req.params;
  //     const userId = req.user.userId;
  //     try {
  //     } catch (error) {
  //       console.error(`Get comment by ID  error ${error} `);
  //       return res
  //         .status(500)
  //         .json({ error: `Internal database error ${error}` });
  //     }
  //   },

  addComment: async (req, res) => {
    const { content, postId } = req.body;

    const userId = req.user.userId;
    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }
    if (!postId) {
      return res.status(404).json({ message: 'Post ID not found' });
    }
    try {
      const newComment = await prisma.comment.create({
        data: { postId, userId, content },
      });
      res.status(201).json(newComment);
    } catch (error) {
      console.error(`Create comment error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  editComment: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }
    // if (!postId) {
    //   return res.status(404).json({ message: 'Post ID not found' });
    // }

    try {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) {
        return res.status(404).json({ message: 'Comment  not found' });
      }
      if (comment.userId !== userId) {
        return res.status(403).json({ message: 'No access' });
      }

      const updatedComment = await prisma.comment.update({
        data: { content },
        where: { id },
      });
      res.status(200).json(updatedComment);
    } catch (error) {
      console.error(`Update comment error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  deleteComment: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) {
        return res.status(404).json({ message: 'Comment  not found' });
      }
      if (comment.userId !== userId) {
        return res.status(403).json({ message: 'No access' });
      }
      await prisma.comment.delete({
        where: { id },
      });
      res.status(200).json({ message: 'comment success deleted' });
    } catch (error) {
      console.error(`Delete comment error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
};

module.exports = CommentController;
