const multer = require('multer');
const path = require('path');
const imagesPathname = path.join(__dirname, '../uploads/images');
const videoPathname = path.join(__dirname, '../uploads/video');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'file') cb(null, imagesPathname); // Каталог, куди будуть зберігатися файли
    if (file.fieldname === 'video') cb(null, videoPathname); // Каталог, куди будуть зберігатися файли
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

module.exports = upload;
