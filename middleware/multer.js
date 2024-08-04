const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const imagesPathname = path.join(__dirname, '../uploads/images');
const videoPathname = path.join(__dirname, '../uploads/video');
const fs = require('fs').promises;

const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'file') cb(null, imagesPathname); // Каталог, куди будуть зберігатися файли
    if (file.fieldname === 'files') cb(null, imagesPathname); // Каталог, куди будуть зберігатися файли
    if (file.fieldname === 'video') cb(null, videoPathname); // Каталог, куди будуть зберігатися файли
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Генерація унікального імені для файлу
  },
});

const saveAsWebP = async (buffer, originalname) => {
  const webpFilename =
    Date.now() +
    '-' +
    originalname.replace(path.extname(originalname), '.webp');
  const webpFilePath = path.join(imagesPathname, webpFilename);

  await sharp(buffer).webp({ quality: 80 }).toFile(webpFilePath);
  const stats = await fs.stat(webpFilePath);
  return {
    filename: webpFilename,
    path: webpFilePath,
    size: stats.size,
  };
};

const uploadAndConvert = async (req, res, next) => {
  try {
    if (req.file) {
      const { filename, path,    size, } = await saveAsWebP(
        req.file.buffer,
        req.file.originalname
      );
      req.file = {
        ...req.file,
        filename,
        path,
        size,
      };
      next();
    } else if (req.files) {
      const convertedFiles = await Promise.all(
        req.files.map(async (file) => {
          const { filename, path ,    size,} = await saveAsWebP(
            file.buffer,
            file.originalname
          );
          return {
            ...file,
            filename,
            path,
            size,
          };
        })
      );

      req.files = convertedFiles;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.error(`Error converting files: ${error}`);
    res.status(500).json({ error: 'Error converting files to WebP' });
  }
};

const upload = multer({ storage: storage });

module.exports = { upload, uploadAndConvert };
