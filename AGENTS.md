# AGENTS.md — Instructions for AI Coding Agents

> This file provides context for AI coding agents (GitHub Copilot, Cursor, Claude Code, etc.) working with the Game Creator Learn codebase.

## Project Overview

Game Creator Learn is a **client-side educational game generator** deployed as a static site on Netlify. Users configure learning parameters through a sidebar UI, and the app assembles a structured prompt sent to a user-chosen LLM provider to generate a complete, playable HTML5 educational game.

**It is NOT a backend application.** Despite Express/Helmet/CORS being in `package.json`, there is no server-side code. All LLM API calls happen client-side via `fetch()`. The `routes/` and `config/` directories are empty.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript — no frameworks, no build tools
- **Storage**: localStorage (API settings, history, templates, state)
- **LLM APIs**: 6 provider adapters (OpenAI-compatible + Anthropic native format)
- **Testing**: Jest (prompt builder tests only)
- **Deployment**: Static site on Netlify (no server runtime)
- **Launcher**: Pinokio support via `pinokio.json`

## File Structure

```
├── index.html          # Main HTML shell — all UI structure, modals, JSON-LD
├── app.js              # ALL application logic (1700+ lines) — providers, prompt assembly, API calls, UI events
├── style.css           # All styling (1100+ lines) — green/white educational theme, responsive
├── package.json        # Node.js project metadata (Express deps unused for static deployment)
├── pinokio.json        # Pinokio launcher config
├── robots.txt          # AI crawler directives
├── sitemap.xml         # XML sitemap
├── sitemap.md          # Markdown sitemap for AI agents
├── llms.txt            # Curated site summary for AI models
├── llms-full.txt       # Full content for deep AI ingestion
├── ai.txt              # AI permissions declaration
├── ai.json             # Structured AI metadata
├── brand.txt           # Brand identity guidelines
├── AGENTS.md            # This file — instructions for coding agents
├── netlify.toml         # Netlify config (headers, content types, Link headers)
├── HOW_TO_USE.md        # User-facing usage guide
├── PINOKIO.md          # Pinokio launcher documentation
├── og-image.png         # Social media preview image
├── favicon.svg         # SVG favicon (🎓)
├── .well-known/
│   ├── ai-plugin.json              # ChatGPT plugin-style manifest
│   ├── agents.json                 # A2A agent discovery (Google protocol)
│   └── agent-skills/
│       └── index.json              # Agent Skills Discovery spec
├── config/             # Empty (no backend config)
├── routes/             # Empty (no backend routes)
└── tests/
    └── promptBuilder.test.js  # Jest tests for prompt assembly
```

## How to Run Locally

### Option 1: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. App opens at `http://localhost:5501` (configured in `.vscode/settings.json`)

### Option 2: Any Static File Server
```bash
npx serve .
# or
python -m http.server 5501
```

### Option 3: Pinokio Launcher
See `PINOKIO.md` for one-click install instructions.

## How to Test

```bash
npx jest tests/promptBuilder.test.js --verbose --forceExit
```

Tests cover:
- `buildSystemPrompt()` — system prompt assembly
- `buildUserPrompt()` — user prompt assembly from sidebar configuration
- Code extraction from markdown fences and raw HTML
- All 6 modules: Educational Topic, Difficulty, Core Identity, Mechanics, Visuals, Audio
- Tone value mapping, mechanics tags, color palettes, output requirements

## Key Patterns in app.js

### Provider Presets
All 6 LLM providers are defined in `PROVIDER_PRESETS` object at the top of `app.js`. Each preset includes:
- `models`: Array of model name strings
- `defaultModel`: Default model string
- `apiType`: 'openai' or 'anthropic'
- `endpoint`: API base URL
- `apiKeyHeader`: Header name for API key
- `supportsModelList`: Boolean — can fetch /models endpoint

### Prompt Assembly
- `buildSystemPrompt()` — assembles the system prompt with mandatory game structure, button standards, keyboard controls
- `buildUserPrompt()` — assembles the user prompt from all enabled sidebar modules
- Each module can be toggled on/off — disabled modules are excluded from the prompt
- Prompt includes conflict validation (e.g., "No Music" + music mood = conflict)

### LLM API Calls
- `callLLM()` — unified function that routes to the correct provider based on `apiType`
- OpenAI-compatible providers use standard `fetch()` to `/chat/completions`
- Anthropic uses native format with `x-api-key` header and `anthropic-version` header
- Streaming is supported via `ReadableStream` for OpenAI-compatible providers

### Code Extraction
- `extractCodeFromMarkdown()` — extracts HTML from markdown code fences
- Falls back to raw HTML if no fences found
- Extracted code is rendered in an iframe via `srcdoc` or Blob URL

### State Management
- `apiSettings` object — current provider, API key, model, temperature
- `history` array — last 50 generated games (localStorage)
- `templates` object — saved game configurations (localStorage)
- All state persists in localStorage with keys prefixed `gcl_`

## Deployment

This is a **static site** — no build step required.

### Deploy to Netlify
1. Push to GitHub repository
2. Connect repo to Netlify
3. Build command: (none — leave empty)
4. Publish directory: `/` (root)
5. `netlify.toml` handles headers and content types automatically

### Important Deployment Notes
- `netlify.toml` configures Content-Type headers for `.txt` files (text/plain), `.json` files (application/json), and `.md` files (text/markdown)
- Link headers (RFC 8288) announce discovery resources (`llms.txt`, `sitemap.xml`, `ai.json`)
- `Content-Signal` header set to `ai-train=yes, search=yes, ai-input=yes`
- Content negotiation: `Accept: text/markdown` on `/` serves `llms-full.txt`

## When Making Changes

### Adding a New LLM Provider
1. Add a new entry to `PROVIDER_PRESETS` in `app.js`
2. Add UI elements in the settings modal in `index.html`
3. Add styling in `style.css` if needed
4. Update `llms.txt`, `llms-full.txt`, `ai.json` with the new provider
5. Update `HOW_TO_USE.md` with the new provider instructions
6. Add tests in `tests/promptBuilder.test.js` if prompt logic changes

### Adding a New Game Type or Mechanic
1. Add the option to the relevant select/tag grid in `index.html`
2. Update `buildUserPrompt()` in `app.js` if needed
3. Update `llms.txt`, `llms-full.txt`, `ai.json` with the new option
4. Update `HOW_TO_USE.md` with the new option
5. Add tests in `tests/promptBuilder.test.js`

### Updating AI Discovery Files
When features change, update these files to keep AI agent discovery accurate:
- `llms.txt` — curated summary (update feature lists)
- `llms-full.txt` — full content (update detailed descriptions)
- `ai.json` — structured metadata (update capabilities arrays)
- `sitemap.xml` — update `lastmod` date
- `ai.txt` — update `Last updated` date

## Common Gotchas

1. **package.json lists Express/Helmet/CORS** — these are NOT used for the static deployment. They're remnants of an earlier backend architecture. Do not add server-side code unless explicitly requested.
2. **`routes/` and `config/` are empty** — do not add files here unless building a backend.
3. **Anthropic API format differs** — Claude uses `x-api-key` header and `anthropic-version` header, not `Authorization: Bearer`. The `callLLM()` function handles this automatically based on `apiType`.
4. **Generated games must be single HTML files** — no external dependencies, no CDN links, no external images/sounds. All assets must be embedded.
5. **Token limit is 50,000** — do not increase without checking provider limits.
6. **British English** — use "maths", "colour", "customise" etc. throughout the codebase and documentation.