/**
 * Deploy Firebase Rules using CLI
 * Instructions:
 * 1. Run: firebase login (with telesphore91073@gmail.com)
 * 2. Run: node deploy-rules-cli.js
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Deploying Firebase Security Rules using CLI');
console.log('=' .repeat(50));

// Check if firebase.json exists and update it
const firebaseConfig = {
  firestore: {
    rules: "firebase-rules.json"
  },
  projects: {
    default: "menyai-27cfc"
  }
};

fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
console.log('✅ Updated firebase.json configuration');

// Check if rules file exists
const rulesPath = path.join(__dirname, 'firebase-rules.json');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firebase-rules.json not found');
  process.exit(1);
}

console.log('✅ firebase-rules.json found');

// Deploy rules
console.log('\n🚀 Deploying Firestore rules...');
exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Deployment failed:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  stderr:', stderr);
  }
  
  console.log('✅ Deployment output:');
  console.log(stdout);
  
  console.log('\n🎉 Firebase Security Rules deployed successfully!');
  console.log('📋 Your Firebase project is now secure with:');
  console.log('  • User data protection');
  console.log('  • Content access control');
  console.log('  • Admin-only endpoints');
  console.log('  • Data validation');
});
