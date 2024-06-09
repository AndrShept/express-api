const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user-controller');
const PostController = require('../controllers/post-controller');
const authToken = require('../middleware/auth');
const CommentController = require('../controllers/comment-controller');
const LikeController = require('../controllers/like-controller');
const FollowController = require('../controllers/follow-conroller');
const upload = require('../middleware/multer');
const ConversationController = require('../controllers/conversation-controller');
const MessageController = require('../controllers/message-controller');
const FavoritePostController = require('../controllers/favoritePost-controller');
const NotificationController = require('../controllers/notification-controller');
const ReplyController = require('../controllers/reply-controller');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authToken, UserController.current);
router.get('/users', authToken, UserController.getAllUsers);
router.get('/users-following', authToken, UserController.getAllFollowingUsers);
router.get('/users/:id', authToken, UserController.getUserById);
router.get(
  '/users-username/:username',
  authToken,
  UserController.getUserByUsername
);
router.put('/users/:id', authToken, UserController.updateUser);
router.put('/users-online', authToken, UserController.userOnline);
router.put('/users-offline/:userId', UserController.userOffline);

//POST
router.get('/posts', authToken, PostController.getPosts);
router.get('/posts/:id', authToken, PostController.getPostById);
router.post('/posts', authToken, PostController.addPost);
router.delete('/posts/:id', authToken, PostController.deletePost);
router.put('/posts/:id', authToken, PostController.editPost);

//COMMENT
router.post('/comments', authToken, CommentController.addComment);
router.get('/comments/:postId', authToken, CommentController.getComments);
router.delete('/comments/:id', authToken, CommentController.deleteComment);
router.put('/comments/:id', authToken, CommentController.editComment);
//Reply
router.post('/reply', authToken, ReplyController.addReply);
router.get('/reply/:commentId', authToken, ReplyController.getReplysByCommentId);
router.delete('/reply/:commentId', authToken, ReplyController.deleteReply);
// router.put('/comments/:id', authToken, CommentController.editComment);

//LIKE POST
router.post('/like-post/:postId', authToken, LikeController.likePost);
//LIKE COMMENT
router.post('/like-comment/:commentId', authToken, LikeController.likeComment);

//FOLLOW
router.post('/follow/:id', authToken, FollowController.followUser);

//CONVERSATION
router.get(
  '/conversations',
  authToken,
  ConversationController.getAllConversations
);
router.get(
  '/conversations/:conversationId',
  authToken,
  ConversationController.getConversationById
);
router.post(
  '/conversations',
  authToken,
  ConversationController.addConversation
);
router.delete(
  '/conversations',
  authToken,
  ConversationController.deleteConversation
);
router.put(
  '/conversations/:conversationId',
  authToken,
  ConversationController.isReadMessages
);

//MESSAGES
router.post('/messages', authToken, MessageController.addMessage);
router.put('/messages/:messageId', authToken, MessageController.editMessage);
router.put(
  '/messages-isRead/:messageId',
  authToken,
  MessageController.isReadOnceMessage
);
router.delete(
  '/messages/:messageId',
  authToken,
  MessageController.deleteMessage
);

//FAVORITE-POST
router.post(
  `/favorite-posts/:postId`,
  authToken,
  FavoritePostController.addFavorite
);
//NOTIFICATION
router.get(
  `/notifications`,
  authToken,
  NotificationController.getNotifications
);
router.delete(
  `/notifications`,
  authToken,
  NotificationController.clearAllNotifications
);
router.put(
  `/notifications/:notificationId`,
  authToken,
  NotificationController.updateNotification
);

//UPLOAD
router.post(
  '/upload',
  upload.single('file'),

  async function (req, res, next) {
    console.log(req.file);

    if (req.file && req.file.size > 3 * 1024 * 1024) {
      return res.send({ message: 'File image cannot be larger than 3mb.' });
    }

    res.send({
      imageUrl: `/uploads/images/${req.file.filename}`,
    });
  }
);

module.exports = router;
