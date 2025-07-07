#!/usr/bin/env node

// Simple server status checker
const http = require('http');

const checkEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    console.log(`\n🔍 Checking ${description}...`);
    console.log(`   URL: http://localhost:3001${path}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   📋 Response:`, parsed);
          } catch (e) {
            console.log(`   📋 Response: ${data.substring(0, 100)}...`);
          }
        }
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout: No response within 3 seconds`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

const main = async () => {
  console.log('🚀 SmartStock Backend Status Check');
  console.log('=====================================');
  
  const endpoints = [
    ['/api/health', 'Health Check'],
    ['/api/categories', 'Categories API'],
    ['/api/inventory/summary', 'Inventory Summary API']
  ];
  
  for (const [path, description] of endpoints) {
    await checkEndpoint(path, description);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n🏁 Status check complete!');
  console.log('\n💡 If all endpoints failed:');
  console.log('   - Check if the backend server is running: cd backend && npm start');
  console.log('   - Check if it\'s running on port 3001: lsof -i :3001');
  console.log('   - Check backend console for error messages');
};

main().catch(console.error);
