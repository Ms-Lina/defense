/**
 * Fix module names in Firebase lessons
 * Update "Imishusho" to "Amashusho n'Amabara"
 */
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://menyai-app-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function fixModuleNames() {
  console.log("🔧 Fixing module names in Firebase lessons...");
  
  try {
    // Get all lessons
    const lessonsSnapshot = await db.collection('lessons').get();
    
    if (lessonsSnapshot.empty) {
      console.log("No lessons found in Firebase");
      return;
    }
    
    let updatedCount = 0;
    
    // Update each lesson with old module name
    for (const doc of lessonsSnapshot.docs) {
      const lessonData = doc.data();
      
      if (lessonData.module === 'Imishusho') {
        console.log(`Updating lesson: ${lessonData.title}`);
        
        await doc.ref.update({
          module: 'Amashusho n\'Amabara'
        });
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} lessons from 'Imishusho' to 'Amashusho n\'Amabara'`);
    
    // Verify the changes
    console.log("\n🔍 Verifying changes...");
    const updatedSnapshot = await db.collection('lessons')
      .where('module', '==', 'Amashusho n\'Amabara')
      .get();
    
    console.log(`✅ Found ${updatedSnapshot.size} lessons with updated module name`);
    
    // Show a few examples
    updatedSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`  • ${data.title} (Module: ${data.module})`);
    });
    
  } catch (error) {
    console.error("❌ Error updating module names:", error);
  }
}

// Run the fix
fixModuleNames().then(() => {
  console.log("\n🎉 Module name fix completed!");
  process.exit(0);
}).catch(error => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
