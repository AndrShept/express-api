const express = require('express');
const router = express.Router();
const multer = require('multer');
const UserController = require('../controllers/user-controller');

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

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', UserController.current);
router.get('/users/:userId', UserController.getUserById);
router.get('/users/:username', UserController.getUserByUsername);
router.put('/users/:userId', UserController.updateUser);

module.exports = router;
