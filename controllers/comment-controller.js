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
        include: {
          likes: true,
          author: true,
          post: true,
        },
      });
      for (const comment of comments) {
        comment.replys = await getReplies(comment.id);
      }
      res.status(200).json(comments);
    } catch (error) {
      console.error(`Get all comments error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },

  addComment: async (req, res) => {
    const { content, postId } = req.body;
    console.log('req. req.', req.body);

    const userId = req.user.userId;
    if (!content) {
      return res.status(404).json({ message: 'Content required field' });
    }
    if (!postId) {
      return res.status(404).json({ message: 'Post ID not found' });
    }
    try {
      const newComment = await prisma.comment.create({
        data: { postId, content, authorId: userId },
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

    try {
      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment) {
        return res.status(404).json({ message: 'Comment   not found' });
      }
      if (comment.authorId !== userId) {
        return res.status(403).json({ message: 'No access' });
      }
      if (comment) {
        const updatedComment = await prisma.comment.update({
          data: { content },
          where: { id },
        });
        res.status(200).json(updatedComment);
      }
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
      if (comment.authorId !== userId) {
        return res.status(403).json({ message: 'No access' });
      }
      await deleteReplies(id);

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

async function deleteReplies(commentId) {
  const replies = await prisma.comment.findMany({
    where: { replyId: commentId },
    include: { replys: true },
  });

  for (const reply of replies) {
    await deleteReplies(reply.id);

    await prisma.comment.delete({
      where: { id: reply.id },
    });
  }
}

async function getReplies(commentId) {
  const replies = await prisma.comment.findMany({
    where: { replyId: commentId },
    include: {
      likes: true,
      author: true,
      post: true,
    },
  });

  for (const reply of replies) {
    reply.replys = await getReplies(reply.id);
  }

  return replies;
}

module.exports = CommentController;
