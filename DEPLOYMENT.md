# 🚀 SmartStock Deployment Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon cloud recommended)
- Git installed

## 📋 Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/Giddel-Wilson/SmartStock.git
cd SmartStock
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Environment Variables
NODE_ENV=production
PORT=3001

# Database Configuration (Neon PostgreSQL)
DATABASE_URL=your_neon_postgresql_connection_string

# Security
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-super-secret-refresh-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Start Development Servers

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

## 🔐 Default Login Credentials
- **Email**: admin@smartstock.com
- **Password**: admin123

## 📱 Features Overview

### ✅ Completed Features
- User authentication and management
- Product and category management
- Inventory tracking and adjustments
- Department management
- Real-time dashboard
- Nigerian Naira (₦) currency support
- Responsive mobile design

### 🚧 Known Issues
- Database connection timeouts (Neon-specific)
- Some inventory adjustment edge cases
- Email notifications not implemented

## 🛠 Production Deployment

### Environment Variables
Ensure all environment variables are properly configured for production:
- Set `NODE_ENV=production`
- Use secure JWT secrets
- Configure proper CORS origins
- Set up SSL certificates

### Database
- Neon PostgreSQL is production-ready
- Ensure connection string is secure
- Run migrations in production environment

### Frontend Build
```bash
cd frontend
npm run build
```

### Backend Process Management
Consider using PM2 for production:
```bash
npm install -g pm2
pm2 start server.js --name smartstock
```

## 🔍 Troubleshooting

### Backend Won't Start
1. Check database connection string
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check logs for specific errors

### Frontend API Errors
1. Verify backend is running on correct port
2. Check CORS configuration
3. Verify JWT tokens are valid
4. Check network connectivity

### Database Issues
1. Verify Neon database is active
2. Check connection string format
3. Ensure SSL is properly configured
4. Verify user permissions

## 📞 Support
For issues or questions, please create an issue on the GitHub repository.
