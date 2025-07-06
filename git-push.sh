#!/bin/bash

# SmartStock - Git Setup and Push Script
# Run this script from the project root directory

echo "🚀 Setting up Git repository for SmartStock..."

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add remote origin if not already added
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/Giddel-Wilson/SmartStock.git
else
    echo "🔗 Remote origin already exists, updating URL..."
    git remote set-url origin https://github.com/Giddel-Wilson/SmartStock.git
fi

# Create and checkout main branch
echo "🌿 Setting up main branch..."
git branch -M main

# Add all files to staging
echo "📦 Adding files to staging..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "feat: Complete SmartStock inventory management system

- Implemented full-stack inventory management with React + Node.js
- Added PostgreSQL database with Neon cloud hosting
- Created user management with JWT authentication
- Built product and category management systems
- Added inventory tracking and adjustment features
- Implemented department management
- Created responsive dashboard with real-time metrics
- Added Nigerian Naira (₦) currency support
- Fixed property name consistency (snake_case) across stack
- Added comprehensive error handling and validation
- Created mobile-responsive UI with Tailwind CSS

Tech Stack:
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL (Neon)
- Authentication: JWT with refresh tokens
- Database: Migration scripts and seed data included
- Deployment: Ready for production deployment"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Successfully pushed SmartStock to GitHub!"
echo "🔗 Repository: https://github.com/Giddel-Wilson/SmartStock.git"
