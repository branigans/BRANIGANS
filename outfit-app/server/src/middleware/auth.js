const jwt = require('jsonwebtoken');
const prisma = require('../db');

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

function requireActiveSubscription(req, res, next) {
  const status = req.user.subscriptionStatus;
  if (status !== 'active' && status !== 'trialing') {
    return res.status(402).json({ error: 'Se requiere una suscripción activa', code: 'SUBSCRIPTION_REQUIRED' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'No autorizado' });
  next();
}

module.exports = { signToken, requireAuth, requireActiveSubscription, requireAdmin };
