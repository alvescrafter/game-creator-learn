# 🎓 Game Creator Learn — How to Use Guide

Game Creator Learn is an **Educational Game Prompt Orchestrator** that helps you design and generate complete, playable educational games using AI. You configure learning parameters through an intuitive sidebar, and the app assembles a detailed prompt that's sent to your chosen AI model to generate a fully playable HTML5 educational game.

---

## 🚀 Quick Start

### 1. Set Up Your API Key
Before generating anything, you need to connect an AI provider:

1. Click the **⚙️ Settings** button in the top-right header (or press `Ctrl + ,`)
2. Choose a provider:
   - **🟢 OpenAI** — GPT-4o, GPT-4, GPT-3.5 Turbo, etc.
   - **🔵 Gemini** — Google's Gemini models via OpenAI-compatible endpoint
   - **🟠 Claude** — Anthropic's Claude models via OpenAI-compatible endpoint
   - **🦙 Ollama** — Run local LLMs (no API key needed!)
   - **🟣 LM Studio** — Another local LLM option (no API key needed!)
3. Enter your **API Key** (not needed for Ollama/LM Studio)
4. Select a **Model** from the quick-select dropdown or type a custom one
5. Adjust **Temperature** if desired (higher = more creative, lower = more precise)
6. Click **Save**

### 2. Configure Your Educational Game
Use the **left sidebar** to define your educational game across 6 modules:

| Module | What It Controls |
|--------|-----------------|
| 📚 **Educational Topic** | Subject, specific topic, and learning objective |
| 📊 **Difficulty & Age Range** | Target age range, difficulty level, and accessibility notes |
| 🎯 **Core Identity** | Game type, setting/theme, and tone (serious ↔ playful) |
| ⚙️ **Mechanics & Gameplay** | Game mechanics (tags), specific rules, difficulty curve |
| 🎨 **Visual & Aesthetic** | Art style, color palette, visual effects |
| 🔊 **Audio & Soundscape** | Music mood, sound effects |

> **Tip:** Each module has a **toggle switch** — turn off any module you don't want included in the prompt.

### 3. Generate Your Educational Game
- Click the **⚡ Generate Educational Game** button in the header (or press `Ctrl + Enter`)
- The app assembles your configuration into a detailed prompt and sends it to the AI
- Once generated, the game appears in the **🎮 Game Sandbox** tab on the right
- The assembled prompt is visible in the **📝 Prompt Preview** tab

### 4. Refine Your Game
After generating, use the **Refine bar** at the bottom of the sandbox:
- Type a change request like *"Add a quiz at the end of each level"* or *"Make the questions easier for younger students"*
- Click **🔄 Refine** or press `Enter`
- The AI will regenerate the game with your changes applied

---

## 📋 Sidebar Modules — Detailed

### 📚 Educational Topic
| Field | Description |
|-------|-------------|
| **Subject** | Select from 12 subjects: Maths, English, Physics, Biology, Chemistry, History, Geography, Computer Science, Art, Music, Foreign Languages, Other |
| **Specific Topic** | Free text — describe the specific topic (e.g. "Fractions", "Photosynthesis", "Shakespeare's Sonnets") |
| **Learning Objective** | Free text — what the student should learn (e.g. "Understand how to add fractions with different denominators") |

> **This is the most important module!** The educational topic drives the entire game's learning content. Always fill this in for the best results.

### 📊 Difficulty & Age Range
| Field | Description |
|-------|-------------|
| **Age Range** | Select the target age group: 5–8 years (KS1/Early), 9–11 years (KS2/Primary), 12–15 years (KS3/Lower Secondary), 16–18 years (KS4-5/GCSE–A Level), University, Masters/Postgraduate |
| **Difficulty Level** | Beginner, Intermediate, Advanced, or Expert |
| **Accessibility Notes** | Free text — specify accessibility needs (e.g. "Dyslexia-friendly fonts", "Colour-blind safe", "Large text for young readers") |

> **Tip:** The age range affects vocabulary complexity, content depth, and UI design. The AI will automatically adjust language and difficulty to match the selected age group.

### 🎯 Core Identity
| Field | Description |
|-------|-------------|
| **Game Type** | Select from 12 game types: Quiz/Trivia, Platformer, Puzzle, RPG, Simulation, Adventure, Strategy, Racing, Idle/Incremental, Visual Novel, Escape Room, Card Game |
| **Setting / Theme** | Free text — describe your game world (e.g. "Space Explorer Maths", "Chemistry Lab Adventure") |
| **Tone** | Slider from 🌑 Serious/Academic (0) to Playful/Fun (100) |

