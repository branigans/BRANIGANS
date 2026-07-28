const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { me } = require('../lib/serialize');

const router = express.Router();

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/i;

router.post('/register', async (req, res) => {
  const { email, password, username, displayName } = req.body || {};

  if (!email || !password || !username || !displayName) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'El usuario debe tener 3-20 caracteres (letras, números, _ o .)' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] }
  });
  if (existing) {
    return res.status(409).json({ error: 'Ese email o usuario ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash
    }
  });

  const token = signToken(user);
  res.status(201).json({ token, user: me(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos requeridos' });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = signToken(user);
  res.json({ token, user: me(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: me(req.user) });
});

module.exports = router;
