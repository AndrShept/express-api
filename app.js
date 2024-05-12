const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const { prisma } = require('./prisma/prisma');
const { userOnline, userOffline } = require('./bin/utils');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || '3000';

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const io = socketIo(server, {
  cors: {
    origin: '*',
    
  },
});

io.on('connection', async (socket) => {
  const userId = socket.handshake.headers.userid;
  const username = socket.handshake.headers.username;
  console.log(`A user connected ${username}`);
  // if (userId) {
  //   userOnline(userId);
  // }
  socket.on('msg', (msg) => {
    io.emit(msg.conversationId, msg);
  });

  socket.on('disconnect', async () => {
    
    // if (userId) {
    //   userOffline(userId);
    // }

    console.log(`User disconnected ${username}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running port:${PORT}`);
});

app.use('/uploads', express.static('uploads'));
app.use('/api', require('./routes'));

// папка для створення збереження файлів
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

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

module.exports = app;
