#!/bin/bash

# SmartStock - Complete Git Setup with Frontend (main) and Backend (backend) branches
# Run this script from the project root directory

echo "🚀 Setting up SmartStock with separate frontend and backend branches..."

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

echo ""
echo "📦 STEP 1: Setting up Frontend on main branch..."
echo "================================================="

# Create and checkout main branch
git branch -M main

# Remove backend directory temporarily for main branch
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
git add *.md

# Commit frontend changes
echo "💾 Committing frontend to main branch..."
git commit -m "feat: SmartStock Frontend - React Inventory Management System

🎯 Frontend Features:
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

🛠️ Tech Stack:
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- State Management: Zustand
- HTTP Client: Axios with interceptors
- UI: Tailwind CSS with responsive design
- Forms: React Hook Form with validation
- Notifications: React Hot Toast

📱 Ready for production deployment with backend API integration."

# Push frontend to main branch
echo "🚀 Pushing frontend to main branch..."
git push -u origin main

# Restore backend directory
if [ -d "backend_temp" ]; then
    echo "🔄 Restoring backend directory..."
    mv backend_temp backend
fi

echo ""
echo "🗄️ STEP 2: Setting up Backend on backend branch..."
echo "=================================================="

# Create and switch to backend branch
echo "🌿 Creating and switching to backend branch..."
git checkout -b backend

# Add all files including backend
echo "📦 Adding all files including backend to staging..."
git add .

# Commit backend changes
echo "💾 Committing complete project to backend branch..."
git commit -m "feat: SmartStock Backend - Complete Node.js API Server

🔐 Backend Features:
- Complete Express.js API with PostgreSQL integration
- JWT authentication with refresh tokens
- Product, category, user, and department management
- Inventory tracking and adjustment endpoints
- Database migration and seed scripts
- Comprehensive error handling and validation
- Role-based access control
- Rate limiting and security middleware
- Nigerian Naira (₦) currency support
- Fixed property name consistency (snake_case)

🛠️ Tech Stack:
- Backend: Node.js, Express, PostgreSQL (Neon)
- Authentication: JWT with refresh tokens
- Database: Migration scripts and seed data included
- Security: Helmet, CORS, Rate limiting
- Validation: Joi schema validation

🔌 API Endpoints:
- /api/auth/* - Authentication endpoints
- /api/users/* - User management
- /api/products/* - Product management
- /api/categories/* - Category management
- /api/departments/* - Department management
- /api/inventory/* - Inventory operations

🚀 Ready for production deployment with frontend integration."

# Push backend to backend branch
echo "🚀 Pushing backend to backend branch..."
git push -u origin backend

# Switch back to main branch
echo "🔄 Switching back to main branch..."
git checkout main

echo ""
echo "✅ SUCCESS! SmartStock has been pushed to GitHub!"
echo "=============================================="
echo "🔗 Repository: https://github.com/Giddel-Wilson/SmartStock.git"
echo ""
echo "📋 Branch Structure:"
echo "  🌿 main branch    → Frontend only (React app)"
echo "  🌿 backend branch → Complete project (Frontend + Backend)"
echo ""
echo "🚀 Next Steps:"
echo "  1. Frontend deployment: Use main branch"
echo "  2. Backend deployment: Use backend branch"
echo "  3. Full development: Clone backend branch"
