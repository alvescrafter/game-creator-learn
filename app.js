/* ═══════════════════════════════════════════════
   Game Creator Learn — Educational Game Prompt Orchestrator
   app.js — Core Logic
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Storage Keys (versioned, separate namespace from original Game Creator) ──
  const KEYS = {
    STATE: 'gameCreatorLearn.state.v1',
    API: 'gameCreatorLearn.api.v1',
    HISTORY: 'gameCreatorLearn.history.v1',
    TEMPLATES: 'gameCreatorLearn.templates.v1',
    THEME: 'gameCreatorLearn.theme.v1',
  };

  const MAX_HISTORY = 50;

  // ── Default State ──
  const DEFAULT_STATE = {
    outputMode: 'single', // 'single' | 'multi'
    educationalTopic: {
      subject: '',
      topic: '',
      learningObjective: '',
    },
    difficulty: {
      ageRange: '',
      difficultyLevel: '',
      accessibility: '',
    },
    coreIdentity: {
      genre: '',
      theme: '',
      tone: 50,
    },
    mechanics: {
      tags: [],
      rules: '',
      difficulty: '',
    },
    visuals: {
      artStyle: '',
      colorPrimary: '#10b981',
      colorSecondary: '#3b82f6',
      colorBg: '#f0fdf4',
      vfx: '',
    },
    audio: {
      musicMood: '',
      sfx: '',
    },
  };

  // ── Background Tech Stack Defaults (not shown in UI) ──
  const TECH_DEFAULTS = {
    framework: 'Vanilla JS/Canvas',
    assetHandling: 'Use CSS shapes, Canvas drawing, emoji, Unicode characters, and generated Web Audio only',
    maxTokens: 100000, // single-file limit; multi-file omits max_tokens entirely
  };

  const GAME_TYPE_GUIDANCE = {
    'Quiz': 'Use a question-first loop with varied question formats, instant explanations, and short rounds.',
    'Practice Challenge': 'Use repeated skill practice with quick feedback, streaks, and a short mastery goal.',
    'Puzzle': 'Use the learning objective as the puzzle logic; each move should demonstrate the concept.',
    'Matching Game': 'Use pairs such as terms/definitions, causes/effects, formulas/examples, or images described with text.',
    'Memory Game': 'Use flip-card recall with small sets, clear matching rules, and short rounds.',
    'Sorting Game': 'Use drag, click, or keyboard sorting into labelled categories with feedback after each placement.',
    'Typing Game': 'Use short typed answers, spelling, vocabulary, formula entry, or code snippets with forgiving validation.',
    'Word Search': 'Use a generated word grid plus clue prompts; keep it keyboard and touch friendly.',
    'Escape Room': 'Use 3-5 educational locks/puzzles, each solved by applying the topic.',
    'Adventure Quiz': 'Use a simple story map where progress is unlocked by correct answers and hints.',
    'Board Game': 'Use a turn-based board with question spaces, simple dice/spinner logic, and visible progress.',
    'Platformer Quiz': 'Use very simple movement; gate progress with questions instead of complex physics.',
    'Racing Quiz': 'Use lane/tap or answer-speed racing; correctness should matter more than reflexes.',
    'Card Game': 'Use educational cards for matching, categorising, sequencing, or choosing evidence.',
    // Legacy saved values from older versions.
    'Platformer': 'Convert this to Platformer Quiz: simple movement with questions as gates; avoid complex physics.',
    'RPG': 'Convert this to Adventure Quiz: lightweight story, choices, and educational challenges; avoid inventory-heavy systems.',
    'Simulation': 'Use a simplified interactive model with 3-5 variables and clear learning feedback.',
    'Adventure': 'Convert this to Adventure Quiz with a small map and educational gates.',
    'Strategy': 'Use a simple turn-based decision game where each choice requires applying the topic.',
    'Racing': 'Convert this to Racing Quiz; correctness should drive progress more than reflex timing.',
    'Idle': 'Convert this to Practice Challenge; avoid passive waiting loops.',
    'Visual Novel': 'Use Dialogue Prompts with embedded questions and decisions.',
    'Clicker': 'Convert this to Practice Challenge; each tap/click must involve a learning decision.',
  };

  const MECHANIC_GUIDANCE = {
    'Multiple Choice': 'Include 3-4 plausible options, explain why the chosen answer is right or wrong.',
    'Type Answer': 'Accept common casing/spacing variants and give hints before marking a learner stuck.',
    'Fill-in-the-Blank': 'Use short blanks and validate against a small list of acceptable answers.',
    'Matching': 'Provide immediate feedback after each pair and keep sets small enough for the age range.',
    'Sorting & Categorisation': 'Use labelled bins/categories and explain any misplaced item.',
    'Sequencing': 'Ask learners to order steps, events, numbers, code, or processes with feedback.',
    'Drag & Drop': 'Also support click/tap selection as a fallback for touch and keyboard users.',
    'Timed Challenge': 'Keep timers optional or generous; never make speed the only way to succeed.',
    'Hint System': 'Offer tiered hints before revealing the answer.',
    'Level Progression': 'Use 3 short levels with steadily deeper questions.',
    'Lives / Attempts': 'Use attempts gently; do not punish learning mistakes harshly.',
    'Collectibles': 'Tie collectibles to correct educational actions, not random movement.',
    'Dialogue Prompts': 'Use dialogue to ask questions or present choices, not just story text.',
    'Spaced Review': 'Revisit missed items later in the same session.',
    'Achievements': 'Award badges for mastery, persistence, and improvement.',
    // Legacy saved values from older versions.
    'Quiz System': 'Use a question-first loop with instant feedback and explanations.',
    'Scoring System': 'Include scoring as part of the mandatory HUD; keep it simple and transparent.',
    'Progress Tracking': 'Include progress as part of the mandatory HUD and final learning summary.',
    'Leveling Up': 'Use Level Progression with short, clearly named levels.',
    'Health Bar': 'Use Lives / Attempts gently; avoid harsh failure states.',
    'Timer': 'Use Timed Challenge with a generous or optional timer.',
    'Dialogue System': 'Use Dialogue Prompts with embedded learning choices.',
    'Physics': 'Keep movement and collisions very simple; prioritise educational questions over physics accuracy.',
    'Procedural Generation': 'Use a predefined question bank with light random ordering; do not generate unbounded content.',
    'Pause Menu': 'Pause Menu is already mandatory; do not add duplicate pause systems.',
    'HUD Display': 'HUD is already mandatory; keep it clear and compact.',
    'Start Screen': 'Start Menu is already mandatory; keep it simple.',
    'Game Over Screen': 'Complete screen is already mandatory; include learning summary.',
    'Lives System': 'Use Lives / Attempts gently; avoid harsh failure states.',
  };

  const DIFFICULTY_CURVE_GUIDANCE = {
    'Gentle Ramp': 'Start with a guided example, then increase one concept at a time.',
    'Steady Progression': 'Increase complexity each round while keeping the interaction pattern consistent.',
    'Adaptive Review': 'If the learner misses an item, give a hint and revisit a similar item later.',
    'Challenge Rounds': 'Add short challenge rounds after practice, with hints still available.',
    // Legacy saved values from older versions.
    'Linear': 'Use Steady Progression.',
    'Exponential': 'Use Challenge Rounds without sudden difficulty spikes.',
    'Adaptive': 'Use Adaptive Review.',
    'S-Curve': 'Use Gentle Ramp, Steady Progression, then a short challenge round.',
  };

  const ART_STYLE_GUIDANCE = {
    'Low-Poly 3D': 'Approximate as Simple 2D Shapes with flat-shaded geometric styling; do not require WebGL.',
    'Simple 2D Shapes': 'Use readable CSS and Canvas shapes with strong contrast and clear labels.',
  };

  const DEFAULT_API = {
    baseUrl: 'https://api.openai.com/v1',
    key: '',
    model: 'gpt-4o',
    temperature: 0.7,
    provider: 'openai',
  };

  // ── Module enabled state (all on by default) ──
  const DEFAULT_MODULE_ENABLED = {
    educationalTopic: true,
    difficulty: true,
    coreIdentity: true,
    mechanics: true,
    visuals: true,
    audio: true,
  };

  // ── Provider Presets ──
  const PROVIDER_PRESETS = {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini'],
      defaultModel: 'gpt-4o',
      needsKey: true,
      apiType: 'openai', // Uses /chat/completions with Bearer token
      supportsModelList: true, // Can fetch /models endpoint
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: ['gemini-2.5-pro-preview-03-25', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultModel: 'gemini-2.0-flash',
      needsKey: true,
      apiType: 'openai', // Google's OpenAI-compatible endpoint
      supportsModelList: true,
    },
    claude: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      defaultModel: 'claude-sonnet-4-20250514',
      needsKey: true,
      apiType: 'anthropic', // Uses /messages with x-api-key header
      supportsModelList: false,
    },
    ollama: {
      baseUrl: 'http://localhost:11434/v1',
      models: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'gemma2', 'phi3', 'qwen2', 'deepseek-coder-v2', 'mixtral'],
      defaultModel: 'llama3.2',
      needsKey: false,
      apiType: 'openai', // Ollama's OpenAI-compatible endpoint
      supportsModelList: true,
    },
    lmstudio: {
      baseUrl: 'http://localhost:1234/v1',
      models: [], // Populated dynamically from server
      defaultModel: '',
      needsKey: false,
      apiType: 'openai', // LM Studio's OpenAI-compatible endpoint
      supportsModelList: true,
    },
    custom: {
      baseUrl: '',
      models: [],
      defaultModel: '',
      needsKey: true, // User decides if key is needed
      apiType: 'openai', // Assumes OpenAI-compatible format
      supportsModelList: true,
    },
  };

  // ── App State ──
  let state = deepClone(DEFAULT_STATE);
  let apiSettings = deepClone(DEFAULT_API);
  let moduleEnabled = deepClone(DEFAULT_MODULE_ENABLED);
  let conversationHistory = []; // for refine feature
  let lastGeneratedCode = ''; // single-file code (for download/refresh)
  let lastGeneratedFiles = null; // multi-file array of {path, content} (for download/refresh)
  let isGenerating = false;
  let promptLocked = true; // prompt is locked by default
  let customPromptText = ''; // stores manually edited prompt when unlocked

  // ═══════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeStateWithDefaults(savedState) {
    const merged = deepClone(DEFAULT_STATE);
    if (!savedState || typeof savedState !== 'object') return merged;

    Object.keys(DEFAULT_STATE).forEach(section => {
      const savedSection = savedState[section];
      if (savedSection && typeof savedSection === 'object' && !Array.isArray(savedSection)) {
        merged[section] = { ...merged[section], ...savedSection };
      }
    });

    if (!Array.isArray(merged.mechanics.tags)) {
      merged.mechanics.tags = [];
    }

    return merged;
  }

  function uid() {
    try { return crypto.randomUUID(); }
    catch { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  }

  function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ═══════════════════════════════════════════════
  // PERSISTENCE (localStorage)
  // ═══════════════════════════════════════════════

  function saveState() {
    try {
      localStorage.setItem(KEYS.STATE, JSON.stringify({ state, moduleEnabled }));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEYS.STATE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state) state = mergeStateWithDefaults(parsed.state);
        if (parsed.moduleEnabled) moduleEnabled = { ...deepClone(DEFAULT_MODULE_ENABLED), ...parsed.moduleEnabled };
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }

  function saveApiSettings() {
    try {
      localStorage.setItem(KEYS.API, JSON.stringify(apiSettings));
    } catch (e) {
      console.warn('Failed to save API settings:', e);
    }
  }

  function loadApiSettings() {
    try {
      const raw = localStorage.getItem(KEYS.API);
      if (raw) {
        apiSettings = { ...deepClone(DEFAULT_API), ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load API settings:', e);
    }
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]'); }
    catch { return []; }
  }

  function writeHistory(list) {
    // Prune to MAX_HISTORY
    if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
    try { localStorage.setItem(KEYS.HISTORY, JSON.stringify(list)); }
    catch (e) { console.warn('Failed to save history:', e); }
  }

  function readTemplates() {
    try { return JSON.parse(localStorage.getItem(KEYS.TEMPLATES) || '[]'); }
    catch { return []; }
  }

  function writeTemplates(list) {
    try { localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(list)); }
    catch (e) { console.warn('Failed to save templates:', e); }
  }

  // ═══════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════

  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ═══════════════════════════════════════════════
  // LOADING OVERLAY
  // ═══════════════════════════════════════════════

  function showLoading(text = 'Generating your educational game...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
  }

  function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  // ═══════════════════════════════════════════════
  // PROMPT ASSEMBLER — EDUCATIONAL GAME FOCUSED
  // ═══════════════════════════════════════════════

  function assemblePrompt() {
    const parts = [];
    const enabled = {};

    // Check which modules are enabled
    document.querySelectorAll('.module-toggle').forEach(cb => {
      enabled[cb.dataset.moduleKey] = cb.checked;
    });

    // ── System Prompt — Educational Game Developer ──
    let systemPrompt = `You are an expert Educational Game Developer specialising in creating engaging, pedagogically sound learning games. You combine game design expertise with educational best practices to build games that are both fun and effective for learning.

CORE PRINCIPLES:
- Every game must have a clear educational purpose and learning objective
- Content must be age-appropriate and curriculum-aligned where possible
- Games must provide immediate, constructive feedback on learner responses
- Wrong answers should be learning opportunities — provide hints and explanations, not just "incorrect"
- Difficulty should adapt or progress logically to keep learners in their zone of proximal development
- Include positive reinforcement (celebrations, progress indicators, encouraging messages)
- Ensure accessibility: clear fonts, good contrast, colour-blind safe palettes where possible
- All educational content must be factually accurate and appropriate for the specified age range
- IMPORTANT: Do NOT exceed 100,000 tokens in your total response. Keep the output concise and efficient while still delivering a complete, playable game. Avoid unnecessary comments, verbose variable names, or redundant code. Prioritise functionality over excessive documentation.

DESIGN RESOLUTION RULES:
- Treat the selected Game Type as the primary loop and the selected Mechanics as supporting interactions.
- If options compete with each other, choose the simpler interaction that best teaches the learning objective.
- Prefer deterministic, testable rules over complex physics, procedural systems, or large simulations.
- Keep the first playable version small: 3-5 rounds or levels, a compact question/content bank, clear win and retry states.
- Every score, collectible, timer, level, card, movement challenge, or puzzle must directly support the educational goal.
- If a user leaves fields blank, make sensible age-appropriate defaults rather than asking follow-up questions.

MANDATORY GAME STRUCTURE — Every game MUST include ALL of the following screens and navigation:

1. START MENU SCREEN:
   - Game title with themed styling
   - "Start Game" / "Play" button (prominent, clearly visible)
   - "How to Play" / "Instructions" button that shows rules and controls
   - "Settings" button (sound toggle, difficulty selector if applicable)
   - Clean, attractive layout that sets the visual tone for the game

2. GAME SCREEN:
   - The main gameplay area with all game mechanics active
   - A HUD (heads-up display) showing: score/progress, lives/health (if applicable), timer (if applicable), current level/round
   - A clearly visible Pause button or icon (top-right corner or similar consistent position)
   - Pressing ESC key MUST open the Pause Menu (this is mandatory)

3. PAUSE MENU (overlay on game screen):
   - "Resume" button to continue playing
   - "Restart" button to restart the current level/game
   - "How to Play" button to review instructions
   - "Main Menu" button to return to the Start Menu
   - Semi-transparent dark overlay behind the menu for visual clarity
   - Pressing ESC while in the Pause Menu should Resume the game

4. GAME OVER / LEVEL COMPLETE SCREEN:
   - Clear display of final score, progress, or learning achievement
   - "Play Again" / "Retry" button
   - "Main Menu" button to return to the Start Menu
   - For educational games: show a summary of what was learned, areas for improvement
   - Positive/encouraging message regardless of performance

5. STANDARDISED BUTTONS — Use consistent, recognisable button styles throughout:
   - Primary action buttons (Start, Resume, Next Level): Bold, coloured, clearly labelled
   - Secondary action buttons (How to Play, Settings): Outlined or lighter style
   - Danger/negative buttons (Quit, Restart): Distinct style (red outline or similar)
   - All buttons must have hover effects and be clearly clickable
   - Minimum button size: 44px height for touch-friendly interaction
   - Use emoji icons alongside text for clarity: ▶️ Start, ⏸️ Pause, 🔄 Restart, 🏠 Menu, ❓ Help, ⚙️ Settings

6. KEYBOARD CONTROLS:
   - ESC key: Opens Pause Menu during gameplay, Resumes from Pause Menu, or returns to previous screen
   - Enter key: Confirms dialog selections
   - Arrow keys / WASD: Movement (for applicable game types)
   - Space: Common action button (jump, select, etc.)
   - All keyboard controls must be documented in the How to Play section

7. RESPONSIVE DESIGN:
   - Game must work on both desktop and mobile screens
   - Touch-friendly buttons for mobile users
   - Canvas/game area should scale appropriately

8. OUTPUT FORMAT:
   - All assets must be generated with code (CSS shapes, canvas drawing, emoji, Unicode characters)
   - No external dependencies, CDN links, or external image/sound files
   - The game must be immediately playable when opened in a browser`;

    // Output-mode-specific instructions
    if (isMultiFileMode()) {
      systemPrompt += `\n\nDELIVER AS SEPARATE FILES: index.html, style.css, and game.js. Output the result as JSON in this exact format:\n{"files": [{"path": "index.html", "content": "..."}, {"path": "style.css", "content": "..."}, {"path": "game.js", "content": "..."}]}\nNo token limit — make the game as detailed and complete as you want. Keep each file focused (HTML structure in index.html, styling in style.css, game logic in game.js).`;
    } else {
      systemPrompt += `\n\nALL HTML, CSS, and JavaScript must be in ONE self-contained .html file. No external dependencies, CDN links, or separate files.`;
    }

    // Always include tech stack context
    systemPrompt += `\n\nYou are proficient in ${TECH_DEFAULTS.framework}.`;
    systemPrompt += `\n\nUse ${TECH_DEFAULTS.framework} for rendering and game logic.`;
    systemPrompt += `\n\nAsset Handling: ${TECH_DEFAULTS.assetHandling}. Do NOT use any external images, sounds, or CDN links. All visuals must be created with CSS, Canvas API drawing, emoji, or Unicode characters. If audio is included, use the Web Audio API only, start it after a user action, and include a mute toggle.`;

    // ── User Prompt: Educational Game Specification ──
    let userPrompt = '';

    // ── Educational Topic (most important — comes first) ──
    if (enabled.educationalTopic) {
      userPrompt += '**Educational Topic:**\n';
      if (state.educationalTopic.subject) userPrompt += `- Subject: ${state.educationalTopic.subject}\n`;
      if (state.educationalTopic.topic) userPrompt += `- Specific Topic: ${state.educationalTopic.topic}\n`;
      if (state.educationalTopic.learningObjective) userPrompt += `- Learning Objective: ${state.educationalTopic.learningObjective}\n`;
      userPrompt += '\n';
    }

    // ── Difficulty & Age Range ──
    if (enabled.difficulty) {
      userPrompt += '**Target Learner:**\n';
      if (state.difficulty.ageRange) userPrompt += `- Age Range: ${state.difficulty.ageRange}\n`;
      if (state.difficulty.difficultyLevel) userPrompt += `- Difficulty Level: ${state.difficulty.difficultyLevel}\n`;
      if (state.difficulty.accessibility) userPrompt += `- Accessibility Requirements: ${state.difficulty.accessibility}\n`;
      userPrompt += '\n';
    }

    // ── Core Identity ──
    if (enabled.coreIdentity) {
      userPrompt += '**Game Concept:**\n';
      if (state.coreIdentity.genre) userPrompt += `- Game Type: ${state.coreIdentity.genre}\n`;
      if (state.coreIdentity.genre && GAME_TYPE_GUIDANCE[state.coreIdentity.genre]) {
        userPrompt += `- Game Type Guidance: ${GAME_TYPE_GUIDANCE[state.coreIdentity.genre]}\n`;
      }
      if (state.coreIdentity.theme) userPrompt += `- Setting/Theme: ${state.coreIdentity.theme}\n`;
      const toneLabel = state.coreIdentity.tone <= 20 ? 'Very Serious/Academic'
        : state.coreIdentity.tone <= 40 ? 'Serious'
        : state.coreIdentity.tone <= 60 ? 'Balanced'
        : state.coreIdentity.tone <= 80 ? 'Playful' : 'Very Playful/Fun';
      userPrompt += `- Tone: ${toneLabel}\n`;
      userPrompt += '\n';
    }

    // ── Mechanics ──
    if (enabled.mechanics) {
      userPrompt += '**Gameplay Mechanics:**\n';
      if (state.mechanics.tags.length > 0) {
        userPrompt += `- Mechanics: ${state.mechanics.tags.join(', ')}\n`;
        const mechanicGuidance = state.mechanics.tags
          .map(tag => MECHANIC_GUIDANCE[tag] ? `${tag}: ${MECHANIC_GUIDANCE[tag]}` : '')
          .filter(Boolean);
        if (mechanicGuidance.length > 0) {
          userPrompt += `- Mechanic Guidance:\n  - ${mechanicGuidance.join('\n  - ')}\n`;
        }
      }
      if (state.mechanics.rules) {
        userPrompt += `- Specific Rules: ${state.mechanics.rules}\n`;
      }
      if (state.mechanics.difficulty) {
        userPrompt += `- Difficulty Curve: ${state.mechanics.difficulty}\n`;
        if (DIFFICULTY_CURVE_GUIDANCE[state.mechanics.difficulty]) {
          userPrompt += `- Difficulty Curve Guidance: ${DIFFICULTY_CURVE_GUIDANCE[state.mechanics.difficulty]}\n`;
        }
      }
      userPrompt += '\n';
    }

    // ── Visuals ──
    if (enabled.visuals) {
      userPrompt += '**Visual Requirements:**\n';
      if (state.visuals.artStyle) userPrompt += `- Art Style: ${state.visuals.artStyle}\n`;
      if (state.visuals.artStyle && ART_STYLE_GUIDANCE[state.visuals.artStyle]) {
        userPrompt += `- Art Style Guidance: ${ART_STYLE_GUIDANCE[state.visuals.artStyle]}\n`;
      }
      userPrompt += `- Color Palette: Primary ${state.visuals.colorPrimary}, Secondary ${state.visuals.colorSecondary}, Background ${state.visuals.colorBg}\n`;
      if (state.visuals.vfx) userPrompt += `- Visual Effects: ${state.visuals.vfx}\n`;
      userPrompt += '\n';
    }

    // Tech stack is always included in background
    userPrompt += '**Technical Instructions:**\n';
    userPrompt += `- Framework: ${TECH_DEFAULTS.framework}\n`;
    userPrompt += `- Output Mode: ${isMultiFileMode() ? 'Multi-File (index.html + style.css + game.js as JSON)' : 'Single self-contained .html file'}\n`;
    userPrompt += `- Asset Handling: ${TECH_DEFAULTS.assetHandling}\n`;
    userPrompt += '\n';

    // ── Audio ──
    if (enabled.audio) {
      userPrompt += '**Audio & Soundscape:**\n';
      if (state.audio.musicMood) {
        userPrompt += `- Music Mood: ${state.audio.musicMood}\n`;
        if (state.audio.musicMood === 'None') {
          userPrompt += '- Audio Guidance: Do not create looping background music. Sound effects may still be used only if requested. Keep the Settings mute toggle.\n';
        } else {
          userPrompt += '- Audio Guidance: Use generated Web Audio only, start audio after the first user action, keep it subtle, and provide a mute toggle.\n';
        }
      }
      if (state.audio.sfx) userPrompt += `- SFX Requirements: ${state.audio.sfx}\n`;
      userPrompt += '\n';
    }

    // Compatibility guardrails come immediately before output requirements.
    userPrompt += '**Option Compatibility Rules:**\n';
    userPrompt += '- Build one clear primary gameplay loop from the selected Game Type.\n';
    userPrompt += '- Use selected Mechanics as supporting features; if more than four are selected, combine or prioritise the four that best teach the learning objective.\n';
    userPrompt += '- Start Menu, HUD, Pause Menu, Settings, scoring/progress, feedback, and completion screens are mandatory even if not selected as mechanics.\n';
    userPrompt += '- Avoid overbuilding: no external assets, no WebGL requirement, no large generated worlds, no passive idle loops, and no complex physics unless absolutely necessary.\n';
    userPrompt += '- The game must remain playable with mouse/touch, and keyboard where applicable.\n';
    userPrompt += '\n';

    userPrompt += '**Output Requirements:**\n';
    userPrompt += '- Generate a complete, playable educational game based on the above specifications.\n';
    if (isMultiFileMode()) {
      userPrompt += '- Deliver as SEPARATE FILES: index.html, style.css, and game.js.\n';
      userPrompt += '- Output the result as JSON: {"files": [{"path": "index.html", "content": "..."}, {"path": "style.css", "content": "..."}, {"path": "game.js", "content": "..."}]}\n';
      userPrompt += '- There is NO token limit — make the game as detailed and complete as you want.\n';
      userPrompt += '- index.html should reference style.css via <link> and game.js via <script src>.\n';
    } else {
      userPrompt += '- Include all necessary HTML, CSS, and JavaScript in a SINGLE self-contained .html file.\n';
    }
    userPrompt += '- Make the game immediately playable when opened in a browser — no build step, no server, no external dependencies.\n';
    userPrompt += '- The game MUST teach the specified subject/topic effectively.\n';
    userPrompt += '- Include clear learning objectives displayed at the start or in a help section.\n';
    userPrompt += '- Provide immediate feedback for every learner action (correct AND incorrect).\n';
    userPrompt += '- When a learner gets something wrong, explain WHY and offer a hint or the correct answer.\n';
    userPrompt += '- Include a scoring/progress system that tracks learning achievement.\n';
    userPrompt += '- Add encouraging messages and positive reinforcement throughout.\n';
    userPrompt += '- Ensure all content is age-appropriate for the specified age range.\n';
    userPrompt += '- Include a HUD showing score/progress, lives, level, and timer where applicable.\n';
    userPrompt += '- Make the educational content the core gameplay loop, not an afterthought.\n';
    userPrompt += '\n';
    userPrompt += '**MANDATORY GAME SCREENS (include ALL of these):**\n';
    userPrompt += '1. START MENU: Title, ▶️ Start Game button, ❓ How to Play button, ⚙️ Settings button\n';
    userPrompt += '2. GAME SCREEN: Main gameplay with HUD (score, lives, level) and ⏸️ Pause button\n';
    userPrompt += '3. PAUSE MENU (ESC key opens this): 🔄 Resume, 🔄 Restart, ❓ How to Play, 🏠 Main Menu\n';
    userPrompt += '4. GAME OVER / COMPLETE SCREEN: Final score, learning summary, 🔄 Play Again, 🏠 Main Menu\n';
    userPrompt += '\n';
    userPrompt += '**KEYBOARD CONTROLS (mandatory):**\n';
    userPrompt += '- ESC key: Opens Pause Menu during gameplay, Resumes from Pause Menu, returns to previous screen\n';
    userPrompt += '- Enter: Confirms selections in menus\n';
    userPrompt += '- Arrow keys / WASD: Movement (for applicable game types)\n';
    userPrompt += '- Space: Common action (jump, select, etc.)\n';
    userPrompt += '- All controls must be documented in the How to Play section\n';
    userPrompt += '\n';
    userPrompt += '**BUTTON STANDARDS:**\n';
    userPrompt += '- All buttons must have hover effects and be clearly clickable (min 44px height)\n';
    userPrompt += '- Use emoji icons with text: ▶️ Start, ⏸️ Pause, 🔄 Restart, 🏠 Menu, ❓ Help, ⚙️ Settings\n';
    userPrompt += '- Primary buttons (Start, Resume): Bold, coloured background\n';
    userPrompt += '- Secondary buttons (How to Play, Settings): Outlined or lighter style\n';
    userPrompt += '- Danger buttons (Quit, Restart): Red/outlined style\n';
    userPrompt += '- Buttons must be touch-friendly for mobile users\n';

    return { systemPrompt, userPrompt };
  }

  function getFullPromptText() {
    // If prompt is unlocked and has custom text, use that
    if (!promptLocked && customPromptText) {
      return customPromptText;
    }
    const { systemPrompt, userPrompt } = assemblePrompt();
    return `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
  }

  // Returns { systemPrompt, userPrompt } for generation,
  // respecting custom edits when prompt is unlocked
  function getPromptForGeneration() {
    if (!promptLocked && customPromptText) {
      // Parse custom text back into system/user sections
      const sysMatch = customPromptText.match(/=== SYSTEM PROMPT ===\n([\s\S]*?)\n=== USER PROMPT ===/);
      const userMatch = customPromptText.match(/=== USER PROMPT ===\n([\s\S]*)/);
      return {
        systemPrompt: sysMatch ? sysMatch[1].trim() : 'You are an expert Educational Game Developer.',
        userPrompt: userMatch ? userMatch[1].trim() : customPromptText,
      };
    }
    return assemblePrompt();
  }

  // ═══════════════════════════════════════════════
  // CONFLICT VALIDATION
  // ═══════════════════════════════════════════════

  function checkConflicts() {
    const conflicts = [];

    // Advanced difficulty with young age range
    if (state.difficulty.difficultyLevel === 'Advanced' || state.difficulty.difficultyLevel === 'Expert') {
      if (state.difficulty.ageRange && (state.difficulty.ageRange.includes('5-8') || state.difficulty.ageRange.includes('9-11'))) {
        conflicts.push('Advanced/Expert difficulty may be too challenging for the selected young age range. Consider lowering difficulty or raising the age range.');
      }
    }

    // Beginner difficulty with University/Masters
    if (state.difficulty.difficultyLevel === 'Beginner') {
      if (state.difficulty.ageRange && (state.difficulty.ageRange.includes('University') || state.difficulty.ageRange.includes('Masters'))) {
        conflicts.push('Beginner difficulty may be too simple for University/Masters level learners. Consider increasing difficulty.');
      }
    }

    // No subject selected but educational topic module enabled
    if (moduleEnabled.educationalTopic && !state.educationalTopic.subject) {
      conflicts.push('No subject selected. The educational game may lack clear learning focus.');
    }

    if (moduleEnabled.mechanics && state.mechanics.tags.length > 4) {
      conflicts.push('More than four mechanics selected. The prompt will prioritise the four that best support the learning objective to keep the game reliable.');
    }

    const actionGameTypes = ['Platformer Quiz', 'Racing Quiz', 'Platformer', 'Racing'];
    if (moduleEnabled.coreIdentity && moduleEnabled.mechanics && actionGameTypes.includes(state.coreIdentity.genre) && state.mechanics.tags.includes('Drag & Drop')) {
      conflicts.push('Drag & Drop can clash with action-style games on mobile. The prompt will require click/tap fallback controls if both are used.');
    }

    return conflicts;
  }

  function displayConflicts() {
    // Remove existing warnings
    document.querySelectorAll('.conflict-warning').forEach(el => el.remove());

    const conflicts = checkConflicts();
    if (conflicts.length === 0) return;

    const sidebar = document.getElementById('sidebar');
    conflicts.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'conflict-warning';
      div.textContent = msg;
      sidebar.insertBefore(div, sidebar.firstChild);
    });
  }

  // ═══════════════════════════════════════════════
  // API CLIENT
  // ═══════════════════════════════════════════════

  // ── Determine API type from current provider ──
  function getApiType() {
    const preset = PROVIDER_PRESETS[apiSettings.provider];
    return preset?.apiType || 'openai';
  }

  // ── Output mode helpers ──
  function isMultiFileMode() {
    return state.outputMode === 'multi';
  }

  // Returns 100000 for single-file mode, null for multi-file mode (omit max_tokens).
  // For Anthropic (Claude) in multi-file mode, returns 200000 since the field is required.
  function getEffectiveMaxTokens() {
    if (isMultiFileMode()) {
      return getApiType() === 'anthropic' ? 200000 : null;
    }
    return TECH_DEFAULTS.maxTokens; // 100000
  }

  // ── Fetch available models from the API ──
  async function fetchAvailableModels() {
    const baseUrl = apiSettings.baseUrl.replace(/\/+$/, '');
    const preset = PROVIDER_PRESETS[apiSettings.provider];

    // Only fetch for providers that support model listing
    if (!preset?.supportsModelList) {
      return preset?.models || [];
    }

    try {
      const headers = {};
      if (apiSettings.key) {
        headers['Authorization'] = `Bearer ${apiSettings.key}`;
      }

      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn('Failed to fetch models:', res.status);
        return preset?.models || [];
      }

      const data = await res.json();
      const modelIds = (data.data || []).map(m => m.id).sort();

      if (modelIds.length > 0) {
        // Update the preset's models list dynamically
        if (preset) preset.models = modelIds;
        return modelIds;
      }

      return preset?.models || [];
    } catch (err) {
      console.warn('Could not fetch models:', err.message);
      return preset?.models || [];
    }
  }

  // ── Test API connection ──
  async function testConnection() {
    const baseUrl = apiSettings.baseUrl.replace(/\/+$/, '');
    const apiType = getApiType();

    try {
      if (apiType === 'anthropic') {
        // Test Claude connection
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiSettings.key,
          'anthropic-version': '2023-06-01',
        };
        const res = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            model: apiSettings.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          throw new Error(`API Error ${res.status}: ${errText}`);
        }
        return { success: true, message: '✅ Claude API connected successfully!' };
      } else {
        // Test OpenAI-compatible connection
        const headers = {
          'Content-Type': 'application/json',
        };
        if (apiSettings.key) {
          headers['Authorization'] = `Bearer ${apiSettings.key}`;
        }
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            model: apiSettings.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
            temperature: 0.1,
          }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          throw new Error(`API Error ${res.status}: ${errText}`);
        }
        return { success: true, message: '✅ API connected successfully!' };
      }
    } catch (err) {
      return { success: false, message: `❌ Connection failed: ${err.message}` };
    }
  }

  async function callLLM(messages) {
    const baseUrl = apiSettings.baseUrl.replace(/\/+$/, ''); // trim trailing slash
    const apiType = getApiType();

    // ── Anthropic Claude native API ──
    if (apiType === 'anthropic') {
      const endpoint = `${baseUrl}/messages`;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiSettings.key,
        'anthropic-version': '2023-06-01',
      };

      // Convert OpenAI-style messages to Anthropic format
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const body = {
        model: apiSettings.model,
        max_tokens: getEffectiveMaxTokens() || 200000, // Claude requires the field; multi-file uses 200000
        messages: chatMessages,
      };
      if (systemMsg) body.system = systemMsg.content;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`API Error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.content?.[0]?.text;
      if (!content) throw new Error('API returned empty response');
      return content;
    }

    // ── OpenAI-compatible API (OpenAI, Gemini, Ollama, LM Studio) ──
    const endpoint = `${baseUrl}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiSettings.key) {
      headers['Authorization'] = `Bearer ${apiSettings.key}`;
    }

    const maxTokens = getEffectiveMaxTokens();

    const body = {
      model: apiSettings.model,
      messages,
      temperature: parseFloat(apiSettings.temperature) || 0.7,
    };
    // Omit max_tokens entirely in multi-file mode (null) to let the provider use its default/maximum.
    // Single-file mode sends 100000.
    if (maxTokens !== null) {
      body.max_tokens = maxTokens;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('API returned empty response');
    return content;
  }

  // ═══════════════════════════════════════════════
  // STREAMING API CLIENT — async generator yielding content chunks
  // ═══════════════════════════════════════════════

  async function* callLLMStream(messages) {
    const baseUrl = apiSettings.baseUrl.replace(/\/+$/, '');
    const apiType = getApiType();
    const maxTokens = getEffectiveMaxTokens();

    // ── Anthropic Claude native API (SSE) ──
    if (apiType === 'anthropic') {
      const endpoint = `${baseUrl}/messages`;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiSettings.key,
        'anthropic-version': '2023-06-01',
      };

      const systemMsg = messages.find(m => m.role === 'system');
      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const body = {
        model: apiSettings.model,
        max_tokens: maxTokens || 200000, // Claude requires the field; multi-file uses 200000
        messages: chatMessages,
        stream: true,
      };
      if (systemMsg) body.system = systemMsg.content;
      if (apiSettings.temperature != null) body.temperature = parseFloat(apiSettings.temperature);

      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`API Error ${res.status}: ${errText}`);
      }

      // Fallback: not SSE → parse as JSON and yield entire content at once
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const data = await res.json();
        const content = data.content?.[0]?.text;
        if (!content) throw new Error('API returned empty response');
        yield content;
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const evt = JSON.parse(dataStr);
            // content_block_delta events carry delta.text
            if (evt.type === 'content_block_delta' && evt.delta && evt.delta.text) {
              yield evt.delta.text;
            }
          } catch { /* ignore malformed */ }
        }
      }
      return;
    }

    // ── OpenAI-compatible API (OpenAI, Gemini, Ollama, LM Studio, Custom) ──
    const endpoint = `${baseUrl}/chat/completions`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiSettings.key) headers['Authorization'] = `Bearer ${apiSettings.key}`;

    const body = {
      model: apiSettings.model,
      messages,
      temperature: parseFloat(apiSettings.temperature) || 0.7,
      stream: true,
    };
    // Omit max_tokens entirely in multi-file mode (null). Single-file sends 100000.
    if (maxTokens !== null) body.max_tokens = maxTokens;

    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`API Error ${res.status}: ${errText}`);
    }

    // Fallback: not SSE → parse as JSON and yield entire content at once
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('API returned empty response');
      yield content;
      return;
    }

    // Parse SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const evt = JSON.parse(dataStr);
          const delta = evt.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch { /* ignore malformed */ }
      }
    }
  }

  // ═══════════════════════════════════════════════
  // LIVE VIEW — real-time streaming display
  // ═══════════════════════════════════════════════

  let liveViewBuffer = '';
  let liveViewCodeStarted = false;
  let liveViewBoundaryIndex = -1;

  function liveViewStart() {
    liveViewBuffer = '';
    liveViewCodeStarted = false;
    liveViewBoundaryIndex = -1;
    const thinking = document.getElementById('liveview-thinking');
    const code = document.getElementById('liveview-code');
    const stats = document.getElementById('liveview-stats');
    const placeholder = document.getElementById('liveview-placeholder');
    if (thinking) thinking.textContent = '';
    if (code) code.textContent = '';
    if (stats) stats.textContent = '0 lines · 0 chars';
    if (placeholder) placeholder.classList.add('hidden');
    liveViewSetStatus('thinking', '⏳ Thinking...');
    switchTab('liveview');
  }

  function liveViewAppendChunk(chunk) {
    liveViewBuffer += chunk;
    const thinking = document.getElementById('liveview-thinking');
    const code = document.getElementById('liveview-code');
    const stats = document.getElementById('liveview-stats');
    if (!thinking || !code) return;

    // Detect code boundary if not yet started
    if (!liveViewCodeStarted) {
      const boundary = detectCodeBoundary(liveViewBuffer);
      if (boundary !== -1) {
        liveViewCodeStarted = true;
        liveViewBoundaryIndex = boundary;
        const thinkingText = liveViewBuffer.slice(0, boundary);
        const codeText = liveViewBuffer.slice(boundary);
        thinking.textContent = thinkingText;
        code.textContent = codeText;
        liveViewSetStatus('building', '💻 Building code...');
      } else {
        // Still in thinking phase
        thinking.textContent = liveViewBuffer;
      }
    } else {
      // Already in code phase — show everything from boundary onward
      code.textContent = liveViewBuffer.slice(liveViewBoundaryIndex);
    }

    // Update live stats for code section
    if (liveViewCodeStarted) {
      const codeText = code.textContent;
      const lines = codeText.split('\n').length;
      const chars = codeText.length;
      if (stats) stats.textContent = `${lines} lines · ${chars} chars`;
    }

    // Auto-scroll both sections to bottom
    autoScrollLiveView();
  }

  // Detects the index in the buffer where code begins. Returns -1 if no boundary yet.
  function detectCodeBoundary(buffer) {
    const patterns = [
      '<!DOCTYPE',
      '<html',
      '<head',
      ' ```html',
      ' ```json',
      '```html',
      '```json',
      '{"files":',
      '{"files" :',
      '{ "files"',
    ];
    for (const p of patterns) {
      const idx = buffer.indexOf(p);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  function autoScrollLiveView() {
    const thinking = document.getElementById('liveview-thinking');
    const code = document.getElementById('liveview-code');
    if (thinking) thinking.scrollTop = thinking.scrollHeight;
    if (code) code.scrollTop = code.scrollHeight;
  }

  function liveViewFinish() {
    liveViewSetStatus('complete', '✅ Complete');
  }

  function liveViewError(msg) {
    liveViewSetStatus('error', '❌ Error');
    const thinking = document.getElementById('liveview-thinking');
    if (thinking) {
      thinking.textContent += (thinking.textContent ? '\n\n' : '') + `❌ ${msg}`;
    }
  }

  function liveViewClear() {
    liveViewBuffer = '';
    liveViewCodeStarted = false;
    liveViewBoundaryIndex = -1;
    const thinking = document.getElementById('liveview-thinking');
    const code = document.getElementById('liveview-code');
    const stats = document.getElementById('liveview-stats');
    const placeholder = document.getElementById('liveview-placeholder');
    if (thinking) thinking.textContent = '';
    if (code) code.textContent = '';
    if (stats) stats.textContent = '0 lines · 0 chars';
    if (placeholder) placeholder.classList.remove('hidden');
    liveViewSetStatus('idle', '⚪ Idle');
  }

  function liveViewSetStatus(type, text) {
    const status = document.getElementById('liveview-status');
    if (!status) return;
    status.textContent = text;
    status.className = 'liveview-status status-' + type;
  }

  // ═══════════════════════════════════════════════
  // CODE EXTRACTION
  // ═══════════════════════════════════════════════

  function extractCode(response) {
    // Try to extract from markdown code fences
    // Patterns: ```html ... ```, ```javascript ... ```, ``` ... ```
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

    // If no fences found, check if the response looks like HTML
    const trimmed = response.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<head')) {
      return trimmed;
    }

    // Last resort: return the whole response
    return trimmed;
  }

  // ═══════════════════════════════════════════════
  // IFRAME RENDERING
  // ═══════════════════════════════════════════════

  function renderInIframe(code) {
    const iframe = document.getElementById('game-iframe');
    const placeholder = document.getElementById('iframe-placeholder');
    const errorPanel = document.getElementById('error-panel');

    // Hide error panel by default
    if (errorPanel) errorPanel.classList.add('hidden');

    try {
      // Use srcdoc for normal-sized code
      iframe.srcdoc = code;
      placeholder.classList.add('hidden');
      lastGeneratedCode = code;

      // Switch to sandbox tab
      switchTab('sandbox');

      // Listen for iframe errors
      iframe.onload = function() {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          // Check if the iframe content looks like it has an error (empty body or error text)
          if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.trim() === '') {
            // The page loaded but is empty — might still be rendering
          }
        } catch (e) {
          // Cross-origin — can't inspect, which is fine
        }
      };
    } catch (e) {
      // Fallback to Blob URL for very large code
      try {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        iframe.removeAttribute('srcdoc');
        placeholder.classList.add('hidden');
        lastGeneratedCode = code;
        switchTab('sandbox');
      } catch (e2) {
        showToast('Failed to render game: ' + e2.message, 'error');
        showErrorInPanel('Failed to render game: ' + e2.message);
      }
    }
  }

  function showErrorInPanel(message) {
    const errorPanel = document.getElementById('error-panel');
    const errorText = document.getElementById('error-text');
    if (errorPanel && errorText) {
      errorText.textContent = message;
      errorPanel.classList.remove('hidden');
    }
  }

  // ═══════════════════════════════════════════════
  // MULTI-FILE CODE EXTRACTION
  // ═══════════════════════════════════════════════

  // Strip markdown code fences from a response string
  function stripMarkdownFences(response) {
    // Remove opening fence ```json / ```html / ``` and closing ```
    const fenceMatch = response.match(/```(?:json|html|javascript|js)?\s*\n([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
    return response.trim();
  }

  // Extract multi-file output: {files: [{path, content}]} from the AI response.
  // Fallbacks: regex extraction of {"files":...}, then single-file wrap.
  function extractMultiFileCode(response) {
    let cleaned = stripMarkdownFences(response);

    // Attempt 1: direct JSON.parse
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.files)) {
        return validateAndNormaliseFiles(parsed.files);
      }
    } catch { /* continue to fallbacks */ }

    // Attempt 2: regex extraction of {"files": ...}
    const jsonMatch = cleaned.match(/\{\s*"files"\s*:\s*\[[\s\S]*?\]\s*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && Array.isArray(parsed.files)) {
          return validateAndNormaliseFiles(parsed.files);
        }
      } catch { /* continue */ }
    }

    // Attempt 3: single-file wrap — treat the whole response as one HTML file
    const html = extractCode(response);
    return validateAndNormaliseFiles([
      { path: 'index.html', content: html },
      { path: 'style.css', content: '/* inlined into index.html */' },
      { path: 'game.js', content: '// inlined into index.html' },
    ]);
  }

  // Ensure required files exist (index.html, style.css, game.js). Normalise to {path, content}.
  function validateAndNormaliseFiles(files) {
    const normalised = files.map(f => ({
      path: f.path || f.name || 'unknown.txt',
      content: f.content != null ? String(f.content) : '',
    }));

    const required = ['index.html', 'style.css', 'game.js'];
    for (const req of required) {
      if (!normalised.some(f => f.path === req || f.path.endsWith('/' + req))) {
        // Missing required file — add a stub so rendering doesn't break
        normalised.push({ path: req, content: `/* ${req} not provided by AI */` });
      }
    }
    return normalised;
  }

  // ═══════════════════════════════════════════════
  // MULTI-FILE IFRAME RENDERING
  // ═══════════════════════════════════════════════

  // Find a file in the files array by path (exact or ending match)
  function findFile(files, name) {
    return files.find(f => f.path === name || f.path.endsWith('/' + name));
  }

  // Render multi-file output in the iframe by inlining CSS via <style> and JS via <script>.
  // Also populates the file browser. Handles asset references by replacing with placeholder data URIs.
  function renderMultiFileInIframe(files) {
    const iframe = document.getElementById('game-iframe');
    const placeholder = document.getElementById('iframe-placeholder');
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) errorPanel.classList.add('hidden');

    const htmlFile = findFile(files, 'index.html');
    const cssFile = findFile(files, 'style.css');
    const jsFile = findFile(files, 'game.js');

    let html = htmlFile ? htmlFile.content : '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h1>index.html missing</h1></body></html>';
    const css = cssFile ? cssFile.content : '';
    const js = jsFile ? jsFile.content : '';

    // Replace <link rel="stylesheet" href="style.css"> with inline <style>
    html = html.replace(/<link[^>]*href=["'](?:\.\/)?style\.css["'][^>]*>/gi, `<style>\n${css}\n</style>`);
    // Replace <script src="game.js"></script> with inline <script>
    html = html.replace(/<script[^>]*src=["'](?:\.\/)?game\.js["'][^>]*><\/script>/gi, `<script>\n${js}\n</script>`);

    // If the HTML didn't have explicit link/script tags, inject the CSS and JS
    if (css && !html.includes('<style>')) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      } else if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n<style>\n${css}\n</style>`);
      } else {
        html = `<style>\n${css}\n</style>\n` + html;
      }
    }
    if (js && !html.includes('<script>')) {
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
      } else {
        html = html + `\n<script>\n${js}\n</script>`;
      }
    }

    // Handle asset references: replace <img src="..."> and url(...) with placeholder data URIs
    const placeholderImg = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#10b981"/><text x="32" y="36" font-size="10" text-anchor="middle" fill="white">asset</text></svg>');
    html = html.replace(/<img([^>]*?)src=["'](?!data:)([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
      return `<img${before}src="${placeholderImg}"${after}>`;
    });
    html = html.replace(/url\((?!data:)(["']?)([^"')]+)\1\)/gi, `url("${placeholderImg}")`);

    try {
      iframe.srcdoc = html;
      iframe.removeAttribute('src');
      placeholder.classList.add('hidden');
      lastGeneratedFiles = files;
      lastGeneratedCode = html; // keep for fallback refresh
      populateFileBrowser(files);
      switchTab('sandbox');
    } catch (e) {
      try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        iframe.removeAttribute('srcdoc');
        placeholder.classList.add('hidden');
        lastGeneratedFiles = files;
        lastGeneratedCode = html;
        populateFileBrowser(files);
        switchTab('sandbox');
      } catch (e2) {
        showToast('Failed to render multi-file game: ' + e2.message, 'error');
        showErrorInPanel('Failed to render multi-file game: ' + e2.message);
      }
    }
  }

  // ═══════════════════════════════════════════════
  // FILE BROWSER (Files panel)
  // ═══════════════════════════════════════════════

  function fileIcon(path) {
    if (path.endsWith('.html') || path.endsWith('.htm')) return '🌐';
    if (path.endsWith('.css')) return '🎨';
    if (path.endsWith('.js')) return '⚙️';
    if (path.endsWith('.json')) return '📋';
    return '📄';
  }

  function populateFileBrowser(files) {
    const list = document.getElementById('file-list');
    const viewer = document.getElementById('file-viewer-content');
    if (!list || !viewer) return;

    list.innerHTML = '';
    files.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'file-item' + (idx === 0 ? ' active' : '');
      item.dataset.path = file.path;
      item.innerHTML = `<span class="file-item-icon">${fileIcon(file.path)}</span><span class="file-item-name">${escapeHtml(file.path)}</span>`;
      item.addEventListener('click', () => {
        document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        showFileInViewer(file);
      });
      list.appendChild(item);
    });

    // Show first file by default
    if (files.length > 0) showFileInViewer(files[0]);
    else viewer.innerHTML = '<p class="placeholder">No files to display.</p>';
  }

  function showFileInViewer(file) {
    const viewer = document.getElementById('file-viewer-content');
    if (!viewer) return;
    const content = file.content || '';
    const lines = content.split('\n').length;
    const chars = content.length;
    viewer.innerHTML = '';
    const header = document.createElement('div');
    header.style.cssText = 'padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:0.75rem;';
    header.textContent = `${file.path} — ${lines} lines · ${chars} chars`;
    const pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre;tab-size:2;';
    pre.textContent = content;
    viewer.appendChild(header);
    viewer.appendChild(pre);
  }

  // ═══════════════════════════════════════════════
  // MULTI-FILE VALIDATION
  // ═══════════════════════════════════════════════

  function validateMultiFileGame(files) {
    const issues = [];
    const htmlFile = findFile(files, 'index.html');
    const cssFile = findFile(files, 'style.css');
    const jsFile = findFile(files, 'game.js');

    if (!htmlFile) issues.push('index.html is missing');
    if (!cssFile) issues.push('style.css is missing');
    if (!jsFile) issues.push('game.js is missing');

    if (htmlFile) {
      const html = htmlFile.content || '';
      if (html.trim().length === 0) issues.push('index.html is empty');
      if (cssFile && !html.includes('style.css') && !html.includes('<style>')) {
        issues.push('index.html does not reference style.css');
      }
      if (jsFile && !html.includes('game.js') && !html.includes('<script>')) {
        issues.push('index.html does not reference game.js');
      }
    }

    if (jsFile) {
      const js = jsFile.content || '';
      if (js.trim().length === 0) issues.push('game.js is empty');
      if (!/canvas/i.test(js) && !/document\.(getElementById|querySelector)/i.test(js)) {
        issues.push('game.js may not set up a canvas or game container');
      }
      if (!/requestAnimationFrame|setInterval|setTimeout/i.test(js)) {
        issues.push('game.js may not have a game loop (requestAnimationFrame/setInterval)');
      }
      if (!/addEventListener/i.test(js)) {
        issues.push('game.js has no event listeners');
      }
    }

    return issues;
  }

  // ═══════════════════════════════════════════════
  // DOWNLOAD — dispatcher + single-file + multi-file ZIP
  // ═══════════════════════════════════════════════

  function downloadGame() {
    if (isMultiFileMode()) {
      downloadZIP();
    } else {
      downloadHTML();
    }
  }

  function downloadZIP() {
    if (!lastGeneratedFiles || lastGeneratedFiles.length === 0) {
      showToast('No files to download. Generate a game first!', 'warning');
      return;
    }
    loadJSZip().then((JSZip) => {
      const zip = new JSZip();
      lastGeneratedFiles.forEach(file => {
        // Preserve folder structure: split path into folders + filename
        const path = file.path.replace(/^\.?\//, ''); // strip leading ./ or /
        zip.file(path, file.content || '');
      });
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const subject = state.educationalTopic.subject || 'edu';
        const topic = state.educationalTopic.topic || 'game';
        a.download = `${subject.toLowerCase()}-${topic.toLowerCase().replace(/\s+/g, '-')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('ZIP downloaded! 💾', 'success');
      }).catch((err) => {
        showToast('Failed to create ZIP: ' + err.message, 'error');
      });
    }).catch((err) => {
      showToast('Failed to load JSZip library: ' + err.message, 'error');
    });
  }

  // Dynamically load JSZip from CDN. Returns a Promise that resolves with the JSZip constructor.
  function loadJSZip() {
    return new Promise((resolve, reject) => {
      if (window.JSZip) { resolve(window.JSZip); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => {
        if (window.JSZip) resolve(window.JSZip);
        else reject(new Error('JSZip failed to initialise'));
      };
      script.onerror = () => reject(new Error('Could not load JSZip from CDN'));
      document.head.appendChild(script);
    });
  }

  function hideErrorPanel() {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) errorPanel.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════
  // GENERATE GAME
  // ═══════════════════════════════════════════════

  async function generateGame() {
    if (isGenerating) return;

    // Validate API settings
    if (!apiSettings.baseUrl) {
      showToast('Please configure API settings first (⚙️)', 'warning');
      openModal('modal-settings');
      return;
    }

    // Check for conflicts
    const conflicts = checkConflicts();
    if (conflicts.length > 0) {
      // Show conflicts but allow user to proceed
      displayConflicts();
    }

    isGenerating = true;
    // NO loading overlay — Live View provides real-time feedback instead
    hideErrorPanel();
    document.getElementById('btn-generate').disabled = true;

    try {
      const { systemPrompt, userPrompt } = getPromptForGeneration();

      // Build conversation
      conversationHistory = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // Start live view (switches to Live View tab)
      liveViewStart();

      // Stream the response
      let response = '';
      for await (const chunk of callLLMStream(conversationHistory)) {
        response += chunk;
        liveViewAppendChunk(chunk);
      }
      conversationHistory.push({ role: 'assistant', content: response });
      liveViewFinish();

      if (!response || response.trim().length === 0) {
        throw new Error('The AI returned an empty response. Try adjusting your settings or prompt.');
      }

      if (isMultiFileMode()) {
        const files = extractMultiFileCode(response);
        renderMultiFileInIframe(files);
        const issues = validateMultiFileGame(files);
        if (issues.length > 0) {
          console.warn('Multi-file validation issues:', issues);
          showToast('Game generated with notes: ' + issues.join('; '), 'warning', 5000);
        }
        saveToHistory(null, false, files);
      } else {
        const code = extractCode(response);
        if (!code || code.trim().length === 0) {
          throw new Error('The AI returned no playable code. Try adjusting your settings or prompt.');
        }
        renderInIframe(code);
        saveToHistory(code);
      }

      showToast('Educational game generated successfully! 🎓', 'success');
    } catch (err) {
      console.error('Generation failed:', err);
      liveViewError(err.message);
      showToast('Generation failed: ' + err.message, 'error', 5000);
      showErrorInPanel('Generation failed: ' + err.message);
    } finally {
      isGenerating = false;
      document.getElementById('btn-generate').disabled = false;
    }
  }

  // ═══════════════════════════════════════════════
  // REFINE FEATURE
  // ═══════════════════════════════════════════════

  async function refineGame(instruction) {
    if (isGenerating) return;
    if (!conversationHistory.length) {
      showToast('Generate a game first before refining', 'warning');
      return;
    }

    isGenerating = true;
    // NO loading overlay — Live View provides real-time feedback instead
    hideErrorPanel();
    document.getElementById('btn-refine').disabled = true;

    try {
      // Build refinement instruction. For multi-file, include current files as JSON.
      let refineContent = `Refine the educational game with this change: ${instruction}\n\nReturn the COMPLETE updated game code. Do not omit any parts. Ensure all educational content remains accurate and the learning objectives are still met.`;
      if (isMultiFileMode() && lastGeneratedFiles) {
        refineContent += `\n\nHere are the current files as JSON. Update them with the requested changes and return the COMPLETE set of files in the same JSON format:\n\`\`\`json\n${JSON.stringify({ files: lastGeneratedFiles }, null, 2)}\n\`\`\``;
      }

      conversationHistory.push({ role: 'user', content: refineContent });

      // Start live view (switches to Live View tab)
      liveViewStart();

      // Stream the response
      let response = '';
      for await (const chunk of callLLMStream(conversationHistory)) {
        response += chunk;
        liveViewAppendChunk(chunk);
      }
      conversationHistory.push({ role: 'assistant', content: response });
      liveViewFinish();

      if (!response || response.trim().length === 0) {
        throw new Error('The AI returned an empty response. Try rephrasing your refinement.');
      }

      if (isMultiFileMode()) {
        const files = extractMultiFileCode(response);
        renderMultiFileInIframe(files);
        const issues = validateMultiFileGame(files);
        if (issues.length > 0) {
          console.warn('Multi-file validation issues:', issues);
          showToast('Game refined with notes: ' + issues.join('; '), 'warning', 5000);
        }
        saveToHistory(null, true, files);
      } else {
        const code = extractCode(response);
        if (!code || code.trim().length === 0) {
          throw new Error('The AI returned no playable code. Try rephrasing your refinement.');
        }
        renderInIframe(code);
        saveToHistory(code, true);
      }

      showToast('Educational game refined! 🔄', 'success');
      document.getElementById('refine-input').value = '';
    } catch (err) {
      console.error('Refine failed:', err);
      liveViewError(err.message);
      showToast('Refine failed: ' + err.message, 'error', 5000);
      showErrorInPanel('Refine failed: ' + err.message);
    } finally {
      isGenerating = false;
      document.getElementById('btn-refine').disabled = false;
    }
  }

  // ═══════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════

  function saveToHistory(code, isRefine = false, files = null) {
    const list = readHistory();
    const subject = state.educationalTopic.subject || 'Unknown';
    const topic = state.educationalTopic.topic || 'Untitled';
    const genre = state.coreIdentity.genre || '';

    const entry = {
      id: uid(),
      title: `${subject} — ${topic}${genre ? ' (' + genre + ')' : ''}`,
      subject,
      topic,
      genre,
      // Single-file: store code. Multi-file: store files array. Backward compat: old entries without outputMode are single-file.
      code: files ? null : code,
      files: files ? deepClone(files) : null,
      outputMode: state.outputMode || 'single',
      config: deepClone(state),
      moduleEnabled: deepClone(moduleEnabled),
      timestamp: Date.now(),
      isRefine,
    };

    list.unshift(entry);
    writeHistory(list);
  }

  function renderHistory() {
    const list = readHistory();
    const container = document.getElementById('history-list');

    if (list.length === 0) {
      container.innerHTML = '<p class="placeholder">No generations yet. Create your first educational game!</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-info">
          <div class="history-title">${escapeHtml(item.title)}</div>
          <div class="history-meta">${formatTimestamp(item.timestamp)}${item.isRefine ? ' · Refined' : ''}</div>
        </div>
        <div class="history-actions">
          <button class="btn btn-sm" onclick="window.__loadHistory('${item.id}')" title="Load this game">📂 Load</button>
          <button class="btn btn-sm btn-danger" onclick="window.__deleteHistory('${item.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  function loadHistoryItem(id) {
    const list = readHistory();
    const item = list.find(h => h.id === id);
    if (!item) {
      showToast('History item not found', 'error');
      return;
    }

    // Restore config
    state = mergeStateWithDefaults(item.config);
    moduleEnabled = { ...deepClone(DEFAULT_MODULE_ENABLED), ...item.moduleEnabled };

    // Restore code/files to iframe (backward compat: entries without outputMode treated as single-file)
    const mode = item.outputMode || 'single';
    if (mode === 'multi' && item.files && item.files.length > 0) {
      lastGeneratedFiles = item.files;
      lastGeneratedCode = '';
      renderMultiFileInIframe(item.files);
    } else if (item.code) {
      lastGeneratedCode = item.code;
      lastGeneratedFiles = null;
      renderInIframe(item.code);
    }

    // Update UI fields
    syncUIFromState();
    updatePromptPreview();
    saveState();

    closeModal('modal-history');
    showToast('Loaded: ' + item.title, 'success');
  }

  function deleteHistoryItem(id) {
    let list = readHistory();
    list = list.filter(h => h.id !== id);
    writeHistory(list);
    renderHistory();
    showToast('History item deleted', 'info');
  }

  function clearHistory() {
    if (!confirm('Delete all generation history? This cannot be undone.')) return;
    writeHistory([]);
    renderHistory();
    showToast('History cleared', 'info');
  }

  // ═══════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════

  function saveTemplate() {
    const name = prompt('Template name:');
    if (!name) return;

    const list = readTemplates();
    list.unshift({
      id: uid(),
      name,
      config: deepClone(state),
      moduleEnabled: deepClone(moduleEnabled),
      timestamp: Date.now(),
    });
    writeTemplates(list);
    renderTemplates();
    showToast('Template saved: ' + name, 'success');
  }

  function renderTemplates() {
    const list = readTemplates();
    const container = document.getElementById('template-list');

    if (list.length === 0) {
      container.innerHTML = '<p class="placeholder">No saved templates yet. Configure your modules and save!</p>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="template-item" data-id="${item.id}">
        <div class="template-info">
          <div class="template-title">${escapeHtml(item.name)}</div>
          <div class="template-meta">${formatTimestamp(item.timestamp)}</div>
        </div>
        <div class="template-actions-bar">
          <button class="btn btn-sm" onclick="window.__loadTemplate('${item.id}')" title="Load template">📂 Load</button>
          <button class="btn btn-sm btn-danger" onclick="window.__deleteTemplate('${item.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  function loadTemplate(id) {
    const list = readTemplates();
    const item = list.find(t => t.id === id);
    if (!item) {
      showToast('Template not found', 'error');
      return;
    }

    state = mergeStateWithDefaults(item.config);
    moduleEnabled = { ...deepClone(DEFAULT_MODULE_ENABLED), ...item.moduleEnabled };

    syncUIFromState();
    updatePromptPreview();
    saveState();

    closeModal('modal-templates');
    showToast('Template loaded: ' + item.name, 'success');
  }

  function deleteTemplate(id) {
    let list = readTemplates();
    list = list.filter(t => t.id !== id);
    writeTemplates(list);
    renderTemplates();
    showToast('Template deleted', 'info');
  }

  // ═══════════════════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════════════════

  function downloadHTML() {
    if (!lastGeneratedCode) {
      showToast('No game to download. Generate one first!', 'warning');
      return;
    }

    const blob = new Blob([lastGeneratedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const subject = state.educationalTopic.subject || 'edu';
    const topic = state.educationalTopic.topic || 'game';
    a.download = `${subject.toLowerCase()}-${topic.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Educational game downloaded! 💾', 'success');
  }

  // ═══════════════════════════════════════════════
  // UI SYNC
  // ═══════════════════════════════════════════════

  function syncUIFromState() {
    // Sync all data-path fields
    document.querySelectorAll('[data-path]').forEach(el => {
      const path = el.dataset.path;
      const value = getNestedValue(state, path);
      if (value === undefined || value === null) return;

      if (el.type === 'checkbox') {
        el.checked = !!value;
      } else {
        el.value = value;
      }
    });

    // Sync module toggles
    document.querySelectorAll('.module-toggle').forEach(cb => {
      cb.checked = !!moduleEnabled[cb.dataset.moduleKey];
    });

    // Sync mechanics tags
    document.querySelectorAll('#mechanics-tags .tag-btn').forEach(btn => {
      const isActive = state.mechanics.tags.includes(btn.dataset.value);
      btn.classList.toggle('active', isActive);
    });

    // Sync output mode radios (no data-path — handled separately)
    document.querySelectorAll('input[name="outputMode"]').forEach(radio => {
      radio.checked = (radio.value === state.outputMode);
    });

    // Show/hide Files tab based on output mode
    updateFilesTabVisibility();

    // Update download button label based on output mode
    updateDownloadButtonLabel();

    // Update derived labels
    updateToneLabel();
    updateTempLabel();
  }

  function syncStateFromUI() {
    // Sync all data-path fields
    document.querySelectorAll('[data-path]').forEach(el => {
      const path = el.dataset.path;
      if (!path) return;

      let value;
      if (el.type === 'checkbox') {
        value = el.checked;
      } else if (el.type === 'number' || el.type === 'range') {
        value = parseFloat(el.value);
      } else if (el.type === 'color') {
        value = el.value;
      } else {
        value = el.value;
      }

      setNestedValue(state, path, value);
    });

    // Sync module toggles
    document.querySelectorAll('.module-toggle').forEach(cb => {
      moduleEnabled[cb.dataset.moduleKey] = cb.checked;
    });

    // Sync mechanics tags
    state.mechanics.tags = [];
    document.querySelectorAll('#mechanics-tags .tag-btn.active').forEach(btn => {
      state.mechanics.tags.push(btn.dataset.value);
    });

    // Sync output mode from checked radio (no data-path — handled separately)
    const checkedMode = document.querySelector('input[name="outputMode"]:checked');
    if (checkedMode) {
      state.outputMode = checkedMode.value;
    }
  }

  // Show/hide the Files tab based on current output mode
  function updateFilesTabVisibility() {
    const filesTab = document.getElementById('tab-files');
    if (!filesTab) return;
    if (isMultiFileMode()) {
      filesTab.classList.remove('tab-hidden');
    } else {
      filesTab.classList.add('tab-hidden');
      // If currently viewing Files tab, switch away to sandbox
      if (filesTab.classList.contains('active')) {
        switchTab('sandbox');
      }
    }
  }

  // Update the sandbox download button label based on output mode
  function updateDownloadButtonLabel() {
    const btn = document.getElementById('btn-download');
    if (!btn) return;
    if (isMultiFileMode()) {
      btn.textContent = '💾 Download ZIP';
      btn.title = 'Download all files as ZIP';
    } else {
      btn.textContent = '💾 Download';
      btn.title = 'Download HTML file';
    }
  }

  function updatePromptPreview() {
    const preview = document.getElementById('prompt-preview');
    if (promptLocked) {
      // Auto-generated: always refresh from modules
      preview.textContent = getFullPromptText();
      preview.contentEditable = 'false';
    } else {
      // Unlocked: show custom text (or default if not yet edited)
      if (!customPromptText) {
        const { systemPrompt, userPrompt } = assemblePrompt();
        customPromptText = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
      }
      preview.textContent = customPromptText;
      preview.contentEditable = 'true';
    }
  }

  function updateToneLabel() {
    const val = state.coreIdentity.tone;
    const label = val <= 20 ? 'Very Serious/Academic'
      : val <= 40 ? 'Serious'
      : val <= 60 ? 'Balanced'
      : val <= 80 ? 'Playful' : 'Very Playful/Fun';
    document.getElementById('tone-label').textContent = label;
  }

  function updateTempLabel() {
    const label = document.getElementById('temp-label');
    if (label) {
      label.textContent = apiSettings.temperature;
    }
  }

  // ═══════════════════════════════════════════════
  // TAB SWITCHING
  // ═══════════════════════════════════════════════

  function switchTab(tabName) {
    // Guard: Files tab is only available in multi-file mode
    if (tabName === 'files' && !isMultiFileMode()) {
      switchTab('sandbox');
      return;
    }
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
  }

  // ═══════════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════════

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(KEYS.THEME, next); } catch { /* ignore */ }
  }

  function loadTheme() {
    let theme = 'light';
    try { theme = localStorage.getItem(KEYS.THEME) || 'light'; } catch { /* ignore */ }
    applyTheme(theme);
  }

  // ═══════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.showModal) {
      modal.showModal();
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal && modal.close) {
      modal.close();
    }
  }

  // ═══════════════════════════════════════════════
  // HTML ESCAPE
  // ═══════════════════════════════════════════════

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════
  // FULLSCREEN IFRAME
  // ═══════════════════════════════════════════════

  function toggleFullscreen() {
    const container = document.getElementById('iframe-container');
    const isFs = container.classList.toggle('fullscreen');

    if (isFs) {
      // Add exit button
      const exitBtn = document.createElement('button');
      exitBtn.className = 'fullscreen-exit';
      exitBtn.textContent = '✕ Exit Fullscreen';
      exitBtn.onclick = toggleFullscreen;
      container.appendChild(exitBtn);
    } else {
      // Remove exit button
      const exitBtn = container.querySelector('.fullscreen-exit');
      if (exitBtn) exitBtn.remove();
    }
  }

  // ═══════════════════════════════════════════════
  // COPY PROMPT
  // ═══════════════════════════════════════════════

  async function copyPrompt() {
    const text = getFullPromptText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Prompt copied to clipboard! 📋', 'success');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Prompt copied! 📋', 'success');
    }
  }

  // ═══════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════

  function initEventListeners() {
    // ── Generate Button ──
    document.getElementById('btn-generate').addEventListener('click', generateGame);

    // ── Refine Button ──
    document.getElementById('btn-refine').addEventListener('click', () => {
      const input = document.getElementById('refine-input');
      if (input.value.trim()) refineGame(input.value.trim());
    });

    // ── Refine Enter Key ──
    document.getElementById('refine-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val) refineGame(val);
      }
    });

    // ── All data-path fields: auto-save on change ──
    document.querySelectorAll('[data-path]').forEach(el => {
      const eventType = (el.type === 'range' || el.type === 'color') ? 'input' : 'change';
      el.addEventListener(eventType, () => {
        syncStateFromUI();
        updatePromptPreview();
        updateToneLabel();
        saveState();
        displayConflicts();
      });
    });

    // ── Module toggles ──
    document.querySelectorAll('.module-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        moduleEnabled[cb.dataset.moduleKey] = cb.checked;
        updatePromptPreview();
        saveState();
      });
    });

    // ── Mechanics tags ──
    document.querySelectorAll('#mechanics-tags .tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        syncStateFromUI();
        updatePromptPreview();
        saveState();
      });
    });

    // ── Tab switching ──
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // ── Sidebar toggle ──
    document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // ── Settings modal ──
    document.getElementById('btn-settings').addEventListener('click', () => {
      // Populate settings fields from apiSettings
      document.getElementById('apiBaseUrl').value = apiSettings.baseUrl;
      document.getElementById('apiKey').value = apiSettings.key;
      document.getElementById('modelName').value = apiSettings.model;
      document.getElementById('apiTemperature').value = apiSettings.temperature;
      updateTempLabel();

      // Highlight matching provider preset
      document.querySelectorAll('.provider-btn').forEach(btn => {
        const preset = PROVIDER_PRESETS[btn.dataset.provider];
        const isActive = (apiSettings.provider && btn.dataset.provider === apiSettings.provider)
          || (!apiSettings.provider && preset && apiSettings.baseUrl === preset.baseUrl);
        if (isActive) {
          btn.classList.add('active');
          // Populate model dropdown for this provider
          const modelSelect = document.getElementById('modelPreset');
          modelSelect.innerHTML = '<option value="">— Quick Select —</option>';
          preset.models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            modelSelect.appendChild(opt);
          });
        } else {
          btn.classList.remove('active');
        }
      });

      openModal('modal-settings');

      // Clear previous status messages
      const connStatus = document.getElementById('connection-status');
      if (connStatus) { connStatus.textContent = ''; connStatus.className = 'connection-status'; }
      const detectStatus = document.getElementById('detect-models-status');
      if (detectStatus) { detectStatus.style.display = 'none'; detectStatus.textContent = ''; detectStatus.className = 'field-hint'; }
    });

    // ── Save settings on close ──
    document.getElementById('modal-settings').addEventListener('close', () => {
      apiSettings.baseUrl = document.getElementById('apiBaseUrl').value.trim();
      apiSettings.key = document.getElementById('apiKey').value.trim();
      apiSettings.model = document.getElementById('modelName').value.trim();
      apiSettings.temperature = parseFloat(document.getElementById('apiTemperature').value) || 0.7;
      // Save active provider
      const activeProvider = document.querySelector('.provider-btn.active');
      apiSettings.provider = activeProvider ? activeProvider.dataset.provider : '';
      saveApiSettings();
    });

    // ── Temperature slider live update ──
    document.getElementById('apiTemperature').addEventListener('input', (e) => {
      document.getElementById('temp-label').textContent = e.target.value;
    });

    // ── Provider preset buttons ──
    document.querySelectorAll('.provider-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        const preset = PROVIDER_PRESETS[provider];
        if (!preset) return;

        // Highlight active provider
        document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Fill in base URL (don't clear for custom — let user enter their own)
        if (provider !== 'custom') {
          document.getElementById('apiBaseUrl').value = preset.baseUrl;
          document.getElementById('apiBaseUrl').placeholder = 'https://api.openai.com/v1';
        } else {
          document.getElementById('apiBaseUrl').placeholder = 'https://your-api-endpoint.com/v1';
        }

        // Fill in default model (don't clear for custom)
        if (provider !== 'custom') {
          document.getElementById('modelName').value = preset.defaultModel;
        }

        // Populate model quick-select dropdown
        const modelSelect = document.getElementById('modelPreset');
        modelSelect.innerHTML = '<option value="">— Quick Select —</option>';
        preset.models.forEach(model => {
          const opt = document.createElement('option');
          opt.value = model;
          opt.textContent = model;
          modelSelect.appendChild(opt);
        });

        // Clear API key for local providers
        if (!preset.needsKey) {
          document.getElementById('apiKey').value = '';
          document.getElementById('apiKey').placeholder = 'Not required for local LLMs';
        } else if (provider === 'custom') {
          document.getElementById('apiKey').placeholder = 'Enter your API key (if required)';
        } else {
          document.getElementById('apiKey').placeholder = 'sk-... (enter your API key)';
        }

        // Update temperature label
        updateTempLabel();
      });
    });

    // ── Model quick-select dropdown ──
    document.getElementById('modelPreset').addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('modelName').value = e.target.value;
      }
    });

    // ── Auto-Detect Models ──
    document.getElementById('btn-detect-models').addEventListener('click', async () => {
      const btn = document.getElementById('btn-detect-models');
      const statusEl = document.getElementById('detect-models-status');
      const modelSelect = document.getElementById('modelPreset');
      const modelInput = document.getElementById('modelName');

      // Save current settings before detecting
      apiSettings.baseUrl = document.getElementById('apiBaseUrl').value.trim();
      apiSettings.key = document.getElementById('apiKey').value.trim();
      apiSettings.model = modelInput.value.trim();
      const activeProvider = document.querySelector('.provider-btn.active');
      apiSettings.provider = activeProvider ? activeProvider.dataset.provider : '';

      btn.disabled = true;
      btn.textContent = '⏳ Detecting...';
      statusEl.style.display = 'inline';
      statusEl.textContent = 'Fetching models from server...';
      statusEl.className = 'field-hint';

      try {
        const models = await fetchAvailableModels();

        if (models.length > 0) {
          // Populate the quick-select dropdown
          modelSelect.innerHTML = '<option value="">— Quick Select —</option>';
          models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            modelSelect.appendChild(opt);
          });

          // If current model is empty or not in the list, select the first one
          if (!modelInput.value || !models.includes(modelInput.value)) {
            modelInput.value = models[0];
          }

          statusEl.textContent = `✅ Found ${models.length} model${models.length !== 1 ? 's' : ''}`;
          statusEl.className = 'field-hint success';
          showToast(`Found ${models.length} available model${models.length !== 1 ? 's' : ''}`, 'success');
        } else {
          statusEl.textContent = '⚠️ No models found. Check your server URL and ensure it\'s running.';
          statusEl.className = 'field-hint error';
          showToast('No models found. Check your server URL.', 'warning');
        }
      } catch (err) {
        statusEl.textContent = `❌ Error: ${err.message}`;
        statusEl.className = 'field-hint error';
        showToast('Failed to detect models: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '🔍 Auto-Detect Models';
      }
    });

    // ── Test Connection ──
    document.getElementById('btn-test-connection').addEventListener('click', async () => {
      const btn = document.getElementById('btn-test-connection');
      const statusEl = document.getElementById('connection-status');

      // Save current settings before testing
      apiSettings.baseUrl = document.getElementById('apiBaseUrl').value.trim();
      apiSettings.key = document.getElementById('apiKey').value.trim();
      apiSettings.model = document.getElementById('modelName').value.trim();
      apiSettings.temperature = parseFloat(document.getElementById('apiTemperature').value) || 0.7;
      const activeProvider = document.querySelector('.provider-btn.active');
      apiSettings.provider = activeProvider ? activeProvider.dataset.provider : '';

      btn.disabled = true;
      btn.textContent = '⏳ Testing...';
      statusEl.textContent = 'Connecting to API...';
      statusEl.className = 'connection-status loading';

      try {
        const result = await testConnection();
        statusEl.textContent = result.message;
        statusEl.className = `connection-status ${result.success ? 'success' : 'error'}`;
        showToast(result.message, result.success ? 'success' : 'error', 4000);
      } catch (err) {
        statusEl.textContent = `❌ Error: ${err.message}`;
        statusEl.className = 'connection-status error';
        showToast('Connection test failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '🔌 Test Connection';
      }
    });

    // ── History modal ──
    document.getElementById('btn-history').addEventListener('click', () => {
      renderHistory();
      openModal('modal-history');
    });

    // ── Clear history ──
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);

    // ── Templates modal ──
    document.getElementById('btn-templates').addEventListener('click', () => {
      renderTemplates();
      openModal('modal-templates');
    });

    // ── Save template ──
    document.getElementById('btn-save-template').addEventListener('click', saveTemplate);

    // ── Download (dispatcher: single-file HTML or multi-file ZIP) ──
    document.getElementById('btn-download').addEventListener('click', downloadGame);

    // ── Download ZIP (Files panel toolbar) ──
    const btnDownloadZip = document.getElementById('btn-download-zip');
    if (btnDownloadZip) {
      btnDownloadZip.addEventListener('click', downloadZIP);
    }

    // ── Fullscreen ──
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    // ── Refresh iframe ──
    document.getElementById('btn-refresh-iframe').addEventListener('click', () => {
      if (isMultiFileMode() && lastGeneratedFiles) {
        renderMultiFileInIframe(lastGeneratedFiles);
        showToast('Game refreshed', 'info');
      } else if (lastGeneratedCode) {
        renderInIframe(lastGeneratedCode);
        showToast('Game refreshed', 'info');
      }
    });

    // ── Clear Live View ──
    const btnClearLiveView = document.getElementById('btn-clear-liveview');
    if (btnClearLiveView) {
      btnClearLiveView.addEventListener('click', liveViewClear);
    }

    // ── Theme toggle ──
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', toggleTheme);
    }

    // ── Output mode radios (no data-path — handled separately) ──
    document.querySelectorAll('input[name="outputMode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        syncStateFromUI();
        syncUIFromState();
        updatePromptPreview();
        saveState();
      });
    });

    // ── Dismiss error panel ──
    const btnDismissError = document.getElementById('btn-dismiss-error');
    if (btnDismissError) {
      btnDismissError.addEventListener('click', hideErrorPanel);
    }

    // ── Copy prompt ──
    document.getElementById('btn-copy-prompt').addEventListener('click', copyPrompt);

    // ── Lock/Unlock prompt ──
    document.getElementById('btn-lock-prompt').addEventListener('click', () => {
      const btn = document.getElementById('btn-lock-prompt');
      const preview = document.getElementById('prompt-preview');
      const warning = document.getElementById('prompt-edit-warning');
      const resetBtn = document.getElementById('btn-reset-prompt');

      if (promptLocked) {
        // Unlock: save current auto-generated text as starting point for editing
        const { systemPrompt, userPrompt } = assemblePrompt();
        customPromptText = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
        promptLocked = false;
        btn.textContent = '🔓 Unlocked';
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        preview.classList.remove('prompt-locked');
        preview.classList.add('prompt-unlocked');
        preview.contentEditable = 'true';
        preview.textContent = customPromptText;
        warning.classList.remove('hidden');
        resetBtn.disabled = false;
        showToast('Prompt unlocked — edits will affect generation results', 'warning');
      } else {
        // Lock: save current edited text and lock
        customPromptText = preview.textContent;
        promptLocked = true;
        btn.textContent = '🔒 Locked';
        btn.classList.remove('unlocked');
        btn.classList.add('locked');
        preview.classList.remove('prompt-unlocked');
        preview.classList.add('prompt-locked');
        preview.contentEditable = 'false';
        warning.classList.add('hidden');
        resetBtn.disabled = true;
        showToast('Prompt locked — using your edited version', 'info');
      }
    });

    // ── Save prompt edits on input ──
    document.getElementById('prompt-preview').addEventListener('input', () => {
      if (!promptLocked) {
        customPromptText = document.getElementById('prompt-preview').textContent;
      }
    });

    // ── Reset prompt to default ──
    document.getElementById('btn-reset-prompt').addEventListener('click', () => {
      if (promptLocked) return;
      customPromptText = '';
      const { systemPrompt, userPrompt } = assemblePrompt();
      const defaultText = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
      document.getElementById('prompt-preview').textContent = defaultText;
      customPromptText = defaultText;
      showToast('Prompt reset to auto-generated default', 'success');
    });

    // ── Modal close buttons ──
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    // ── Close modals on backdrop click ──
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
      });
    });

    // ── Module scroll buttons ──
    document.querySelectorAll('.module-scroll-top').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = btn.closest('.module-body');
        if (body) body.scrollBy({ top: -100, behavior: 'smooth' });
      });
    });
    document.querySelectorAll('.module-scroll-bottom').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = btn.closest('.module-body');
        if (body) body.scrollBy({ top: 100, behavior: 'smooth' });
      });
    });

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', (e) => {
      // Ctrl+Enter: Generate
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        generateGame();
      }
      // Ctrl+B: Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        document.getElementById('sidebar').classList.toggle('collapsed');
      }
      // Ctrl+H: History
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        renderHistory();
        openModal('modal-history');
      }
      // Ctrl+T: Templates
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        renderTemplates();
        openModal('modal-templates');
      }
      // Ctrl+,: Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        document.getElementById('btn-settings').click();
      }
      // Escape: Close modals or fullscreen
      if (e.key === 'Escape') {
        const fsContainer = document.getElementById('iframe-container');
        if (fsContainer.classList.contains('fullscreen')) {
          toggleFullscreen();
        }
      }
    });
  }

  // ═══════════════════════════════════════════════
  // GLOBAL EXPOSES (for inline onclick in history/templates)
  // ═══════════════════════════════════════════════

  window.__loadHistory = loadHistoryItem;
  window.__deleteHistory = deleteHistoryItem;
  window.__loadTemplate = loadTemplate;
  window.__deleteTemplate = deleteTemplate;

  // ═══════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════

  function init() {
    // Load persisted state
    loadState();
    loadApiSettings();
    loadTheme();

    // Sync UI from loaded state
    syncUIFromState();

    // Build initial prompt preview
    updatePromptPreview();

    // Set up all event listeners
    initEventListeners();

    // Check for conflicts
    displayConflicts();

    console.log('🎓 Game Creator Learn initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
