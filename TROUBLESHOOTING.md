# SmartStock Troubleshooting Guide

## Reports Page Authentication Error

If you're seeing "Error Loading Report - Authentication required. Please login again." on the Reports page, here's how to fix it:

### Step 1: Check if Backend Server is Running
The most common cause is that the backend server is not running.

**Quick Fix:**
```bash
./quick-start.sh
```

**Manual Start:**
```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend
cd frontend
npm run dev
```

### Step 2: Check Authentication
If the backend is running but you still see authentication errors:

1. **Clear Browser Storage:**
   - Open browser dev tools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage for localhost:5173
   - Refresh the page

2. **Login Again:**
   - Click "Go to Login" button
   - Use these test credentials:
     - Email: `admin@smartstock.com`
     - Password: `admin123`

### Step 3: Verify Backend Health
Check if the backend is responding:
```bash
curl http://localhost:3001/api/health
```

### Step 4: Check Database Connection
If the backend starts but APIs fail:
```bash
cd backend
node test-db.js
```

## Common Issues

### Backend Won't Start
- Check if port 3001 is already in use: `lsof -i :3001`
- Check backend/.env file exists with correct database URL
- Run `npm install` in backend directory

### Frontend Won't Start
- Check if port 5173 is already in use: `lsof -i :5173`
- Run `npm install` in frontend directory

### Database Issues
- Check your Neon PostgreSQL connection string
- Verify the database is accessible
- Run migration scripts if needed

## Quick Commands

**Start everything:**
```bash
./quick-start.sh
```

**Stop everything:**
```bash
pkill -f "node.*server.js" && pkill -f "vite.*dev"
```

**Reset and restart:**
```bash
pkill -f "node.*server.js" && pkill -f "vite.*dev"
sleep 2
./quick-start.sh
```

**Test API endpoints:**
```bash
node test-reports.js
```
