const express = require('express');
const prisma = require('../db');
const { requireAuth, requireActiveSubscription } = require('../middleware/auth');
const { notification: serializeNotification } = require('../lib/serialize');

const router = express.Router();

router.use(requireAuth, requireActiveSubscription);

router.get('/', async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { actor: true, post: true }
    }),
    prisma.notification.count({ where: { userId: req.user.id, read: false } })
  ]);

  res.json({ notifications: notifications.map(serializeNotification), unreadCount });
});

router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true }
  });
  res.json({ ok: true });
});

module.exports = router;
