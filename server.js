const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "taskmanager-caab5",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

const admin = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(admin);
const db = getFirestore(admin);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.sendStatus(403);
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      service: 'Firebase'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Login Endpoint with improved timeout handling
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  let timeoutId;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        code: 'invalid_credentials'
      });
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000); // 10 second timeout
    });

    // Race between the auth operation and timeout
    const customToken = await Promise.race([
      auth.createCustomToken(email),
      timeoutPromise
    ]);

    clearTimeout(timeoutId);
    res.json({ token: customToken });

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Login error:', error);

    if (error.message === 'Request timeout') {
      return res.status(504).json({
        message: 'Request timed out. Please try again.',
        code: 'timeout'
      });
    }

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        message: 'User not found',
        code: 'user_not_found'
      });
    }

    res.status(500).json({
      message: 'Internal server error occurred',
      code: 'internal_error'
    });
  }
});

// Protected Route Example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
