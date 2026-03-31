/**
 * Simple module name fix using direct HTTP requests
 */
const http = require('http');

function updateLesson(lessonId, newModule) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ module: newModule });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/admin/lessons/${lessonId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Admin-Key': '123'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fixOneLesson() {
  console.log("🔧 Testing module name update...");
  
  try {
    // Test with one lesson ID (you can change this to any lesson with Imishusho module)
    const lessonId = "Rs7CiQWoQw7ALbTgTFJ2"; // This should be the "Umuzingo" lesson
    
    console.log(`Updating lesson ${lessonId}...`);
    const result = await updateLesson(lessonId, 'Amashusho n\'Amabara');
    
    console.log(`Status: ${result.status}`);
    console.log(`Response: ${result.body}`);
    
    if (result.status === 200) {
      console.log("✅ Update successful!");
    } else {
      console.log("❌ Update failed");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixOneLesson();
