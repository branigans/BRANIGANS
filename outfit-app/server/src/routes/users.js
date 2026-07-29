const express = require('express');
const multer = require('multer');
const prisma = require('../db');
const { requireAuth, requireActiveSubscription } = require('../middleware/auth');
const { uploadImage } = require('../lib/cloudinary');
const { publicUser, post: serializePost, me } = require('../lib/serialize');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('El archivo debe ser una imagen'));
    cb(null, true);
  }
});

router.use(requireAuth, requireActiveSubscription);

router.patch('/me', async (req, res) => {
  const { displayName, bio, favoriteStores } = req.body || {};
  const data = {};
  if (displayName !== undefined) data.displayName = String(displayName).slice(0, 60);
  if (bio !== undefined) data.bio = String(bio).slice(0, 280);
  if (favoriteStores !== undefined) {
    if (!Array.isArray(favoriteStores)) return res.status(400).json({ error: 'favoriteStores debe ser una lista' });
    data.favoriteStores = JSON.stringify(favoriteStores.slice(0, 10).map((s) => String(s).slice(0, 40)));
  }

  const updated = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: me(updated) });
});

router.post('/me/avatar', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });
  const avatarUrl = await uploadImage(req.file.buffer, req.file.mimetype, `avatar-${req.user.username}-${Date.now()}`);
  const updated = await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl } });
  res.json({ user: me(updated) });
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [{ username: { contains: q.toLowerCase() } }, { displayName: { contains: q } }]
    },
    take: 15,
    orderBy: { username: 'asc' }
  });

  res.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl
    }))
  });
});

router.get('/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username.toLowerCase() } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const [followers, following, postsCount, followRecord, posts] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.post.count({ where: { userId: user.id } }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } }
    }),
    prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        garments: true,
        _count: { select: { likes: true } },
        likes: { where: { userId: req.user.id }, select: { id: true } }
      }
    })
  ]);

  res.json({
    user: publicUser(user, {
      followers,
      following,
      posts: postsCount,
      isFollowedByMe: !!followRecord
    }),
    posts: posts.map(serializePost)
  });
});

router.post('/:username/follow', async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username.toLowerCase() } });
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user.id, followingId: target.id } },
    create: { followerId: req.user.id, followingId: target.id },
    update: {}
  });

  res.json({ ok: true });
});

router.delete('/:username/follow', async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username.toLowerCase() } });
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  await prisma.follow.deleteMany({ where: { followerId: req.user.id, followingId: target.id } });
  res.json({ ok: true });
});

module.exports = router;
