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

const postInclude = { user: true, garments: true };

router.use(requireAuth, requireActiveSubscription);

router.get('/', async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  const posts = await prisma.post.findMany({
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: postInclude
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
  res.json({ posts: posts.map(serializePost), nextCursor });
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
      include: postInclude
    });

    res.status(201).json({ post: serializePost(created) });
  } catch (err) {
    console.error('[posts] create', err);
    res.status(500).json({ error: 'No se pudo publicar el outfit' });
  }
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  if (existing.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
