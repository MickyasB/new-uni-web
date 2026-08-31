import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendTelegramAdminAlert } from '../telegram-notify.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email address or password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token: `auth-session-token-${user.id}` });
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, country, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        country: country || 'United Kingdom',
        role: 'STUDENT'
      }
    });

    // Send admin notification via Telegram (non-sensitive fields only)
    sendTelegramAdminAlert({
      fullName: fullName.trim(),
      email: normalizedEmail,
      country: country || 'United Kingdom',
      phone: phone || '',
      eventType: 'New Applicant Registration'
    }).catch(err => console.error('[Telegram Notify] Error:', err.message));

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token: `auth-session-token-${user.id}` });
  } catch (error) {
    next(error);
  }
});

router.get('/profile/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, country: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
