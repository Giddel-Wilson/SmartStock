#!/bin/bash

# SmartStock - Frontend Push to Main Branch
# Run this script from the project root directory

echo "🚀 Setting up Frontend push to main branch..."

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

# Remove backend directory temporarily for main branch
echo "📦 Preparing frontend-only commit for main branch..."
if [ -d "backend" ]; then
    echo "🗂️ Moving backend to temporary location..."
    mv backend backend_temp
fi

# Add frontend and shared files only
echo "📁 Adding frontend files to staging..."
git add frontend/
git add shared/
git add package.json
git add package-lock.json
git add README.md
git add DEPLOYMENT.md
git add .gitignore
git add setup.sh

# Commit frontend changes
echo "💾 Committing frontend to main branch..."
git commit -m "feat: SmartStock Frontend - React Inventory Management System

Frontend Features:
- React 18 with TypeScript and Vite
- Complete inventory management interface
- User authentication and role-based access
- Responsive design with Tailwind CSS
- Real-time dashboard with metrics
- Nigerian Naira (₦) currency support
- Product and category management
- User and department management
- Inventory tracking and adjustment forms
- Fixed property name consistency (snake_case)
- Mobile-responsive UI with Tailwind CSS
- Toast notifications and error handling

Tech Stack:
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- State Management: Zustand
- HTTP Client: Axios with interceptors
- UI: Tailwind CSS with responsive design
- Forms: React Hook Form with validation
- Notifications: React Hot Toast

Ready for production deployment with backend API integration."

# Push frontend to main branch
echo "🚀 Pushing frontend to main branch..."
git push -u origin main

# Restore backend directory
if [ -d "backend_temp" ]; then
    echo "🔄 Restoring backend directory..."
    mv backend_temp backend
fi

echo "✅ Successfully pushed SmartStock Frontend to main branch!"
echo "🔗 Repository: https://github.com/Giddel-Wilson/SmartStock.git"
echo "🌿 Branch: main (frontend)"
