// Delete all users from Firebase Authentication and Firestore
// Run this with: node delete-all-users.js

const admin = require('firebase-admin');
const serviceAccount = require('./letzpocket-site-firebase-adminsdk.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'letzpocket-site'
});

const auth = admin.auth();
const firestore = admin.firestore();

async function deleteAllUsers() {
  try {
    console.log('🔍 Fetching all users from Firebase Auth...');
    
    // List all users
    const listUsersResult = await auth.listUsers(1000);
    const users = listUsersResult.users;
    
    console.log(`Found ${users.length} users to delete:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (UID: ${user.uid})`);
    });
    
    // Delete from Firestore first
    console.log('\n🗑️ Deleting from Firestore...');
    const usersCollection = await firestore.collection('users').get();
    
    for (const doc of usersCollection.docs) {
      await firestore.collection('users').doc(doc.id).delete();
      console.log(`  Deleted Firestore document: ${doc.id}`);
    }
    
    // Delete from Firebase Auth
    console.log('\n🗑️ Deleting from Firebase Auth...');
    for (const user of users) {
      await auth.deleteUser(user.uid);
      console.log(`  Deleted Auth user: ${user.email}`);
    }
    
    console.log('\n✅ All users deleted successfully!');
    console.log('You can now create a fresh account.');
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
  }
}

// Run the deletion
deleteAllUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
