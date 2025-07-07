#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing Product API Endpoint');
console.log('==============================\n');

const productId = '62ef43af-ff46-4be8-87a6-a7b857744443';

console.log(`Testing product ID: ${productId}`);
console.log('This is the ID from your edit URL\n');

async function testProductAPI() {
  console.log('📋 Instructions:');
  console.log('1. Make sure backend server is running');
  console.log('2. Get your auth token from browser localStorage:');
  console.log('   - Open DevTools (F12)');
  console.log('   - Application → Local Storage → "smartstock-auth" → state → accessToken');
  console.log('3. Replace TOKEN_HERE below with your actual token');
  console.log('4. Run this script again\n');

  const TOKEN = 'TOKEN_HERE'; // Replace with actual token
  
  if (TOKEN === 'TOKEN_HERE') {
    console.log('❌ Please replace TOKEN_HERE with your actual access token');
    console.log('   You can copy it from the browser DevTools');
    return;
  }

  // Test the specific product endpoint
  console.log(`🔍 Testing GET /api/products/${productId}...`);
  await testEndpoint(`/api/products/${productId}`, TOKEN);
  
  console.log('\n🔍 Testing GET /api/products (all products)...');
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
          console.log(`✅ ${path} Response (Status: ${res.statusCode}):`);
          console.log(JSON.stringify(json, null, 2));
        } catch (e) {
          console.log(`❌ Invalid JSON from ${path} (Status: ${res.statusCode}):`);
          console.log(data);
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

testProductAPI().catch(console.error);
