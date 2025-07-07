#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing SmartStock Backend CORS Configuration');
console.log('================================================');

// Test 1: Basic health check
const testHealthEndpoint = () => {
  return new Promise((resolve) => {
    console.log('\n1️⃣ Testing health endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   📋 Response: ${data}`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout: Server not responding`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Test 2: CORS preflight check
const testCORSPreflight = () => {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Testing CORS preflight request...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`   📊 Status: ${res.statusCode}`);
      console.log(`   🔍 CORS Headers:`);
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials'
      ];
      
      corsHeaders.forEach(header => {
        const value = res.headers[header];
        if (value) {
          console.log(`      ${header}: ${value}`);
        }
      });
      
      const allowOrigin = res.headers['access-control-allow-origin'];
      if (allowOrigin === 'http://localhost:5173') {
        console.log(`   ✅ CORS correctly configured for localhost:5173`);
        resolve(true);
      } else {
        console.log(`   ❌ CORS misconfigured. Expected: http://localhost:5173, Got: ${allowOrigin}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ⏰ Timeout: Server not responding`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

const main = async () => {
  const healthOk = await testHealthEndpoint();
  const corsOk = await testCORSPreflight();
  
  console.log('\n🏁 Test Results:');
  console.log('================');
  console.log(`Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Configuration: ${corsOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthOk && corsOk) {
    console.log('\n🎉 All tests passed! Your Reports page should now work.');
    console.log('👉 Refresh the browser page: http://localhost:5173/reports');
  } else {
    console.log('\n⚠️  Some tests failed. Try running the restart script:');
    console.log('👉 ./force-restart-backend.sh');
  }
};

main().catch(console.error);
