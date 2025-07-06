#!/bin/bash

# SmartStock - Backend Push to Backend Branch
# Run this script AFTER pushing frontend to main

echo "🚀 Setting up Backend push to backend branch..."

# Make sure we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found! Make sure you're in the project root."
    exit 1
fi

# Create and switch to backend branch
echo "🌿 Creating and switching to backend branch..."
git checkout -b backend

# Add all backend files
echo "📦 Adding backend files to staging..."
git add backend/
git add shared/
git add package.json
git add package-lock.json
git add README.md
git add DEPLOYMENT.md
git add .gitignore
git add MIGRATION_COMPLETE.md

# Update README for backend branch
cat > README_BACKEND.md << 'EOF'
# 📦 SmartStock Backend - Node.js API Server

Backend API server for SmartStock inventory management system. Built with Node.js, Express, and PostgreSQL.

## 🚀 Backend Features

### 🔐 **Authentication & Authorization**
- JWT token-based authentication with refresh tokens
- Role-based access control (Admin, Manager, Staff)
- Password hashing with bcrypt
- Secure session management

### 📦 **Inventory Management API**
- Product CRUD operations with validation
- Category management with hierarchical structure
- Inventory tracking and adjustment endpoints
- Low stock alerts and notifications
- SKU and barcode management

### 👥 **User Management**
- User registration and profile management
- Department assignment and management
- Role-based permissions
- User activity logging

### 🗄️ **Database Integration**
- PostgreSQL with Neon cloud hosting
- Database migrations and seed scripts
- Connection pooling and optimization
- Transaction support for data integrity

### 🛡️ **Security Features**
- Rate limiting and CORS protection
- Input validation and sanitization
- SQL injection prevention
- Environment variable configuration

### 📊 **API Endpoints**
- RESTful API design
- Comprehensive error handling
- Request/response logging
- API documentation ready

## 🛠️ Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Environment**: dotenv

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create `.env` file:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
```

### Database Setup
```bash
npm run migrate
npm run seed
```

### Start Server
```bash
npm start
```

## 📁 Project Structure
```
backend/
├── config/          # Database and app configuration
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── migrations/      # Database migration scripts
├── scripts/         # Utility scripts
└── server.js        # Main server file
```

## 🔗 API Integration
This backend is designed to work with the SmartStock React frontend available on the main branch.

Frontend Repository: https://github.com/Giddel-Wilson/SmartStock.git (main branch)
EOF

git add README_BACKEND.md

# Commit backend changes
echo "💾 Committing backend to backend branch..."
git commit -m "feat: SmartStock Backend - Node.js API Server

Backend Features:
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

Tech Stack:
- Backend: Node.js, Express, PostgreSQL (Neon)
- Authentication: JWT with refresh tokens
- Database: Migration scripts and seed data included
- Security: Helmet, CORS, Rate limiting
- Validation: Joi schema validation

API Endpoints:
- /api/auth/* - Authentication endpoints
- /api/users/* - User management
- /api/products/* - Product management
- /api/categories/* - Category management
- /api/departments/* - Department management
- /api/inventory/* - Inventory operations

Ready for production deployment with frontend integration."

# Push backend to backend branch
echo "🚀 Pushing backend to backend branch..."
git push -u origin backend

# Switch back to main branch
echo "🔄 Switching back to main branch..."
git checkout main

echo "✅ Successfully pushed SmartStock Backend to backend branch!"
echo "🔗 Repository: https://github.com/Giddel-Wilson/SmartStock.git"
echo "🌿 Branch: backend"
echo ""
echo "📋 Summary:"
echo "  - Main branch: Frontend (React app)"
echo "  - Backend branch: Backend (Node.js API)"
