const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const {  userOffline } = require('./bin/utils');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || '3000';

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use('/api', require('./routes'));

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

io.on('connection', async (socket) => {
  // const userId = socket.handshake.headers.userid;
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.headers.username;
  console.log(`A user connected ${username}`);

  socket.on('msg', async (msg) => {
    io.emit(msg.conversationId, msg);
    if (msg.conversation.receiverId === userId) {
      io.emit(msg.conversation.senderId, msg);
    } else {
      io.emit(msg.conversation.receiverId, msg);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected ${username}`);
    await userOffline(userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running port:${PORT}`);
});

// папка для створення збереження файлів
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Шлях до папки "images" у папці "uploads"
const imagePath = path.join(uploadsPath, 'images');
const videoPath = path.join(uploadsPath, 'videos');

// Перевіряємо наявність папки
if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath);
}
if (!fs.existsSync(videoPath)) {
  fs.mkdirSync(videoPath);
}

module.exports = app;
