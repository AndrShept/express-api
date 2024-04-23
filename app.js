const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// папка для створення збереження файлів
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}
app.use('/uploads', express.static('uploads'));

// Шлях до папки "images" у папці "uploads"
const imagePath = path.join(uploadsPath, 'images');
const videoPath = path.join(uploadsPath, 'videos');

// Перевіряємо наявність папки "posts"
if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath);
}
if (!fs.existsSync(videoPath)) {
  fs.mkdirSync(videoPath);
}

app.use('/api', require('./routes'));



module.exports = app;
