const express = require('express');
const router = express.Router();
const multer = require('multer');
const UserController = require('../controllers/user-controller');
const PostController = require('../controllers/post-controller');
const authToken = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Каталог, куди будуть зберігатися файли
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Генерація унікального імені для файлу
  },
});

const upload = multer({ storage: storage });

// router.post('/upload', upload.single('file'), async function (req, res, next) {
//   // req.file містить інформацію про завантажений файл
//   if (req.file.size > 3 * 1024 * 1024) {
//     res.send({ message: 'File cannot be larger than 3mb.' });
//   }

//   res.send({ message: 'File uploaded successfully.', data: req.file });
// });
//USER
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authToken, UserController.current);
router.get('/users/:id', authToken, UserController.getUserById);
router.get('/users/:username', authToken, UserController.getUserByUsername);
router.put('/users/:id', authToken, UserController.updateUser);

//POST
router.get('/posts', authToken, PostController.getPosts);
router.get('/posts/:id', authToken, PostController.getPostById);
router.post('/posts', authToken, PostController.addPost);
router.delete('/posts/:id', authToken, PostController.deletePost);
router.put('/posts/:id', authToken, PostController.editPost);

module.exports = router;
