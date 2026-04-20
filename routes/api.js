const express = require('express');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('../database');

const router = express.Router();

// ═══════════════════════════════════════════════
// RATE LIMITING — Simple in-memory per-user limiter
// ═══════════════════════════════════════════════

const rateLimiter = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10,      // max requests per window
  store: new Map(),     // userId -> { count, resetAt }

  check(userId) {
    const now = Date.now();
    let entry = this.store.get(userId);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(userId, entry);
    }

    entry.count++;

    if (entry.count > this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true, remaining: this.maxRequests - entry.count };
  },

  // Clean up expired entries every 5 minutes
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  },
};

// Run cleanup periodically
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// Rate limit middleware
const rateLimit = (req, res, next) => {
  const result = rateLimiter.check(req.userId);
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${result.retryAfter}s.` });
  }
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  next();
};

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
const checkAccess = (action) => {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      let cost = 0;
      if (action === 'generate') cost = 1;
      else if (action === 'edit') cost = 1;

      if (user.subscription_active || user.tokens >= cost) {
        req.user = user;
        req.cost = cost;
        next();
      } else {
        res.status(403).json({ error: 'Insufficient tokens or subscription required' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
};

// ═══════════════════════════════════════════════
// PROMPT BUILDER — Server-side mirror of app.js assemblePrompt()
// ═══════════════════════════════════════════════

const TECH_DEFAULTS = {
  framework: 'Vanilla JS/Canvas',
  singleFile: true,
  assetHandling: 'Use placeholder colored rectangles and simple shapes',
  maxTokens: 100000,
};

function buildSystemPrompt() {
  let systemPrompt = `You are an expert Educational Game Developer specialising in creating engaging, pedagogically sound learning games. You combine game design expertise with educational best practices to build games that are both fun and effective for learning.

CORE PRINCIPLES:
- Every game must have a clear educational purpose and learning objective
- Content must be age-appropriate and curriculum-aligned where possible
- Games must provide immediate, constructive feedback on learner responses
- Wrong answers should be learning opportunities — provide hints and explanations, not just "incorrect"
- Difficulty should adapt or progress logically to keep learners in their zone of proximal development
- Include positive reinforcement (celebrations, progress indicators, encouraging messages)
- Ensure accessibility: clear fonts, good contrast, colour-blind safe palettes where possible
- All educational content must be factually accurate and appropriate for the specified age range`;

  systemPrompt += `\n\nYou are proficient in ${TECH_DEFAULTS.framework}.`;
  systemPrompt += '\n\nIMPORTANT: Deliver the ENTIRE game in a SINGLE HTML file including all CSS and JavaScript. Ensure all logic is contained within the file. Do NOT split into separate files.';
  systemPrompt += `\n\nUse ${TECH_DEFAULTS.framework} for rendering and game logic.`;

  return systemPrompt;
}

function buildUserPrompt(config, moduleEnabled) {
  const state = config || {};
  const enabled = moduleEnabled || {
    educationalTopic: true,
    difficulty: true,
    coreIdentity: true,
    mechanics: true,
    visuals: true,
    audio: true,
  };

  let userPrompt = '';

  // Educational Topic
  if (enabled.educationalTopic) {
    const edu = state.educationalTopic || {};
    userPrompt += '**Educational Topic:**\n';
    if (edu.subject) userPrompt += `- Subject: ${edu.subject}\n`;
    if (edu.topic) userPrompt += `- Specific Topic: ${edu.topic}\n`;
    if (edu.learningObjective) userPrompt += `- Learning Objective: ${edu.learningObjective}\n`;
    userPrompt += '\n';
  }

  // Difficulty & Age Range
  if (enabled.difficulty) {
    const diff = state.difficulty || {};
    userPrompt += '**Target Learner:**\n';
    if (diff.ageRange) userPrompt += `- Age Range: ${diff.ageRange}\n`;
    if (diff.difficultyLevel) userPrompt += `- Difficulty Level: ${diff.difficultyLevel}\n`;
    if (diff.accessibility) userPrompt += `- Accessibility Requirements: ${diff.accessibility}\n`;
    userPrompt += '\n';
  }

  // Core Identity
  if (enabled.coreIdentity) {
    const core = state.coreIdentity || {};
    userPrompt += '**Game Concept:**\n';
    if (core.genre) userPrompt += `- Game Type: ${core.genre}\n`;
    if (core.theme) userPrompt += `- Setting/Theme: ${core.theme}\n`;
    const tone = core.tone !== undefined ? core.tone : 50;
    const toneLabel = tone <= 20 ? 'Very Serious/Academic'
      : tone <= 40 ? 'Serious'
      : tone <= 60 ? 'Balanced'
      : tone <= 80 ? 'Playful' : 'Very Playful/Fun';
    userPrompt += `- Tone: ${toneLabel}\n`;
    userPrompt += '\n';
  }

  // Mechanics
  if (enabled.mechanics) {
    const mech = state.mechanics || {};
    userPrompt += '**Gameplay Mechanics:**\n';
    if (mech.tags && mech.tags.length > 0) {
      userPrompt += `- Mechanics: ${mech.tags.join(', ')}\n`;
    }
    if (mech.rules) userPrompt += `- Specific Rules: ${mech.rules}\n`;
    if (mech.difficulty) userPrompt += `- Difficulty Curve: ${mech.difficulty}\n`;
    userPrompt += '\n';
  }

  // Visuals
  if (enabled.visuals) {
    const vis = state.visuals || {};
    userPrompt += '**Visual Requirements:**\n';
    if (vis.artStyle) userPrompt += `- Art Style: ${vis.artStyle}\n`;
    userPrompt += `- Color Palette: Primary ${vis.colorPrimary || '#10b981'}, Secondary ${vis.colorSecondary || '#3b82f6'}, Background ${vis.colorBg || '#f0fdf4'}\n`;
    if (vis.vfx) userPrompt += `- Visual Effects: ${vis.vfx}\n`;
    userPrompt += '\n';
  }

  // Technical Instructions (always included)
  userPrompt += '**Technical Instructions:**\n';
  userPrompt += `- Framework: ${TECH_DEFAULTS.framework}\n`;
  userPrompt += `- Single File: Yes\n`;
  userPrompt += `- Asset Handling: ${TECH_DEFAULTS.assetHandling}\n`;
  userPrompt += '\n';

  // Audio
  if (enabled.audio) {
    const aud = state.audio || {};
    userPrompt += '**Audio & Soundscape:**\n';
    if (aud.musicMood) userPrompt += `- Music Mood: ${aud.musicMood}\n`;
    if (aud.sfx) userPrompt += `- SFX Requirements: ${aud.sfx}\n`;
    userPrompt += '\n';
  }

  // Output Requirements
  userPrompt += '**Output Requirements:**\n';
  userPrompt += '- Generate a complete, playable educational game based on the above specifications.\n';
  userPrompt += '- Include all necessary HTML, CSS, and JavaScript.\n';
  userPrompt += '- Make the game immediately playable with no additional setup.\n';
  userPrompt += '- The game MUST teach the specified subject/topic effectively.\n';
  userPrompt += '- Include clear learning objectives displayed at the start or in a help section.\n';
  userPrompt += '- Provide immediate feedback for every learner action (correct AND incorrect).\n';
  userPrompt += '- When a learner gets something wrong, explain WHY and offer a hint or the correct answer.\n';
  userPrompt += '- Include a scoring/progress system that tracks learning achievement.\n';
  userPrompt += '- Add encouraging messages and positive reinforcement throughout.\n';
  userPrompt += '- Ensure all content is age-appropriate for the specified age range.\n';
  userPrompt += '- Include a simple HUD showing score/progress if applicable.\n';
  userPrompt += '- Make the educational content the core gameplay loop, not an afterthought.\n';

  return userPrompt;
}

function buildPrompt(config, moduleEnabled) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(config, moduleEnabled);
  return { systemPrompt, userPrompt };
}

// ═══════════════════════════════════════════════
// CODE EXTRACTION — Strip markdown fences from LLM output
// ═══════════════════════════════════════════════

function extractCode(response) {
  const patterns = [
    /```html\s*\n([\s\S]*?)```/i,
    /```javascript\s*\n([\s\S]*?)```/i,
    /```js\s*\n([\s\S]*?)```/i,
    /```\s*\n([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const trimmed = response.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<head')) {
    return trimmed;
  }

  return trimmed;
}

// ═══════════════════════════════════════════════
// GENERATE GAME — Uses rich prompt builder
// ═══════════════════════════════════════════════

router.post('/generate', verifyToken, rateLimit, checkAccess('generate'), async (req, res) => {
  try {
    const { config, moduleEnabled, systemPrompt: clientSystemPrompt, userPrompt: clientUserPrompt } = req.body;

    // Use client-provided prompts if available (supports unlocked/custom prompts),
    // otherwise build from config on the server
    let sysPrompt, usrPrompt;
    if (clientSystemPrompt && clientUserPrompt) {
      sysPrompt = clientSystemPrompt;
      usrPrompt = clientUserPrompt;
    } else {
      const built = buildPrompt(config, moduleEnabled);
      sysPrompt = built.systemPrompt;
      usrPrompt = built.userPrompt;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: sysPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will create an educational game following these principles and specifications.' }] },
      { role: 'user', parts: [{ text: usrPrompt }] },
    ]);
    const response = result.response;
    const rawText = response.text();
    const gameCode = extractCode(rawText);

    // Deduct tokens if not subscribed
    if (!req.user.subscription_active) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { tokens: { decrement: req.cost } }
      });
      await prisma.usage.create({
        data: {
          user_id: req.userId,
          action: 'generate',
          tokens_used: req.cost
        }
      });
    }

    res.json({ gameCode });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
