const multer = require('multer');
const path = require('path');
const pathname = path.join(__dirname, '../uploads');
console.log('pathname --', pathname);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pathname); // Каталог, куди будуть зберігатися файли
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
