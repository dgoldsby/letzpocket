const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// One-time function to grant admin access to dgoldsby@me.com
exports.grantAdminAccess = functions.https.onRequest(async (req, res) => {
  try {
    const email = 'dgoldsby@me.com';
    
    // Find user by email
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update user roles to include ADMINISTRATOR
    await admin.firestore().collection('users').doc(userId).update({
      roles: ['TENANT', 'LANDLORD', 'ADMINISTRATOR'],
      activeRole: 'ADMINISTRATOR',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      message: 'Admin access granted to dgoldsby@me.com',
      userId: userId
    });
  } catch (error) {
    console.error('Error granting admin access:', error);
    res.status(500).json({ error: 'Failed to grant admin access' });
  }
});
