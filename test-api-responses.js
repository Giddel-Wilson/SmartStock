#!/usr/bin/env node

const http = require('http');

console.log('🔍 SmartStock API Debug - Department Permission Check');
console.log('===================================================\n');

// This script tests the actual API responses to debug department permission issues
async function testAPI() {
  console.log('📋 Instructions:');
  console.log('1. Make sure backend server is running (npm start in backend folder)');
  console.log('2. Get your auth token from browser localStorage:');
  console.log('   - Open DevTools (F12)');
  console.log('   - Go to Application → Local Storage');
  console.log('   - Find "smartstock-auth" → state → accessToken');
  console.log('3. Replace TOKEN_HERE below with your actual token');
  console.log('4. Run this script again\n');

  const TOKEN = 'TOKEN_HERE'; // Replace with actual token
  
  if (TOKEN === 'TOKEN_HERE') {
    console.log('❌ Please replace TOKEN_HERE with your actual access token');
    return;
  }

  // Test /api/auth/me to see user data
  console.log('🔍 Testing /api/auth/me endpoint...');
  await testEndpoint('/api/auth/me', TOKEN);
  
  console.log('\n🔍 Testing /api/products endpoint...');
  await testEndpoint('/api/products?limit=5', TOKEN);
}

async function testEndpoint(path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${path} Response:`, JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(`❌ Invalid JSON from ${path}:`, data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error calling ${path}:`, error.message);
      resolve();
    });

    req.end();
  });
}

testAPI().catch(console.error);
