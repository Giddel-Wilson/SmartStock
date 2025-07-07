#!/usr/bin/env node

// Debug script to test department permission logic
const userFromLogin = {
  "id": "a50e8400-e29b-41d4-a716-446655440002",
  "name": "John Stuffins", 
  "email": "john@smartstock.com",
  "role": "staff",
  "department_id": "92f30684-aefd-40f1-b396-ae7350cd5fc8",
  "department_name": "Information Communication Technology",
  "phone": "+1-555-0102",
  "last_login": "2025-07-07T19:25:47.644Z"
};

const productFromAPI = {
  "id": "62bf43af-ffd6-4be8-87a6-a7b857734443",
  "name": "The Second Shii",
  "department_id": "92f30684-aefd-40f1-b396-ae7350cd5fc8",
  "department_name": "Information Communication Technology"
};

console.log('🔍 Department Permission Debug');
console.log('============================\n');

console.log('User (from API):');
console.log('  departmentId (camelCase):', userFromLogin.departmentId);
console.log('  department_id (snake_case):', userFromLogin.department_id);
console.log('  department_name:', userFromLogin.department_name);
console.log('  role:', userFromLogin.role);

console.log('\nProduct:');
console.log('  department_id:', productFromAPI.department_id);
console.log('  department_name:', productFromAPI.department_name);

console.log('\nField Mapping Issue:');
console.log('  userFromLogin.departmentId === productFromAPI.department_id:', 
  userFromLogin.departmentId === productFromAPI.department_id);

// Simulate the fixed mapping
const userMapped = {
  ...userFromLogin,
  departmentId: userFromLogin.department_id,
  departmentName: userFromLogin.department_name
};

console.log('\nAfter Field Mapping:');
console.log('  userMapped.departmentId:', userMapped.departmentId);
console.log('  userMapped.departmentId === productFromAPI.department_id:', 
  userMapped.departmentId === productFromAPI.department_id);

// Test the permission logic
function canAdjustStock(user, product) {
  if (!user) return false;
  
  // Managers (admins) can adjust stock for any product
  if (user.role === 'manager') return true;
  
  // Staff can only adjust stock for products in their department
  // If product has no department assignment, only admins can adjust
  if (user.role === 'staff') {
    return user.departmentId && product.department_id === user.departmentId;
  }
  
  return false;
}

console.log('\nPermission Test Results:');
console.log('  Before fix - canAdjustStock(userFromLogin, product):', 
  canAdjustStock(userFromLogin, productFromAPI));
console.log('  After fix - canAdjustStock(userMapped, product):', 
  canAdjustStock(userMapped, productFromAPI));

console.log('\n✅ Solution: Map department_id to departmentId during login!');
