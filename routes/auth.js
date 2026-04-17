const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const router = express.Router();

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`/?token=${token}`);
  }
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`/?token=${token}`);
  }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`/?token=${token}`);
  }
);

// Local registration
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      const token = jwt.sign({ id: this.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Local login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(401).json({ error: info.message });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  })(req, res, next);
});

// Get user profile
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    db.get('SELECT id, email, name, tokens, subscription_active, subscription_end FROM users WHERE id = ?',
      [decoded.id], (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    });
  });
});

module.exports = router;