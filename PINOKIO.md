# Pinokio: Add This Project

This repository includes a `pinokio.json` manifest in the project root to support one-click installation via Pinokio. The manifest contains basic install and run commands and a pointer to the repository.

Based on my research, here's how you can add your project to Pinokio:

## Method 1: Creating a Pinokio Launcher (Recommended for Community Apps)

Pinokio uses a "click-install" launcher system where you create a manifest file in your GitHub repository. Here's the step-by-step process:

### Step 1: Create Your Project Repository
- Upload your project code to GitHub as a new repository
- Give it a clear, descriptive name (e.g., `your-project.pinokio`)

### Step 2: Create a Pinokio Manifest File (pinokio.json)
You need to create a configuration file called `pinokio.json` in the root of your repository. This file tells Pinokio how to install and run your project.

Here's the `pinokio.json` we included in this repo as a sensible default:

```json
{
  "name": "Game Creator Learn",
  "version": "1.0.0",
  "description": "Educational Game Prompt Orchestrator — generates single-file HTML5 educational games via AI.",
  "dependencies": [
    "git+https://github.com/alvescrafter/game-creator-learn.git"
  ],
  "install_commands": [
    "npm install"
  ],
  "run_commands": [
    "node app.js"
  ],
  "tags": ["game","education","ai","node","express"]
}
```

### Step 3: Upload to Pinokio Community Store
- Push your repository to GitHub (must be public for the community store)
- Visit https://pinokio.co or use the Pinokio desktop launcher
- Add your project to the community store (if a web interface is provided)
- Your project should appear in the Pinokio app directory

## Method 2: Manual Install for Personal Projects
If you just want to run your own project locally without uploading it to the community store:

1. Install Pinokio first (https://desktop.pinokio.co)
2. Open the Pinokio launcher/browser
3. Look for a "Manual Install" or "+" button to add local repositories
4. Enter your GitHub repository URL (or point to this local folder)
5. Click install and follow the prompts

## Important Requirements
- Repository must be public to appear in the community store
- `pinokio.json` configuration file is essential for automatic installation
- Dependencies should be listed in `package.json` or `requirements.txt`
- Install and run commands need to be specified (we've set defaults here)

## Alternative: Add via API
Pinokio also offers an API at `https://pinokio.co/api` for programmatic submissions (refer to Pinokio docs for details).

---

If you'd like, I can:
- Replace the `dependencies` entry with your canonical GitHub repo URL (if different)
- Add environment variable notes if your app requires API keys
- Commit and push these files to GitHub on a feature branch and open a PR for you

Provide the repo URL and whether you want me to push changes, and I will continue.
