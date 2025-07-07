// 🔧 SmartStock User Migration Script
// Run this in browser console (F12) if you're still seeing "Different Dept." issues

console.log('🔧 SmartStock User Migration Script');
console.log('==================================');

try {
  // Get current auth data
  const authData = localStorage.getItem('smartstock-auth');
  
  if (!authData) {
    console.log('❌ No auth data found - please log in first');
  } else {
    const parsed = JSON.parse(authData);
    console.log('📊 Current auth data:', parsed);
    
    if (parsed.state?.user) {
      const user = parsed.state.user;
      let needsUpdate = false;
      
      // Check if migration is needed
      if (user.department_id && !user.departmentId) {
        console.log('🔄 Migrating department_id to departmentId');
        user.departmentId = user.department_id;
        delete user.department_id;
        needsUpdate = true;
      }
      
      if (user.department_name && !user.departmentName) {
        console.log('🔄 Migrating department_name to departmentName');
        user.departmentName = user.department_name;
        delete user.department_name;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        localStorage.setItem('smartstock-auth', JSON.stringify(parsed));
        console.log('✅ Migration complete! New user data:', user);
        console.log('🔄 Please refresh the page to apply changes');
      } else {
        console.log('✅ User data is already in correct format');
        console.log('👤 User department info:', {
          departmentId: user.departmentId,
          departmentName: user.departmentName
        });
      }
    }
  }
} catch (error) {
  console.error('❌ Migration error:', error);
}

console.log('\n📋 Next steps:');
console.log('1. Refresh the page');
console.log('2. Go to Inventory page');
console.log('3. Check if "Adjust Stock" appears instead of "Different Dept."');
console.log('4. If still not working, log out and log back in');
