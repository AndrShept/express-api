const express = require('express');
const router = express.Router();
const { upload, uploadAndOptimize } = require('../middleware/multer');
const UserController = require('../controllers/user-controller');
const PostController = require('../controllers/post-controller');
const authToken = require('../middleware/auth');
const CommentController = require('../controllers/comment-controller');
const LikeController = require('../controllers/like-controller');
const FollowController = require('../controllers/follow-conroller');
const ConversationController = require('../controllers/conversation-controller');
const MessageController = require('../controllers/message-controller');
const FavoritePostController = require('../controllers/favoritePost-controller');
const NotificationController = require('../controllers/notification-controller');
const ReplyController = require('../controllers/reply-controller');
const PhotoController = require('../controllers/photo-controller');

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authToken, UserController.current);
router.get('/users/:searchValue?', authToken, UserController.getAllUsers);
router.get('/users-following', authToken, UserController.getAllFollowingUsers);
router.get('/users/:id', authToken, UserController.getUserById);
router.get(
  '/users-username/:username',
  authToken,
  UserController.getUserByUsername
);
router.put(
  '/users/:id',
  authToken,
  upload.single('file'),
  uploadAndOptimize,
  UserController.updateUser
);
router.put('/users-online', authToken, UserController.userOnline);
router.put('/users-offline/:userId', UserController.userOffline);

//PHOTO

router.post(
  '/users-photo',
  authToken,
  upload.array('files'),
  uploadAndOptimize,

  PhotoController.addPhotos
);
router.get(
  '/users-photos/:username',
  authToken,
  PhotoController.getPhotosByUsername
);
router.get('/users-photo/:photoId', authToken, PhotoController.getPhotosById);
router.delete('/delete-photos', authToken, PhotoController.deletePhotos);

//POST
router.get('/posts', authToken, PostController.getPosts);
router.get('/posts-user/:username', authToken, PostController.getAllUserPosts);
router.get('/favorite-posts', authToken, PostController.getFavoritePosts);
router.get('/posts/:id', authToken, PostController.getPostById);
router.post(
  '/posts',
  authToken,
  upload.single('file'),
  uploadAndOptimize,
  PostController.addPost
);
router.delete('/posts/:id', authToken, PostController.deletePost);
router.put('/posts/:id', authToken, PostController.editPost);

//COMMENT
router.post('/comments', authToken, CommentController.addComment);
router.get('/comments/:id', authToken, CommentController.getComments);
router.delete('/comments/:id', authToken, CommentController.deleteComment);
router.put('/comments/:id', authToken, CommentController.editComment);
//Reply
router.post('/reply', authToken, ReplyController.addReply);
router.get(
  '/reply/:commentId',
  authToken,
  ReplyController.getReplysByCommentId
);
router.delete('/reply/:commentId', authToken, ReplyController.deleteReply);
// router.put('/comments/:id', authToken, CommentController.editComment);

//ADD LIKE
router.post('/like/:id', authToken, LikeController.addLike);

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
router.post(
  '/messages',
  authToken,
  upload.single('file'),
  uploadAndOptimize,
  MessageController.addMessage
);
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

module.exports = router;
