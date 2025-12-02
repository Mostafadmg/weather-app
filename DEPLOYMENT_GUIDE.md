# Complete Explanation: Vite Deployment Problem & Solution

## The Original Problem

You built a weather app locally with Vite, Tailwind CSS v4, and SCSS. Everything worked fine on your local dev server (npm run dev), but when you deployed it to GitHub Pages, only plain HTML showed up - no CSS, no styling, no colors, nothing.

---

## Understanding the Root Cause

When you deploy a Vite app to GitHub Pages, there are three critical things that must align:

1. Where your files are located (the repository structure)
2. What path URLs your built HTML files reference (like /weather-app/assets/style.css)
3. Where GitHub Pages actually serves files from

If these three things don't match, the browser tries to load CSS from the wrong URL, gets a 404 error, and you see plain HTML.

---

## Step-by-Step: What Happened & How I Fixed It

### Step 1: The Initial Setup Problem

**What you had:**

- Your Vite project was in a folder: `c:\Users\Owner\OneDrive\Desktop\weather-app-main`
- When you ran `npm run build`, Vite created a `dist` folder with the production files
- The GitHub repository was: `https://github.com/Mostafadmg/weather-app`

**The issue:**
When you first tried to deploy, you probably tried to use GitHub Pages "Deploy from a branch" mode, selecting either:

- Branch: main, Folder: /(root) - This serves from the root of your repo
- Branch: main, Folder: /dist - This tries to serve from a dist folder in your repo

**Why it failed:**
Because GitHub Pages needs the dist folder to be committed to your repo for this to work, BUT your .gitignore file had dist in it (which is correct practice), so the built files never made it to GitHub.

---

### Step 2: Configuring the Base Path

**What I did first:**
I updated your `vite.config.js` to include:

```javascript
export default {
  base: "/weather-app/",
  css: {
    devSourcemap: true,
  },
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
};
```

**Why this matters:**
GitHub Pages serves your site at `https://mostafadmg.github.io/weather-app/`, NOT at the root domain.

Without the base setting, Vite builds HTML that looks for CSS at:

```html
<link rel="stylesheet" href="/assets/index.css" />
```

This tries to load from `https://mostafadmg.github.io/assets/index.css` (WRONG - doesn't exist)

With `base: '/weather-app/'`, Vite builds HTML that looks for CSS at:

```html
<link rel="stylesheet" href="/weather-app/assets/index.css" />
```

This correctly loads from `https://mostafadmg.github.io/weather-app/assets/index.css` (CORRECT)

---

### Step 3: The Deployment Strategy Problem

**The dilemma:**

- We need the dist folder on GitHub Pages to serve files
- But we DON'T want to commit dist to our repo (bad practice - it's a build artifact)

**Traditional solution that doesn't work well:**
Remove dist from .gitignore and commit it → This clutters your repo with generated files every time you build.

**The modern solution - GitHub Actions:**
Use automated deployment that:

1. Takes your source code from GitHub
2. Runs `npm install` to get dependencies
3. Runs `npm run build` to create the dist folder fresh
4. Deploys just the dist folder to GitHub Pages
5. Never commits dist to your main branch

---

### Step 4: Creating the GitHub Actions Workflow

**What I created:**
A file at `.github/workflows/deploy.yml` with this workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**What each part does:**

- **`on: push: branches: - main`**: "Run this workflow every time someone pushes code to the main branch"

- **`permissions:`**: Tells GitHub Actions what it's allowed to do (read code, write to Pages)

- **`environment: name: github-pages`**: This was the CRITICAL FIX for the first deployment failure. When you saw "Error: Missing environment", it was because this line was missing. GitHub Pages requires this specific environment configuration.

- **`steps:`**: A sequential list of commands to run

  1. **Checkout**: Downloads your repository code to the GitHub Actions server

  2. **Setup Node**: Installs Node.js version 20 so we can run npm commands

  3. **Install dependencies**: Runs `npm ci` (clean install) to get all your packages (Vite, Tailwind, Sass, etc.)

  4. **Build**: Runs `npm run build` which executes Vite's build process:

     - Compiles your SCSS to CSS
     - Processes Tailwind CSS
     - Bundles JavaScript
     - Optimizes assets
     - Creates the dist folder with all production files

  5. **Setup Pages**: Configures GitHub Pages settings

  6. **Upload artifact**: Packages the dist folder to deploy

  7. **Deploy**: Actually publishes to GitHub Pages

---

### Step 5: Configuring GitHub Pages Settings

**What you had to do:**
Go to `https://github.com/Mostafadmg/weather-app/settings/pages` and change:

