const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();

const uploadAndOptimize = async (req, res, next) => {
  const maxFileSizeImage = 10 * 1024 * 1024;
  const maxFileSizeVideo = 20 * 1024 * 1024;
  try {
    if (req.file) {
      const isImageFile = req.file.mimetype.startsWith('image/');
      const isVideoFile = req.file.mimetype.startsWith('video/');

      if (isImageFile && req.file.size > maxFileSizeImage) {
        return res.status(400).send('Image file cannot be larger than 10MB');
      }
      if (isVideoFile && req.file.size > maxFileSizeVideo) {
        return res.status(400).send('Video file cannot be larger than 20MB');
      }

      let optimizedBuffer;
      let key;
      let contentType;

      if (isImageFile) {
        optimizedBuffer = await sharp(req.file.buffer)
          .rotate()
          .resize(1024, 1024, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          // .resize({
          //   height: 1920,
          //   width: 1080,
          //   fit: 'contain',
          // })
          .toFormat('jpeg', { quality: 80 })
          .toBuffer();

        key = `${uuidv4()}.jpeg`;
        contentType = 'image/jpeg';
      }

      if (isVideoFile) {
        key = `${uuidv4()}.${req.file.mimetype.split('/').pop()}`;
        optimizedBuffer = req.file.buffer;
        contentType = req.file.mimetype;
      }

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: contentType,
        Metadata: { fieldName: req.file.fieldname },
      });

      await s3.send(command);

      req.file.location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`;
      req.file.s3Key = key;
      req.file.optimized = true;

      next();
    } else if (req.files) {
      for (const file of req.files) {
        if (file.size > maxFileSizeImage) {
          return res.json({ message: 'File  cannot be larger than 10mb' });
        }
      }
      const optimizedFiles = await Promise.all(
        req.files.map(async (file) => {
          if (file.mimetype.startsWith('image/')) {
            const optimizedBuffer = await sharp(file.buffer)
              .rotate()
              .resize(1024, 1024, {
                fit: sharp.fit.inside,
                withoutEnlargement: true,
              })
              .toFormat('jpeg', { quality: 80 })
              .toBuffer();

            const key = `${uuidv4()}.jpeg`;

            const command = new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: key,
              Body: optimizedBuffer,
              ContentType: 'image/jpeg',
              Metadata: { fieldName: file.fieldname },
            });

            await s3.send(command);

            return {
              ...file,
              location: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`,
              s3Key: key,
              optimized: true,
            };
          }

          return file;
        })
      );

      req.files = optimizedFiles;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.error(`Error processing files: ${error}`);
    res.status(500).json({ error: 'Error processing files' });
  }
};

const upload = multer({ storage: storage });

module.exports = { upload, uploadAndOptimize, s3 };
