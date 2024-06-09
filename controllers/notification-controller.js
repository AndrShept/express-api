const { prisma } = require('../prisma/prisma');

const NotificationController = {
  getNotifications: async (req, res) => {
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: { post: true, user: true, author: true, comment: true },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });

    res.status(200).json(notifications);
  },
  clearAllNotifications: async (req, res) => {
    const userId = req.user.userId;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.status(200).json({ message: 'all notifications deleted' });
  },
  updateNotification: async (req, res) => {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'notification updated' });
  },
};

module.exports = NotificationController;
