const express = require('express');
const cors = require('cors');
const helmet = req// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
// app.use('/api/reports', reportRoutes);lmet');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const http = require('http');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth-temp');
// const userRoutes = require('./routes/users');
// const departmentRoutes = require('./routes/departments');
// const categoryRoutes = require('./routes/categories');
// const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory-temp');
// const reportRoutes = require('./routes/reports');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Import database (but don't wait for connection)
// const db = require('./config/database');

const app = express();
const server = http.createServer(app);

// WebSocket setup for real-time notifications
const wss = new WebSocket.Server({ server });

// Store WebSocket connections
global.wsConnections = new Map();

wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'auth' && data.userId) {
                global.wsConnections.set(data.userId, ws);
                console.log(`User ${data.userId} connected via WebSocket`);
            }
        } catch (error) {
            console.error('WebSocket message parsing error:', error);
        }
    });
    
    ws.on('close', () => {
        // Remove connection from map
        for (const [userId, connection] of global.wsConnections.entries()) {
            if (connection === ws) {
                global.wsConnections.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl 
    });
});

const PORT = process.env.PORT || 5001;

// Start server
server.listen(PORT, () => {
    console.log(`🚀 SmartStock Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 WebSocket server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        // db.end();
        process.exit(0);
    });
});

module.exports = app;
