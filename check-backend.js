#!/usr/bin/env node

const http = require('http');

// Check if backend is running
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

console.log('🔍 Checking if backend server is running...');

const req = http.request(options, (res) => {
  console.log('✅ Backend server is running!');
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.log('❌ Backend server is NOT running');
  console.log('Error:', err.message);
  console.log('\n💡 To start the backend server:');
  console.log('   cd backend && npm start');
  console.log('   or run: ./start-dev.sh');
});

req.on('timeout', () => {
  console.log('⏰ Request timed out - server may not be responding');
  req.destroy();
});

req.end();
