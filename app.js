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
  };

  const MAX_HISTORY = 50;

  // ── Default State ──
  const DEFAULT_STATE = {
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
    singleFile: true,
    assetHandling: 'Use placeholder colored rectangles and simple shapes',
    maxTokens: 100000,
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
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
      defaultModel: 'gpt-4o',
      needsKey: true,
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: ['gemini-2.5-pro-preview-03-25', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultModel: 'gemini-2.0-flash',
      needsKey: true,
    },
    claude: {
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      defaultModel: 'claude-sonnet-4-20250514',
      needsKey: true,
    },
    ollama: {
      baseUrl: 'http://localhost:11434/v1',
      models: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'gemma2', 'phi3', 'qwen2', 'deepseek-coder-v2', 'mixtral'],
      defaultModel: 'llama3.2',
      needsKey: false,
    },
    lmstudio: {
      baseUrl: 'http://localhost:1234/v1',
      models: [], // Populated dynamically from server
      defaultModel: '',
      needsKey: false,
    },
  };

  // ── App State ──
  let state = deepClone(DEFAULT_STATE);
  let apiSettings = deepClone(DEFAULT_API);
  let moduleEnabled = deepClone(DEFAULT_MODULE_ENABLED);
  let conversationHistory = []; // for refine feature
  let lastGeneratedCode = '';
  let isGenerating = false;
  let promptLocked = true; // prompt is locked by default
  let customPromptText = ''; // stores manually edited prompt when unlocked

  // ═══════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
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
        if (parsed.state) state = { ...deepClone(DEFAULT_STATE), ...parsed.state };
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
- All educational content must be factually accurate and appropriate for the specified age range`;

    // Always include tech stack context in background
    systemPrompt += `\n\nYou are proficient in ${TECH_DEFAULTS.framework}.`;

    // Always use single file mode
    systemPrompt += '\n\nIMPORTANT: Deliver the ENTIRE game in a SINGLE HTML file including all CSS and JavaScript. Ensure all logic is contained within the file. Do NOT split into separate files.';

    // Always include framework instruction
    systemPrompt += `\n\nUse ${TECH_DEFAULTS.framework} for rendering and game logic.`;

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
      }
      if (state.mechanics.rules) {
        userPrompt += `- Specific Rules: ${state.mechanics.rules}\n`;
      }
      if (state.mechanics.difficulty) {
        userPrompt += `- Difficulty Curve: ${state.mechanics.difficulty}\n`;
      }
      userPrompt += '\n';
    }

    // ── Visuals ──
    if (enabled.visuals) {
      userPrompt += '**Visual Requirements:**\n';
      if (state.visuals.artStyle) userPrompt += `- Art Style: ${state.visuals.artStyle}\n`;
      userPrompt += `- Color Palette: Primary ${state.visuals.colorPrimary}, Secondary ${state.visuals.colorSecondary}, Background ${state.visuals.colorBg}\n`;
      if (state.visuals.vfx) userPrompt += `- Visual Effects: ${state.visuals.vfx}\n`;
      userPrompt += '\n';
    }

    // Tech stack is always included in background
    userPrompt += '**Technical Instructions:**\n';
    userPrompt += `- Framework: ${TECH_DEFAULTS.framework}\n`;
    userPrompt += `- Single File: Yes\n`;
    userPrompt += `- Asset Handling: ${TECH_DEFAULTS.assetHandling}\n`;
    userPrompt += '\n';

    // ── Audio ──
    if (enabled.audio) {
      userPrompt += '**Audio & Soundscape:**\n';
      if (state.audio.musicMood) userPrompt += `- Music Mood: ${state.audio.musicMood}\n`;
      if (state.audio.sfx) userPrompt += `- SFX Requirements: ${state.audio.sfx}\n`;
      userPrompt += '\n';
    }

    // ── Output Requirements — Educational Game Specific ──
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

  async function callLLM(messages) {
    const baseUrl = apiSettings.baseUrl.replace(/\/+$/, ''); // trim trailing slash
    const endpoint = `${baseUrl}/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiSettings.key) {
      headers['Authorization'] = `Bearer ${apiSettings.key}`;
    }

    const maxTokens = TECH_DEFAULTS.maxTokens;

    const body = {
      model: apiSettings.model,
      messages,
      temperature: parseFloat(apiSettings.temperature) || 0.7,
      max_tokens: maxTokens,
    };

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
    showLoading('Generating your educational game...');
    hideErrorPanel();
    document.getElementById('btn-generate').disabled = true;

    try {
      const { systemPrompt, userPrompt } = getPromptForGeneration();

      // Build conversation
      conversationHistory = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await callLLM(conversationHistory);
      conversationHistory.push({ role: 'assistant', content: response });

      const code = extractCode(response);

      if (!code || code.trim().length === 0) {
        throw new Error('The AI returned empty code. Try adjusting your settings or prompt.');
      }

      renderInIframe(code);

      // Save to history
      saveToHistory(code);

      showToast('Educational game generated successfully! 🎓', 'success');
    } catch (err) {
      console.error('Generation failed:', err);
      showToast('Generation failed: ' + err.message, 'error', 5000);
      showErrorInPanel('Generation failed: ' + err.message);
    } finally {
      isGenerating = false;
      hideLoading();
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
    showLoading('Refining your educational game...');
    hideErrorPanel();
    document.getElementById('btn-refine').disabled = true;

    try {
      conversationHistory.push({
        role: 'user',
        content: `Refine the educational game with this change: ${instruction}\n\nReturn the COMPLETE updated game code. Do not omit any parts. Ensure all educational content remains accurate and the learning objectives are still met.`,
      });

      const response = await callLLM(conversationHistory);
      conversationHistory.push({ role: 'assistant', content: response });

      const code = extractCode(response);

      if (!code || code.trim().length === 0) {
        throw new Error('The AI returned empty code. Try rephrasing your refinement.');
      }

      renderInIframe(code);

      // Update history entry
      saveToHistory(code, true);

      showToast('Educational game refined! 🔄', 'success');
      document.getElementById('refine-input').value = '';
    } catch (err) {
      console.error('Refine failed:', err);
      showToast('Refine failed: ' + err.message, 'error', 5000);
      showErrorInPanel('Refine failed: ' + err.message);
    } finally {
      isGenerating = false;
      hideLoading();
      document.getElementById('btn-refine').disabled = false;
    }
  }

  // ═══════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════

  function saveToHistory(code, isRefine = false) {
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
      code,
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
    state = { ...deepClone(DEFAULT_STATE), ...item.config };
    moduleEnabled = { ...deepClone(DEFAULT_MODULE_ENABLED), ...item.moduleEnabled };

    // Restore code to iframe
    if (item.code) {
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

    state = { ...deepClone(DEFAULT_STATE), ...item.config };
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
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
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
        if (preset && apiSettings.baseUrl === preset.baseUrl) {
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

        // Fill in base URL
        document.getElementById('apiBaseUrl').value = preset.baseUrl;

        // Fill in default model
        document.getElementById('modelName').value = preset.defaultModel;

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

    // ── Download HTML ──
    document.getElementById('btn-download').addEventListener('click', downloadHTML);

    // ── Fullscreen ──
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    // ── Refresh iframe ──
    document.getElementById('btn-refresh-iframe').addEventListener('click', () => {
      if (lastGeneratedCode) {
        renderInIframe(lastGeneratedCode);
        showToast('Game refreshed', 'info');
      }
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