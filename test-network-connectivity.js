#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');

console.log('🌐 SmartStock Network Connectivity Test');
console.log('======================================\n');

// Get all network interfaces
const networkInterfaces = os.networkInterfaces();
const validIPs = [];

for (const interfaceName of Object.keys(networkInterfaces)) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
            validIPs.push(iface.address);
        }
    }
}

console.log('📡 Available Network IPs:');
validIPs.forEach(ip => console.log(`   - ${ip}`));
console.log();

// Test server accessibility from different IPs
async function testServerAccess(ip, port = 3001) {
    return new Promise((resolve) => {
        const url = `http://${ip}:${port}/api/health`;
        console.log(`🔍 Testing: ${url}`);
        
        const request = http.get(url, { timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`   ✅ Status: ${res.statusCode} - ${json.message}`);
                    resolve({ success: true, ip, status: res.statusCode, data: json });
                } catch (e) {
                    console.log(`   ❌ Invalid JSON response: ${data}`);
                    resolve({ success: false, ip, error: 'Invalid JSON' });
                }
            });
        });
        
        request.on('error', (error) => {
            console.log(`   ❌ Error: ${error.message}`);
            resolve({ success: false, ip, error: error.message });
        });
        
        request.on('timeout', () => {
            console.log(`   ❌ Timeout`);
            request.destroy();
            resolve({ success: false, ip, error: 'Timeout' });
        });
    });
}

// Test CORS headers
async function testCORS(ip, port = 3001) {
    return new Promise((resolve) => {
        const options = {
            hostname: ip,
            port: port,
            path: '/api/health',
            method: 'OPTIONS',
            headers: {
                'Origin': `http://${ip}:5173`,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type'
            },
            timeout: 5000
        };
        
        console.log(`🔍 Testing CORS: http://${ip}:${port}/api/health`);
        
        const req = http.request(options, (res) => {
            console.log(`   ✅ CORS Status: ${res.statusCode}`);
            console.log(`   📋 CORS Headers:`);
            console.log(`      Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
            console.log(`      Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
            console.log(`      Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
            resolve({ success: true, ip, headers: res.headers });
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ CORS Error: ${error.message}`);
            resolve({ success: false, ip, error: error.message });
        });
        
        req.on('timeout', () => {
            console.log(`   ❌ CORS Timeout`);
            req.destroy();
            resolve({ success: false, ip, error: 'Timeout' });
        });
        
        req.end();
    });
}

// Main test function
async function runTests() {
    console.log('🔬 Testing Server Accessibility:');
    console.log('--------------------------------');
    
    // Test localhost
    await testServerAccess('localhost');
    await testServerAccess('127.0.0.1');
    
    // Test network IPs
    for (const ip of validIPs) {
        await testServerAccess(ip);
    }
    
    console.log('\n🔬 Testing CORS Configuration:');
    console.log('------------------------------');
    
    // Test CORS for network IPs
    for (const ip of validIPs) {
        await testCORS(ip);
    }
    
    console.log('\n📱 Mobile Device Instructions:');
    console.log('-----------------------------');
    console.log('To access SmartStock from your mobile device:');
    validIPs.forEach(ip => {
        console.log(`   📱 Open: http://${ip}:5173 (Frontend)`);
        console.log(`   🔧 API will connect to: http://${ip}:3001/api`);
    });
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('-----------------------');
    console.log('1. Ensure both devices are on the same Wi-Fi network');
    console.log('2. Check if firewall is blocking port 3001 or 5173');
    console.log('3. Verify the frontend is running on port 5173');
    console.log('4. Clear browser cache on mobile device');
    console.log('5. Try accessing health endpoint directly from mobile browser:');
    validIPs.forEach(ip => {
        console.log(`   http://${ip}:3001/api/health`);
    });
}

runTests().catch(console.error);
