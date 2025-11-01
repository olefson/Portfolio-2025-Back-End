# Git Commit Guide for Deployment Files

## Overview

You have **two separate git repositories**:
1. `Portfolio-2025-Back-End/` - Backend repository
2. `Portfolio-2025-Front-End/` - Frontend repository

## Files to Commit

### Backend Repository (`Portfolio-2025-Back-End/`)
- ✅ `ecosystem.config.js` - PM2 configuration for production

### Frontend Repository (`Portfolio-2025-Front-End/`)
- ✅ `ecosystem.config.js` - PM2 configuration for production
- ✅ `src/lib/api.ts` - API utility (if not already tracked)

### Parent Directory (`deploy/` folder)
The `deploy/` folder is in the parent directory which has **no git repository**. 

**Options:**
1. **Copy deploy scripts to each repo** (recommended for separate repos)
2. **Initialize a parent git repo** (if you want to manage both together)
3. **Create a separate deploy repo** (for shared deployment scripts)

## Recommended Approach: Copy to Each Repo

Since you have separate repos, copy the deploy folder to each:

### Option A: Keep Deploy Scripts in Backend (Recommended)
Since the backend typically handles infrastructure, put deploy scripts there:

```bash
# Copy deploy folder to backend
cp -r deploy Portfolio-2025-Back-End/
```

### Option B: Keep in Frontend
Or copy to frontend if you prefer:

```bash
# Copy deploy folder to frontend  
cp -r deploy Portfolio-2025-Front-End/
```

### Option C: Create a Separate Repo
If you want deployment scripts in their own repo, initialize one:

```bash
cd deploy
git init
git add .
git commit -m "Add deployment scripts and configuration"
```

## Step-by-Step Commit Instructions

### Step 1: Commit Backend Changes

```bash
cd Portfolio-2025-Back-End
git add ecosystem.config.js
git commit -m "Add PM2 ecosystem config for production deployment"
git push origin main
```

### Step 2: Commit Frontend Changes

```bash
cd ../Portfolio-2025-Front-End
git add ecosystem.config.js
git add src/lib/api.ts  # If not already tracked
git commit -m "Add PM2 ecosystem config and API utility for production"
git push origin main
```

### Step 3: Handle Deploy Folder (Choose One Option)

**If copying to backend:**
```bash
cd ../Portfolio-2025-Back-End
cp -r ../deploy .
git add deploy/
git commit -m "Add deployment scripts and configuration"
git push origin main
```

**If creating separate repo:**
```bash
cd deploy
git init
git add .
git commit -m "Initial commit: Deployment scripts and configuration"
# Create a new GitHub repo and push
git remote add origin <your-deploy-repo-url>
git push -u origin main
```

## Quick Command Summary

### For Backend:
```bash
cd Portfolio-2025-Back-End
git add ecosystem.config.js
git commit -m "Add PM2 config for production"
git push
```

### For Frontend:
```bash
cd Portfolio-2025-Front-End  
git add ecosystem.config.js src/lib/api.ts
git commit -m "Add PM2 config and API utility"
git push
```

## What NOT to Commit

- ❌ `.env` files (should be in .gitignore)
- ❌ `node_modules/` (already in .gitignore)
- ❌ `dist/` or `.next/` build folders (should be in .gitignore)
- ❌ Uploaded files in `uploads/` (should be in .gitignore)
- ❌ Log files

## Verification

After committing, verify with:

```bash
# In each repo
git status  # Should show "nothing to commit, working tree clean"
git log --oneline -1  # See your latest commit
```

