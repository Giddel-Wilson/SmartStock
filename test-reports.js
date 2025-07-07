#!/usr/bin/env node

const http = require('http');

// Test script to check reports API connectivity
async function testReportsAPI() {
    const baseUrl = 'http://172.20.10.3:3001/api'; // Using network IP
    
    console.log('🧪 Testing Reports API...');
    console.log('Base URL:', baseUrl);
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    try {
        const healthResult = await testEndpoint(`${baseUrl}/health`);
        console.log('Health Status:', healthResult.status);
        console.log('Health Data:', healthResult.data);
    } catch (error) {
        console.error('Health check failed:', error.message);
    }
    
    // Test reports endpoint without auth (should get 401)
    console.log('\n2. Testing reports endpoint (no auth)...');
    try {
        const noAuthResult = await testEndpoint(`${baseUrl}/reports/inventory-summary`);
        console.log('Reports Status (no auth):', noAuthResult.status);
        console.log('Response:', noAuthResult.data);
    } catch (error) {
        console.error('No auth test failed:', error.message);
    }
}

// Test function for API endpoints
async function testEndpoint(url, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMTkzZjY4OS0yZDE3LTc3OTItOGQ4Yi05MTFkNGRiODNjMGMiLCJlbWFpbCI6Im1hbmFnZXJAc21hcnRzdG9jay5jb20iLCJyb2xlIjoibWFuYWdlciIsImlhdCI6MTczNjIzMDI5OCwiZXhwIjoxNzM2MjMzODk4fQ.G_3eofY4a6eT3B7JjhxAHh6VCv5JdwrRcNkKwjYC87k';
  
  const endpoints = [
    'http://localhost:3001/api/reports/inventory-summary',
    'http://localhost:3001/api/reports/low-stock',
    'http://localhost:3001/api/reports/inventory-movements',
    'http://localhost:3001/api/reports/sales-summary'
  ];

  console.log('Testing Reports API Endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const result = await testEndpoint(endpoint, token);
      console.log(`Status: ${result.status}`);
      if (result.status === 200) {
        console.log('✅ Success');
        console.log(`Data sample:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...\n');
      } else {
        console.log('❌ Failed');
        console.log(`Error:`, result.data);
        console.log('');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
