// Copy and paste this into your LetzPocket app console (F12)

console.log('🔍 Testing Permissions for dgoldsby@me.com');

// Method 1: Check React DevTools (most reliable)
function checkReactPermissions() {
  try {
    // Get the root React element
    const root = document.querySelector('#root');
    const fiberRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.reactDevtools?.getFiberRoots(root)?.values()?.next()?.value;
    
    if (fiberRoot) {
      // Try to get the AuthContext
      const authContext = fiberRoot?.stateNode?.props?.children?.props?.value;
      
      if (authContext && authContext.user) {
        console.log('✅ Found user via React DevTools:');
        console.log('  Email:', authContext.user.email);
        console.log('  Roles:', authContext.user.roles);
        console.log('  Active Role:', authContext.user.activeRole);
        console.log('  Is Admin:', authContext.user.roles.includes('ADMINISTRATOR'));
        console.log('  Is Landlord:', authContext.user.roles.includes('LANDLORD'));
        
        // Check role context if available
        const roleElement = root.querySelector('[data-role-context]') || root;
        const roleFiber = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.reactDevtools?.getFiberRoots(roleElement)?.values()?.next()?.value;
        const roleContext = roleFiber?.stateNode?.props?.children?.props?.children?.props?.value;
        
        if (roleContext) {
          console.log('🎯 Role Context:');
          console.log('  Active Role:', roleContext.activeRole);
          console.log('  Available Roles:', roleContext.availableRoles);
          console.log('  Can Manage Users:', roleContext.hasPermission('canManageAllUsers'));
          console.log('  Can Access Settings:', roleContext.hasPermission('canAccessSystemSettings'));
          console.log('  Can Manage Properties:', roleContext.hasPermission('canManageProperties'));
        }
        
        return true;
      }
    }
  } catch (error) {
    console.log('❌ React DevTools method failed:', error.message);
  }
  return false;
}

// Method 2: Check Firebase Auth directly
function checkFirebaseAuth() {
  try {
    // Try to access Firebase from the app's scope
    const app = document.querySelector('#root')?._reactInternalInstance?._renderedChildren?._renderedChildren?._renderedComponent?._instance?.props?.value?.app;
    
    if (app && app.auth) {
      const user = app.auth().currentUser;
      if (user) {
        console.log('✅ Found user via Firebase Auth:');
        console.log('  Email:', user.email);
        console.log('  UID:', user.uid);
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Firebase Auth method failed:', error.message);
  }
  return false;
}

// Method 3: Check localStorage and session
function checkLocalData() {
  console.log('🔍 Checking local storage...');
  
  // Check for any auth tokens
  const keys = Object.keys(localStorage);
  const authKeys = keys.filter(key => key.includes('auth') || key.includes('firebase') || key.includes('user'));
  
  if (authKeys.length > 0) {
    console.log('📦 Found auth-related localStorage keys:');
    authKeys.forEach(key => {
      console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...');
    });
  }
  
  // Check for admin override
  const adminOverride = localStorage.getItem('adminOverride');
  if (adminOverride) {
    console.log('🔓 Admin override found for:', adminOverride);
  }
}

// Method 4: Check current URL and page
function checkCurrentPage() {
  console.log('🌐 Current page info:');
  console.log('  URL:', window.location.href);
  console.log('  Path:', window.location.pathname);
  
  // Check if we're on admin page
  if (window.location.pathname.includes('admin') || window.location.href.includes('admin')) {
    console.log('👑 You appear to be on the admin page');
  }
  
  // Check page title
  console.log('  Title:', document.title);
}

// Run all checks
console.log('\n🚀 Running permission checks...\n');

let foundUser = false;
foundUser = checkReactPermissions() || foundUser;
foundUser = checkFirebaseAuth() || foundUser;

checkLocalData();
checkCurrentPage();

if (!foundUser) {
  console.log('\n❌ Could not find user information automatically.');
  console.log('💡 Try these manual checks:');
  console.log('1. Make sure you\'re logged into LetzPocket');
  console.log('2. Open the permissions-test.html file instead');
  console.log('3. Check if React DevTools is installed in your browser');
} else {
  console.log('\n✅ Permission check complete!');
}

// Manual permission check
console.log('\n🔐 Manual Permission Summary:');
console.log('As ADMINISTRATOR + LANDLORD, you should have:');
console.log('✅ Full admin access (manage users, system settings)');
console.log('✅ Property management (as landlord)');
console.log('✅ Analytics and reporting');
console.log('✅ Document processing');
console.log('✅ Workflow management');
