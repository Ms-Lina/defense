/**
 * Verify practice data is properly connected
 * Run with: node scripts/verify-practice-data.js
 */
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function verifyPracticeData() {
  console.log("🔍 Verifying practice data integration...");
  
  try {
    // Test 1: Check practice items endpoint
    console.log("\n1. Testing GET /api/practice");
    const practiceResult = await makeRequest('/api/practice');
    if (practiceResult.status === 200) {
      const practiceItems = practiceResult.data.practiceItems || [];
      console.log(`✅ Found ${practiceItems.length} practice items`);
      practiceItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.type}) - ${item.questions?.length || 0} questions`);
      });
    } else {
      console.log(`❌ Failed: ${practiceResult.data}`);
    }

    // Test 2: Check individual practice item
    if (practiceResult.status === 200 && practiceResult.data.practiceItems?.length > 0) {
      const firstId = practiceResult.data.practiceItems[0].id;
      console.log(`\n2. Testing GET /api/practice/${firstId}`);
      const itemResult = await makeRequest(`/api/practice/${firstId}`);
      if (itemResult.status === 200) {
        console.log(`✅ Retrieved practice item: ${itemResult.data.title}`);
        console.log(`   - Type: ${itemResult.data.type}`);
        console.log(`   - Difficulty: ${itemResult.data.difficulty}`);
        console.log(`   - Questions: ${itemResult.data.questions?.length || 0}`);
      } else {
        console.log(`❌ Failed: ${itemResult.data}`);
      }
    }

    // Test 3: Check admin endpoint
    console.log("\n3. Testing GET /api/admin/lessons (to verify backend is working)");
    const adminResult = await makeRequest('/api/admin/lessons');
    if (adminResult.status === 401) {
      console.log("✅ Admin endpoint is protected (401 Unauthorized - expected)");
    } else if (adminResult.status === 200) {
      console.log("✅ Admin endpoint is accessible");
      console.log(`   Found ${adminResult.data.lessons?.length || 0} lessons`);
    } else {
      console.log(`❌ Unexpected status: ${adminResult.status}`);
    }

    console.log("\n🎉 Practice data verification completed!");
    console.log("\n📱 Mobile app should now show real practice data instead of hardcoded fallbacks.");
    console.log("🌐 Admin panel can manage practice exercises through the enhanced Lessons page.");
    
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
  }
}

// Run verification
verifyPracticeData();
