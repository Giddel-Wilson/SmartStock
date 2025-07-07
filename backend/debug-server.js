const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all origins (for testing)
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Test endpoint that simulates reports
app.get('/api/reports/test', (req, res) => {
    console.log('📊 Test reports endpoint hit');
    console.log('Origin:', req.headers.origin);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    if (!req.headers.authorization) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    
    res.json({
        message: 'Test reports endpoint working',
        timestamp: new Date().toISOString(),
        requestInfo: {
            origin: req.headers.origin,
            userAgent: req.headers['user-agent'],
            hasAuth: !!req.headers.authorization
        },
        sampleData: {
            summary: {
                totalProducts: 10,
                totalValue: 5000,
                lowStockCount: 2,
                outOfStockCount: 0
            },
            products: [
                { id: 1, name: 'Test Product 1', quantity: 50, price: 100 },
                { id: 2, name: 'Test Product 2', quantity: 2, price: 200 }
            ]
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Debug server running' });
});

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧪 Debug server running on port ${PORT}`);
    console.log(`🌐 Accessible at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://172.20.10.3:${PORT}`);
});
