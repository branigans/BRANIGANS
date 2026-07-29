const express = require('express');
const multer = require('multer');
const prisma = require('../db');
const { requireAuth, requireActiveSubscription } = require('../middleware/auth');
const { uploadImage } = require('../lib/cloudinary');
const { post: serializePost } = require('../lib/serialize');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('El archivo debe ser una imagen'));
    cb(null, true);
  }
});

function postIncludeFor(userId) {
  return {
    user: true,
    garments: true,
    _count: { select: { likes: true } },
    likes: { where: { userId }, select: { id: true } },
    saves: { where: { userId }, select: { id: true } }
  };
}

router.use(requireAuth, requireActiveSubscription);

router.get('/', async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  const posts = await prisma.post.findMany({
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: postIncludeFor(req.user.id)
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  res.json({ posts: posts.map(serializePost), nextCursor });
});

router.get('/saved', async (req, res) => {
  const saves = await prisma.save.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { post: { include: postIncludeFor(req.user.id) } }
  });
  res.json({ posts: saves.map((s) => serializePost(s.post)) });
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta la foto del outfit' });

    let garments;
    let stores;
    try {
      garments = JSON.parse(req.body.garments || '[]');
      stores = JSON.parse(req.body.stores || '[]');
    } catch {
      return res.status(400).json({ error: 'Formato inválido para prendas o tiendas' });
    }

    if (!Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({ error: 'Agrega al menos una prenda con sus colores' });
    }
    for (const g of garments) {
      if (!g.name || !Array.isArray(g.colors) || g.colors.length === 0) {
        return res.status(400).json({ error: 'Cada prenda necesita nombre y al menos un color' });
      }
    }

    const imageUrl = await uploadImage(
      req.file.buffer,
      req.file.mimetype,
      `${req.user.username}-${Date.now()}`
    );

    const created = await prisma.post.create({
      data: {
        userId: req.user.id,
        imageUrl,
        stores: JSON.stringify(Array.isArray(stores) ? stores : []),
        garments: {
          create: garments.map((g, i) => ({
            name: String(g.name).slice(0, 120),
            colors: JSON.stringify(g.colors.slice(0, 8).map((c) => String(c).slice(0, 40))),
            order: i
          }))
        }
      },
      include: postIncludeFor(req.user.id)
    });

    res.status(201).json({ post: serializePost(created) });
  } catch (err) {
    console.error('[posts] create', err);
    res.status(500).json({ error: 'No se pudo publicar el outfit' });
  }
});

router.post('/:id/like', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  const alreadyLiked = await prisma.like.findUnique({
    where: { postId_userId: { postId: req.params.id, userId: req.user.id } }
  });

  if (!alreadyLiked) {
    await prisma.like.create({ data: { postId: req.params.id, userId: req.user.id } });
    if (existing.userId !== req.user.id) {
      await prisma.notification.create({
        data: { userId: existing.userId, actorId: req.user.id, type: 'like', postId: req.params.id }
      });
    }
  }

  const likesCount = await prisma.like.count({ where: { postId: req.params.id } });
  res.json({ likesCount, likedByMe: true });
});

router.delete('/:id/like', async (req, res) => {
  await prisma.like.deleteMany({ where: { postId: req.params.id, userId: req.user.id } });
  const likesCount = await prisma.like.count({ where: { postId: req.params.id } });
  res.json({ likesCount, likedByMe: false });
});

router.post('/:id/save', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });

  await prisma.save.upsert({
    where: { postId_userId: { postId: req.params.id, userId: req.user.id } },
    create: { postId: req.params.id, userId: req.user.id },
    update: {}
  });

  res.json({ savedByMe: true });
});

router.delete('/:id/save', async (req, res) => {
  await prisma.save.deleteMany({ where: { postId: req.params.id, userId: req.user.id } });
  res.json({ savedByMe: false });
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  if (existing.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