### ⚙️ Mechanics & Gameplay
| Field | Description |
|-------|-------------|
| **Mechanics** | Click-to-toggle tags: Quiz System, Drag & Drop, Matching, Fill-in-the-Blank, Multiple Choice, Scoring System, Progress Tracking, Hint System, Leveling Up, Health Bar, Timer, Collectibles, Dialogue System, Physics, Procedural Generation |
| **Specific Rules** | Free text — custom rules (e.g. "Player earns stars for correct answers, loses a life for wrong ones") |
| **Difficulty Curve** | Linear, Exponential, Adaptive (adjusts to learner), or S-Curve |

### 🎨 Visual & Aesthetic
| Field | Description |
|-------|-------------|
| **Art Style** | Pixel Art, Minimalist Vector, ASCII, Low-Poly 3D, Hand-drawn, Flat Design, Retro CRT, Neon Glow, Cartoon, Whiteboard/Chalkboard |
| **Color Palette** | Pick Primary, Secondary, and Background colors |
| **Visual Effects** | Free text — describe VFX (e.g. "Confetti on correct answer", "Star particles on level up") |

### 🔊 Audio & Soundscape
| Field | Description |
|-------|-------------|
| **Music Mood** | Lo-fi, Orchestral, 8-bit/Chiptune, Cheerful, Ambient, No Music |
| **SFX Requirements** | Free text — describe sound effects (e.g. "Ding for correct answer", "Buzz for wrong answer") |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Generate Educational Game |
| `Ctrl + B` | Toggle Sidebar |
| `Ctrl + H` | Open History |
| `Ctrl + T` | Open Templates |
| `Ctrl + ,` | Open API Settings |
| `Escape` | Close modals / Exit fullscreen |

---

## 🎓 Educational Game Best Practices

### Choosing the Right Game Type
- **Quiz/Trivia** — Best for knowledge recall and fact-based learning (vocabulary, dates, definitions)
- **Puzzle** — Great for problem-solving and logical thinking (maths, coding concepts)
- **Platformer** — Engaging for younger learners; combine movement with subject challenges
- **Simulation** — Ideal for science experiments, historical scenarios, and real-world applications
- **Escape Room** — Excellent for collaborative problem-solving and critical thinking
- **Card Game** — Good for matching, categorisation, and memory-based learning

### Setting Age-Appropriate Content
- **5–8 years**: Simple vocabulary, large text, bright colours, short activities, lots of positive reinforcement
- **9–11 years**: More complex concepts, longer activities, introduction of scoring systems
- **12–15 years**: Abstract thinking, multi-step problems, competitive elements
- **16–18 years**: Exam-revision style, detailed feedback, progress tracking
- **University**: Complex scenarios, research-based challenges, in-depth analysis
- **Masters/Postgraduate**: Advanced simulations, case studies, professional-level content

### Writing Effective Learning Objectives
Good learning objectives are specific and measurable:
- ✅ "Understand how to add fractions with different denominators"
- ✅ "Identify the main organs of the human digestive system"
- ✅ "Apply Newton's second law to calculate force"
- ❌ "Learn about maths" (too vague)
- ❌ "Know science" (not measurable)

---

## 💡 Example Configurations

### Maths Quiz for 9-11 Year Olds
- **Subject**: Maths
- **Topic**: Multiplication Tables
- **Learning Objective**: "Recall multiplication facts up to 12×12 quickly and accurately"
- **Age Range**: 9–11 years (KS2/Primary)
- **Difficulty**: Beginner
- **Game Type**: Quiz
- **Mechanics**: Quiz System, Scoring System, Timer, Progress Tracking

### Biology Escape Room for 16-18 Year Olds
- **Subject**: Biology
- **Topic**: Cell Biology
- **Learning Objective**: "Identify organelles and explain their functions in eukaryotic cells"
- **Age Range**: 16–18 years (KS4-5/GCSE–A Level)
- **Difficulty**: Advanced
- **Game Type**: Escape Room
- **Mechanics**: Hint System, Dialogue System, Progress Tracking, Scoring System

### Physics Platformer for 12-15 Year Olds
- **Subject**: Physics
- **Topic**: Forces and Motion
- **Learning Objective**: "Apply the relationship between force, mass, and acceleration"
- **Age Range**: 12–15 years (KS3/Lower Secondary)
- **Difficulty**: Intermediate
- **Game Type**: Platformer
- **Mechanics**: Physics, Collectibles, Leveling Up, Progress Tracking

---

## 🔧 Technical Details

- All games are generated as **single HTML files** containing all CSS and JavaScript
- Games use **Vanilla JS/Canvas** for rendering and game logic
- No external dependencies or build tools required
- Games run directly in the browser — just open the downloaded HTML file
- API keys are stored in **localStorage only** and never sent to any server except your chosen API provider
- The app uses separate localStorage keys from the original Game Creator, so both can coexist without conflicts