const express = require('express');
const prisma = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const [totalUsers, activeSubscriptions, totalPosts, totalLikes, topPostsRaw] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionStatus: { in: ['active', 'trialing'] } } }),
    prisma.post.count(),
    prisma.like.count(),
    prisma.post.findMany({
      take: 5,
      orderBy: { likes: { _count: 'desc' } },
      include: { user: true, _count: { select: { likes: true } } }
    })
  ]);

  res.json({
    totalUsers,
    activeSubscriptions,
    totalPosts,
    totalLikes,
    topPosts: topPostsRaw.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      likesCount: p._count.likes,
      author: { username: p.user.username, displayName: p.user.displayName }
    }))
  });
});

module.exports = router;
