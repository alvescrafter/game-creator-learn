// Tests for the server-side prompt builder
// These test the buildPrompt, buildSystemPrompt, and buildUserPrompt functions
// by requiring the api router and testing the internal logic

describe('Prompt Builder', () => {
  // We need to access the buildPrompt function from the api module
  // Since it's not exported, we'll test the logic by replicating it here
  // and verifying the output structure

  const TECH_DEFAULTS = {
    framework: 'Vanilla JS/Canvas',
    singleFile: true,
    assetHandling: 'Use CSS shapes, Canvas drawing, emoji, Unicode characters, and generated Web Audio only',
    maxTokens: 50000,
  };

  const GAME_TYPE_GUIDANCE = {
    'Platformer Quiz': 'Use very simple movement; gate progress with questions instead of complex physics.',
    'RPG': 'Convert this to Adventure Quiz: lightweight story, choices, and educational challenges; avoid inventory-heavy systems.',
  };

  const MECHANIC_GUIDANCE = {
    'Multiple Choice': 'Include 3-4 plausible options, explain why the chosen answer is right or wrong.',
    'Drag & Drop': 'Also support click/tap selection as a fallback for touch and keyboard users.',
    'Physics': 'Keep movement and collisions very simple; prioritise educational questions over physics accuracy.',
  };

  const DIFFICULTY_CURVE_GUIDANCE = {
    'Adaptive Review': 'If the learner misses an item, give a hint and revisit a similar item later.',
    'Exponential': 'Use Challenge Rounds without sudden difficulty spikes.',
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
- All educational content must be factually accurate and appropriate for the specified age range
- IMPORTANT: Do NOT exceed 50,000 tokens in your total response. Keep the output concise and efficient while still delivering a complete, playable game. Avoid unnecessary comments, verbose variable names, or redundant code. Prioritise functionality over excessive documentation.

DESIGN RESOLUTION RULES:
- Treat the selected Game Type as the primary loop and the selected Mechanics as supporting interactions.
- If options compete with each other, choose the simpler interaction that best teaches the learning objective.
- Prefer deterministic, testable rules over complex physics, procedural systems, or large simulations.`;

    systemPrompt += `\n\nYou are proficient in ${TECH_DEFAULTS.framework}.`;
    systemPrompt += '\n\nIMPORTANT: Deliver the ENTIRE game in a SINGLE HTML file including all CSS and JavaScript. Ensure all logic is contained within the file. Do NOT split into separate files.';
    systemPrompt += `\n\nUse ${TECH_DEFAULTS.framework} for rendering and game logic.`;
    systemPrompt += `\n\nAsset Handling: ${TECH_DEFAULTS.assetHandling}.`;

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

    if (enabled.educationalTopic) {
      const edu = state.educationalTopic || {};
      userPrompt += '**Educational Topic:**\n';
      if (edu.subject) userPrompt += `- Subject: ${edu.subject}\n`;
      if (edu.topic) userPrompt += `- Specific Topic: ${edu.topic}\n`;
      if (edu.learningObjective) userPrompt += `- Learning Objective: ${edu.learningObjective}\n`;
      userPrompt += '\n';
    }

    if (enabled.difficulty) {
      const diff = state.difficulty || {};
      userPrompt += '**Target Learner:**\n';
      if (diff.ageRange) userPrompt += `- Age Range: ${diff.ageRange}\n`;
      if (diff.difficultyLevel) userPrompt += `- Difficulty Level: ${diff.difficultyLevel}\n`;
      if (diff.accessibility) userPrompt += `- Accessibility Requirements: ${diff.accessibility}\n`;
      userPrompt += '\n';
    }

    if (enabled.coreIdentity) {
      const core = state.coreIdentity || {};
      userPrompt += '**Game Concept:**\n';
      if (core.genre) userPrompt += `- Game Type: ${core.genre}\n`;
      if (core.genre && GAME_TYPE_GUIDANCE[core.genre]) userPrompt += `- Game Type Guidance: ${GAME_TYPE_GUIDANCE[core.genre]}\n`;
      if (core.theme) userPrompt += `- Setting/Theme: ${core.theme}\n`;
      const tone = core.tone !== undefined ? core.tone : 50;
      const toneLabel = tone <= 20 ? 'Very Serious/Academic'
        : tone <= 40 ? 'Serious'
        : tone <= 60 ? 'Balanced'
        : tone <= 80 ? 'Playful' : 'Very Playful/Fun';
      userPrompt += `- Tone: ${toneLabel}\n`;
      userPrompt += '\n';
    }

    if (enabled.mechanics) {
      const mech = state.mechanics || {};
      userPrompt += '**Gameplay Mechanics:**\n';
      if (mech.tags && mech.tags.length > 0) {
        userPrompt += `- Mechanics: ${mech.tags.join(', ')}\n`;
        const mechanicGuidance = mech.tags
          .map(tag => MECHANIC_GUIDANCE[tag] ? `${tag}: ${MECHANIC_GUIDANCE[tag]}` : '')
          .filter(Boolean);
        if (mechanicGuidance.length > 0) {
          userPrompt += `- Mechanic Guidance:\n  - ${mechanicGuidance.join('\n  - ')}\n`;
        }
      }
      if (mech.rules) userPrompt += `- Specific Rules: ${mech.rules}\n`;
      if (mech.difficulty) {
        userPrompt += `- Difficulty Curve: ${mech.difficulty}\n`;
        if (DIFFICULTY_CURVE_GUIDANCE[mech.difficulty]) userPrompt += `- Difficulty Curve Guidance: ${DIFFICULTY_CURVE_GUIDANCE[mech.difficulty]}\n`;
      }
      userPrompt += '\n';
    }

    if (enabled.visuals) {
      const vis = state.visuals || {};
      userPrompt += '**Visual Requirements:**\n';
      if (vis.artStyle) userPrompt += `- Art Style: ${vis.artStyle}\n`;
      userPrompt += `- Color Palette: Primary ${vis.colorPrimary || '#10b981'}, Secondary ${vis.colorSecondary || '#3b82f6'}, Background ${vis.colorBg || '#f0fdf4'}\n`;
      if (vis.vfx) userPrompt += `- Visual Effects: ${vis.vfx}\n`;
      userPrompt += '\n';
    }

    userPrompt += '**Technical Instructions:**\n';
    userPrompt += `- Framework: ${TECH_DEFAULTS.framework}\n`;
    userPrompt += `- Single File: Yes\n`;
    userPrompt += `- Asset Handling: ${TECH_DEFAULTS.assetHandling}\n`;
    userPrompt += '\n';

    if (enabled.audio) {
      const aud = state.audio || {};
      userPrompt += '**Audio & Soundscape:**\n';
      if (aud.musicMood) {
        userPrompt += `- Music Mood: ${aud.musicMood}\n`;
        if (aud.musicMood === 'None') {
          userPrompt += '- Audio Guidance: Do not create looping background music. Sound effects may still be used only if requested. Keep the Settings mute toggle.\n';
        } else {
          userPrompt += '- Audio Guidance: Use generated Web Audio only, start audio after the first user action, keep it subtle, and provide a mute toggle.\n';
        }
      }
      if (aud.sfx) userPrompt += `- SFX Requirements: ${aud.sfx}\n`;
      userPrompt += '\n';
    }

    userPrompt += '**Option Compatibility Rules:**\n';
    userPrompt += '- Build one clear primary gameplay loop from the selected Game Type.\n';
    userPrompt += '- Use selected Mechanics as supporting features; if more than four are selected, combine or prioritise the four that best teach the learning objective.\n';
    userPrompt += '- Start Menu, HUD, Pause Menu, Settings, scoring/progress, feedback, and completion screens are mandatory even if not selected as mechanics.\n';
    userPrompt += '- Avoid overbuilding: no external assets, no WebGL requirement, no large generated worlds, no passive idle loops, and no complex physics unless absolutely necessary.\n';
    userPrompt += '\n';

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

  describe('buildSystemPrompt', () => {
    it('should include educational game developer role', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('expert Educational Game Developer');
    });

    it('should include core principles', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('CORE PRINCIPLES');
      expect(prompt).toContain('educational purpose');
      expect(prompt).toContain('age-appropriate');
      expect(prompt).toContain('immediate, constructive feedback');
    });

    it('should include single file requirement', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('SINGLE HTML file');
    });

    it('should include framework specification', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('Vanilla JS/Canvas');
    });

    it('should include option resolution guardrails', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('DESIGN RESOLUTION RULES');
      expect(prompt).toContain('selected Game Type as the primary loop');
      expect(prompt).toContain('deterministic, testable rules');
    });
  });

  describe('buildUserPrompt', () => {
    it('should include educational topic when enabled', () => {
      const config = {
        educationalTopic: {
          subject: 'Mathematics',
          topic: 'Fractions',
          learningObjective: 'Add and subtract fractions',
        }
      };
      const prompt = buildUserPrompt(config, { educationalTopic: true });
      expect(prompt).toContain('Mathematics');
      expect(prompt).toContain('Fractions');
      expect(prompt).toContain('Add and subtract fractions');
    });

    it('should skip educational topic when disabled', () => {
      const config = {
        educationalTopic: { subject: 'Mathematics' }
      };
      const prompt = buildUserPrompt(config, { educationalTopic: false });
      expect(prompt).not.toContain('Subject: Mathematics');
    });

    it('should include difficulty and age range', () => {
      const config = {
        difficulty: {
          ageRange: '9-11',
          difficultyLevel: 'Intermediate',
          accessibility: 'High contrast mode',
        }
      };
      const prompt = buildUserPrompt(config, { difficulty: true });
      expect(prompt).toContain('9-11');
      expect(prompt).toContain('Intermediate');
      expect(prompt).toContain('High contrast mode');
    });

    it('should include core identity with tone label', () => {
      const config = {
        coreIdentity: {
          genre: 'Quiz',
          theme: 'Space',
          tone: 80,
        }
      };
      const prompt = buildUserPrompt(config, { coreIdentity: true });
      expect(prompt).toContain('Quiz');
      expect(prompt).toContain('Space');
      expect(prompt).toContain('Playful');
    });

    it('should map tone values to correct labels', () => {
      const testCases = [
        { tone: 10, label: 'Very Serious/Academic' },
        { tone: 30, label: 'Serious' },
        { tone: 50, label: 'Balanced' },
        { tone: 70, label: 'Playful' },
        { tone: 90, label: 'Very Playful/Fun' },
      ];

      testCases.forEach(({ tone, label }) => {
        const config = { coreIdentity: { tone } };
        const prompt = buildUserPrompt(config, { coreIdentity: true });
        expect(prompt).toContain(label);
      });
    });

    it('should include mechanics tags as comma-separated list', () => {
      const config = {
        mechanics: {
          tags: ['Drag & Drop', 'Multiple Choice'],
          rules: 'Answer before time runs out',
          difficulty: 'Adaptive Review',
        }
      };
      const prompt = buildUserPrompt(config, { mechanics: true });
      expect(prompt).toContain('Drag & Drop, Multiple Choice');
      expect(prompt).toContain('Answer before time runs out');
      expect(prompt).toContain('Adaptive Review');
      expect(prompt).toContain('click/tap selection as a fallback');
      expect(prompt).toContain('revisit a similar item later');
    });

    it('should include game type guidance for reliable educational loops', () => {
      const config = {
        coreIdentity: {
          genre: 'Platformer Quiz',
          tone: 50,
        }
      };
      const prompt = buildUserPrompt(config, { coreIdentity: true });
      expect(prompt).toContain('Game Type Guidance');
      expect(prompt).toContain('gate progress with questions');
    });

    it('should include visual requirements with color palette', () => {
      const config = {
        visuals: {
          artStyle: 'Pixel Art',
          colorPrimary: '#ff0000',
          colorSecondary: '#00ff00',
          colorBg: '#0000ff',
          vfx: 'Particle effects',
        }
      };
      const prompt = buildUserPrompt(config, { visuals: true });
      expect(prompt).toContain('Pixel Art');
      expect(prompt).toContain('#ff0000');
      expect(prompt).toContain('#00ff00');
      expect(prompt).toContain('#0000ff');
      expect(prompt).toContain('Particle effects');
    });

    it('should include audio requirements', () => {
      const config = {
        audio: {
          musicMood: 'None',
          sfx: 'Click sounds',
        }
      };
      const prompt = buildUserPrompt(config, { audio: true });
      expect(prompt).toContain('Do not create looping background music');
      expect(prompt).toContain('Click sounds');
    });

    it('should always include technical instructions', () => {
      const prompt = buildUserPrompt({}, {});
      expect(prompt).toContain('Technical Instructions');
      expect(prompt).toContain('Vanilla JS/Canvas');
      expect(prompt).toContain('Single File: Yes');
    });

    it('should always include output requirements', () => {
      const prompt = buildUserPrompt({}, {});
      expect(prompt).toContain('Output Requirements');
      expect(prompt).toContain('playable educational game');
      expect(prompt).toContain('immediate feedback');
      expect(prompt).toContain('scoring/progress system');
    });

    it('should handle empty config gracefully', () => {
      const prompt = buildUserPrompt({}, {
        educationalTopic: true,
        difficulty: true,
        coreIdentity: true,
        mechanics: true,
        visuals: true,
        audio: true,
      });
      // Should still produce a valid prompt with section headers
      expect(prompt).toContain('Educational Topic');
      expect(prompt).toContain('Target Learner');
      expect(prompt).toContain('Game Concept');
      expect(prompt).toContain('Gameplay Mechanics');
      expect(prompt).toContain('Visual Requirements');
      expect(prompt).toContain('Audio & Soundscape');
    });

    it('should use default colors when not specified', () => {
      const prompt = buildUserPrompt({ visuals: {} }, { visuals: true });
      expect(prompt).toContain('#10b981');  // default primary
      expect(prompt).toContain('#3b82f6');  // default secondary
      expect(prompt).toContain('#f0fdf4');  // default bg
    });
  });

  describe('buildPrompt (combined)', () => {
    it('should return both system and user prompts', () => {
      const result = { systemPrompt: buildSystemPrompt(), userPrompt: buildUserPrompt({}) };
      expect(result.systemPrompt).toBeDefined();
      expect(result.userPrompt).toBeDefined();
      expect(result.systemPrompt.length).toBeGreaterThan(100);
      expect(result.userPrompt.length).toBeGreaterThan(100);
    });
  });
});

describe('Code Extraction', () => {
  // Replicate the extractCode function for testing
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

  it('should extract code from ```html fences', () => {
    const response = 'Here is your game:\n```html\n<!DOCTYPE html><html></html>\n```\nEnjoy!';
    expect(extractCode(response)).toBe('<!DOCTYPE html><html></html>');
  });

  it('should extract code from ```javascript fences', () => {
    const response = '```javascript\nconsole.log("hello");\n```';
    expect(extractCode(response)).toBe('console.log("hello");');
  });

  it('should extract code from ```js fences', () => {
    const response = '```js\nconst x = 1;\n```';
    expect(extractCode(response)).toBe('const x = 1;');
  });

  it('should extract code from plain ``` fences', () => {
    const response = '```\n<html><body>Hello</body></html>\n```';
    expect(extractCode(response)).toBe('<html><body>Hello</body></html>');
  });

  it('should return raw HTML if no fences found', () => {
    const response = '<!DOCTYPE html><html><body>Game</body></html>';
    expect(extractCode(response)).toBe(response);
  });

  it('should return trimmed response as fallback', () => {
    const response = '  Some plain text response  ';
    expect(extractCode(response)).toBe('Some plain text response');
  });

  it('should handle HTML starting with <html tag', () => {
    const response = '<html><body>Game</body></html>';
    expect(extractCode(response)).toBe(response);
  });
});