**From:**

- Source: "Deploy from a branch"
- Branch: main
- Folder: /(root) or /dist

**To:**

- Source: **"GitHub Actions"**

**Why this matters:**
This tells GitHub: "Don't try to serve files directly from my repository. Instead, let the GitHub Actions workflow handle building and deploying."

---

### Step 6: The First Deployment Error

**What happened:**
The first deployment failed with: "Error: Missing environment"

**Why it failed:**
The initial workflow file I created was missing this section:

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

**Why this is required:**
GitHub Pages deployments need to be associated with an "environment" for security and tracking. The `github-pages` environment is special - it's automatically created by GitHub and has the necessary permissions to deploy.

**The fix:**
I added those 3 lines to the workflow under the `deploy:` job, pushed the change, and the workflow ran again successfully.

---

### Step 7: Why the CSS Finally Works

After the workflow completes successfully, here's what happens:

1. **Your workflow runs** on GitHub's servers:

   - Installs dependencies
   - Compiles all your SCSS to CSS
   - Processes Tailwind CSS (generates all the utility classes)
   - Bundles everything with the correct paths (`/weather-app/assets/...`)

2. **GitHub Pages receives** the built `dist` folder with:

   ```
   dist/
   ├── index.html (with correct paths like /weather-app/assets/style.css)
   ├── assets/
   │   ├── index-C5ZynD-G.css (your compiled CSS with Tailwind + SCSS)
   │   ├── index-CQV0l4jb.js (your JavaScript)
   │   ├── logo-hk6Dn71M.svg
   │   └── other optimized assets...
   ```

3. **When someone visits** `https://mostafadmg.github.io/weather-app/`:
   - They get `index.html`
   - Their browser sees `<link href="/weather-app/assets/index-C5ZynD-G.css">`
   - Browser requests: `https://mostafadmg.github.io/weather-app/assets/index-C5ZynD-G.css`
   - ✅ GitHub Pages serves the CSS file correctly
   - Your styling appears!

---

## Why This Approach is Better Than Alternatives

### Alternative 1: Commit dist folder

```
❌ Problems:
- Repo gets bloated with generated files
- Merge conflicts on build artifacts
- Mixed source and built code in version control
```

### Alternative 2: Manual building and uploading

```
❌ Problems:
- Have to remember to build locally
- Manual upload to GitHub
- Risk of forgetting to build or building with wrong settings
```

### GitHub Actions approach ✅

```
✅ Benefits:
- Automatic deployment on every push
- Always uses latest code
- Consistent build environment
- No generated files in repo
- Works for all collaborators
```

---

## Key Learning Points for Problem-Solving

### 1. Understanding URL Paths

- `/style.css` = absolute path from domain root
- `./style.css` = relative path from current file
- When deploying to a subdirectory (`/weather-app/`), you need base paths configured

### 2. Build vs. Source Files

- **Source**: Your `.vue`, `.scss`, `.jsx` files you write
- **Built**: The compiled `.html`, `.css`, `.js` files browsers use
- Deployment serves built files, not source files

### 3. Reading Error Messages

- "Missing environment" → Tells us exactly what's missing
- "404 Not Found" on CSS → File path mismatch
- Console errors in browser DevTools show what's failing to load

### 4. GitHub Actions Workflow Structure

```yaml
on: [when to run]
permissions: [what it can do]
jobs:
  job-name:
    runs-on: [what computer to use]
    steps:
      - [list of commands]
```

### 5. Debugging Deployment Issues

1. Check browser DevTools Console (F12) for 404 errors
2. Look at Network tab to see what's trying to load
3. Compare expected URL vs. actual URL
4. Check GitHub Actions logs for build errors
5. Verify configuration matches deployment method

---

## Summary of the Complete Solution

1. ✅ Set `base: '/weather-app/'` in `vite.config.js`
2. ✅ Created `.github/workflows/deploy.yml` with proper environment configuration
3. ✅ Set GitHub Pages source to "GitHub Actions"
4. ✅ Every push to `main` automatically rebuilds and deploys
5. ✅ CSS loads correctly because paths match deployment location

The site now works at `https://mostafadmg.github.io/weather-app/` with all styling intact!

---

## Quick Reference Commands

### Building locally:

```bash
npm run build
```

### Deploying (automatic):

```bash
git add .
git commit -m "Your message"
git push
```

### Checking deployment:

- Visit: https://github.com/Mostafadmg/weather-app/actions
- View site: https://mostafadmg.github.io/weather-app/

---

_Deployment guide created: December 2, 2025_
