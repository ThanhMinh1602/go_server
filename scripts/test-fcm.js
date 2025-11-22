// Test FCM initialization
require('dotenv').config();
const fcmService = require('../services/fcmService');

console.log('Testing FCM Service...');
console.log('FCM Initialized:', fcmService.isInitialized());

if (fcmService.isInitialized()) {
  console.log('✅ FCM Service is ready!');
  console.log('You can now send push notifications.');
} else {
  console.log('❌ FCM Service is not initialized.');
  console.log('Check your .env file for FIREBASE_SERVICE_ACCOUNT_PATH');
}

