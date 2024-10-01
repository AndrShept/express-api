const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { userOffline, userOnline } = require('./bin/utils');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const { prisma } = require('./prisma/prisma');
const game = require('./bin/game');
const getHeroWithModifiers = require('./bin/getHeroWithModifiers');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || '3000';

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use('/api', routes);
routes.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

io.on('connection', async (socket) => {
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.headers.username;
  console.log(`A user connected ${username}`);
  if (userId) {
    userOnline(userId);
  }
  const hero = await getHeroWithModifiers(username);
  if (hero) {
    game(username, socket, hero);
  }

  socket.on('msg', async (msg) => {
    io.emit(msg.conversationId, msg);
    if (msg.conversation.receiverId === userId) {
      io.emit(msg.conversation.senderId, msg);
    } else {
      io.emit(msg.conversation.receiverId, msg);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected ${username}`);
    if (userId) {
      userOffline(userId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running port:${PORT}`);
});

module.exports = app;
