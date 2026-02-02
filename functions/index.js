const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Mailchimp configuration - use environment variables
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX || 'us6';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

// Mailchimp subscription endpoint
exports.subscribe = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, firstName, lastName, source } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const member = {
      email_address: email,
      status: 'pending', // Requires email confirmation
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
        SIGNUP_SOURCE: source || 'landing_page',
        ADDRESS: '' // Required field for this audience
      },
      tags: ['Landing Page']
    };

    const response = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(member)
      }
    );

    const data = await response.json();

    if (response.ok) {
      res.json({
        success: true,
        message: 'Please check your email to confirm your subscription!',
        data
      });
    } else {
      // Handle specific Mailchimp errors
      if (data.title === 'Member Exists') {
        res.json({
          success: true,
          message: 'You\'re already subscribed! Check your email for the latest updates.'
        });
      } else {
        res.status(400).json({
          success: false,
          message: data.detail || 'Failed to subscribe. Please try again.'
        });
      }
    }
  } catch (error) {
    console.error('Mailchimp subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
});

// Health check endpoint
exports.health = functions.https.onRequest((req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'LetzPocket Mailchimp Proxy'
  });
});

// Update user roles (admin only)
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  // Check if caller is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const callerData = callerDoc.data();
  if (!callerData.roles.includes('ADMINISTRATOR')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // Update target user roles
  const { targetUserId, roles, activeRole } = data;
  
  if (!targetUserId || !roles || !Array.isArray(roles)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input');
  }

  try {
    await admin.firestore().collection('users').doc(targetUserId).update({
      roles: roles,
      activeRole: activeRole || roles[0],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'User roles updated successfully' };
  } catch (error) {
    console.error('Error updating user roles:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user roles');
  }
});

// Get user by email for admin lookup
exports.getUserByEmail = functions.https.onCall(async (data, context) => {
  // Check if caller is admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const callerData = callerDoc.data();
  if (!callerData.roles.includes('ADMINISTRATOR')) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userDoc = usersSnapshot.docs[0];
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get user');
  }
});
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

// OpenAI chat completion endpoint
exports.chat = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, model = 'gpt-3.5-turbo', max_tokens = 500, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    console.log('OpenAI request:', { model, messages: messages.length, max_tokens, temperature });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('OpenAI response successful');
      res.json(data);
    } else {
      console.error('OpenAI API error:', data);
      res.status(response.status).json({
        error: data.error?.message || 'Failed to get response from OpenAI',
        details: data
      });
    }
  } catch (error) {
    console.error('Chat function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