// EDIT/REFINE GAME — Server-side with token tracking
// ═══════════════════════════════════════════════

router.post('/edit', verifyToken, rateLimit, checkAccess('edit'), async (req, res) => {
  try {
    const { gameCode, changes, conversationHistory } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build refinement prompt
    const editSystemPrompt = buildSystemPrompt();
    let editContents;

    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Use conversation history for multi-turn refinement
      editContents = [];
      // Add system context as first user message
      editContents.push({ role: 'user', parts: [{ text: editSystemPrompt }] });
      editContents.push({ role: 'model', parts: [{ text: 'Understood. I will refine the educational game while preserving all learning objectives and educational content.' }] });

      // Replay conversation history
      for (const msg of conversationHistory) {
        editContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      // Add the latest refinement instruction
      editContents.push({
        role: 'user',
        parts: [{ text: `Refine the educational game with this change: ${changes}\n\nReturn the COMPLETE updated game code. Do not omit any parts. Ensure all educational content remains accurate and the learning objectives are still met.` }]
      });
    } else {
      // Single-turn edit
      editContents = [
        { role: 'user', parts: [{ text: editSystemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will edit the educational game while preserving all learning objectives.' }] },
        { role: 'user', parts: [{ text: `Edit the following game code.\n\nOriginal code:\n${gameCode}\n\nChanges requested: ${changes}\n\nReturn the COMPLETE updated game code. Do not omit any parts. Ensure all educational content remains accurate and the learning objectives are still met.` }] },
      ];
    }

    const result = await model.generateContent({ contents: editContents });
    const response = result.response;
    const rawText = response.text();
    const editedCode = extractCode(rawText);

    // Deduct tokens if not subscribed
    if (!req.user.subscription_active) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { tokens: { decrement: req.cost } }
      });
      await prisma.usage.create({
        data: {
          user_id: req.userId,
          action: 'edit',
          tokens_used: req.cost
        }
      });
    }

    res.json({ editedCode });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
// ADVANCED GENERATION — OpenAI/Claude for subscribers
// Uses server-side API keys only (never accepts client keys)
// ═══════════════════════════════════════════════

// Allowed base URLs for SSRF protection
const ALLOWED_BASE_URLS = [
  'https://api.openai.com/v1',
  'https://api.anthropic.com/v1',
];

router.post('/generate-advanced', verifyToken, rateLimit, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    if (!user || !user.subscription_active) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    const { config, moduleEnabled, systemPrompt: clientSystemPrompt, userPrompt: clientUserPrompt, provider, model: requestedModel } = req.body;

    // Validate provider
    if (!provider || !['openai', 'claude'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported provider. Use "openai" or "claude".' });
    }

    // Use server-side API keys only — never accept from client
    let apiKey;
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'OpenAI is not configured on the server. Contact support.' });
      }
    } else if (provider === 'claude') {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'Claude is not configured on the server. Contact support.' });
      }
    }

    // Build prompts
    let sysPrompt, usrPrompt;
    if (clientSystemPrompt && clientUserPrompt) {
      sysPrompt = clientSystemPrompt;
      usrPrompt = clientUserPrompt;
    } else {
      const built = buildPrompt(config, moduleEnabled);
      sysPrompt = built.systemPrompt;
      usrPrompt = built.userPrompt;
    }

    const messages = [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: usrPrompt },
    ];

    let gameCode;

    if (provider === 'openai') {
      const baseUrl = 'https://api.openai.com/v1';
      const endpoint = `${baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: requestedModel || 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: 100000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      gameCode = extractCode(rawText);

    } else if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: requestedModel || 'claude-sonnet-4-20250514',
          max_tokens: 100000,
          system: sysPrompt,
          messages: [{ role: 'user', content: usrPrompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text || '';
      gameCode = extractCode(rawText);
    }

    // Record usage
    await prisma.usage.create({
      data: {
        user_id: req.userId,
        action: 'generate-advanced',
        tokens_used: 0, // Subscribers don't use tokens
      }
    });

    res.json({ gameCode });
  } catch (error) {
    console.error('Advanced generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════
// DOWNLOAD UNLOCKED — DRM-free download for subscribers
// ═══════════════════════════════════════════════

router.post('/download-unlocked', verifyToken, rateLimit, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    if (!user || !user.subscription_active) {
      return res.status(403).json({ error: 'Subscription required for unlocked downloads' });
    }

    const { gameCode, filename } = req.body;
    if (!gameCode) {
      return res.status(400).json({ error: 'No game code provided' });
    }

    // Record download
    await prisma.usage.create({
      data: {
        user_id: req.userId,
        action: 'download-unlocked',
        tokens_used: 0,
      }
    });

    // Send the HTML file as a download
    const safeFilename = (filename || 'educational-game').replace(/[^a-z0-9\-]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.html"`);
    res.send(gameCode);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;