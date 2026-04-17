const express = require('express');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db } = require('../database');

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Check if user has subscription or tokens
const checkAccess = (action, callback) => {
  return (req, res, next) => {
    db.get('SELECT tokens, subscription_active FROM users WHERE id = ?', [req.userId], (err, user) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      let cost = 0;
      if (action === 'generate') cost = 1; // 1 token per generation
      else if (action === 'edit') cost = 1; // 1 token per edit

      if (user.subscription_active || user.tokens >= cost) {
        req.user = user;
        req.cost = cost;
        next();
      } else {
        res.status(403).json({ error: 'Insufficient tokens or subscription required' });
      }
    });
  };
};

// Generate game
router.post('/generate', verifyToken, checkAccess('generate'), async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildPrompt(req.body.config);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const gameCode = response.text();

    // Deduct tokens if not subscribed
    if (!req.user.subscription_active) {
      db.run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [req.cost, req.userId]);
      db.run('INSERT INTO usage (user_id, action, tokens_used) VALUES (?, ?, ?)',
        [req.userId, 'generate', req.cost]);
    }

    res.json({ gameCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit game
router.post('/edit', verifyToken, checkAccess('edit'), async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Edit the following game code: ${req.body.gameCode}\n\nChanges: ${req.body.changes}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const editedCode = response.text();

    // Deduct tokens if not subscribed
    if (!req.user.subscription_active) {
      db.run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [req.cost, req.userId]);
      db.run('INSERT INTO usage (user_id, action, tokens_used) VALUES (?, ?, ?)',
        [req.userId, 'edit', req.cost]);
    }

    res.json({ editedCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For subscribers: access to other models
router.post('/generate-advanced', verifyToken, async (req, res) => {
  db.get('SELECT subscription_active FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user || !user.subscription_active) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    // Implement advanced model calls here (OpenAI, Anthropic, etc.)
    // For now, placeholder
    res.json({ message: 'Advanced generation not yet implemented' });
  });
});

function buildPrompt(config) {
  // Simplified prompt building - adapt from existing app.js logic
  return `Create an educational game based on: ${JSON.stringify(config)}`;
}

module.exports = router;