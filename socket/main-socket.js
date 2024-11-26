const { Server } = require('socket.io');
let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: '*',
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io не ініціалізовано!');
    }
    return io;
  },
};
