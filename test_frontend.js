// Test script to simulate frontend API calls
const axios = require('axios');

async function testFrontendAPI() {
  try {
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post('http://localhost:5173/api/auth/login', {
      email: 'admin@smartstock.com',
      password: 'SecurePassword123!'
    });
    
    console.log('✅ Login successful');
    const accessToken = loginResponse.data.accessToken;
    
    // Test get products
    console.log('2. Testing get products...');
    const productsResponse = await axios.get('http://localhost:5173/api/products', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Get products successful, count:', productsResponse.data.products.length);
    
    // Test get categories
    console.log('3. Testing get categories...');
    const categoriesResponse = await axios.get('http://localhost:5173/api/categories', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Get categories successful, count:', categoriesResponse.data.categories.length);
    
    // Test create product
    console.log('4. Testing create product...');
    const createProductResponse = await axios.post('http://localhost:5173/api/products', {
      name: 'Frontend Test Product',
      sku: 'FTP-001',
      categoryId: '650e8400-e29b-41d4-a716-446655440001',
      unitPrice: 1999.99,
      quantity: 50,
      lowStockThreshold: 15,
      supplier: 'Frontend Test Supplier',
      description: 'Testing product creation through frontend proxy'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Create product successful:', createProductResponse.data.product.name);
    
    console.log('\n🎉 All frontend API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendAPI();
