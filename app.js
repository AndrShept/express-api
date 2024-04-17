const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// папка для створення збереження файлів
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Шлях до папки "images" у папці "uploads"
const imagePath = path.join(uploadsPath, 'images');

// Перевіряємо наявність папки "posts"
if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath);
}
// Шлях до папки "images" у папці "uploads"
const pvideoPath = path.join(uploadsPath, 'videos');

// Перевіряємо наявність папки "posts"
if (!fs.existsSync(pvideoPath)) {
  fs.mkdirSync(pvideoPath);
}

app.use('/uploads', express.static('uploads'));
// if (!fs.existsSync('uploads')) {
//   fs.mkdirSync('uploads');
// }
// app.use('/uploads/post', express.static('uploads/post'));
// if (!fs.existsSync('post')) {
//   fs.mkdirSync('post');
// }

//

app.use('/api', require('./routes'));

module.exports = app;
