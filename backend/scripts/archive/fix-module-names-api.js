/**
 * Fix module names using admin API
 * Update "Imishusho" to "Amashusho n'Amabara"
 */
const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': '123', // Development admin key
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function fixModuleNames() {
  console.log("🔧 Fixing module names using admin API...");
  
  try {
    // Get all lessons
    const lessonsResult = await makeRequest('/api/admin/lessons');
    
    if (lessonsResult.status !== 200) {
      console.log("❌ Failed to fetch lessons:", lessonsResult.data);
      return;
    }
    
    const lessons = lessonsResult.data.lessons || [];
    console.log(`Found ${lessons.length} lessons`);
    
    // Find lessons with old module name
    const lessonsToUpdate = lessons.filter(lesson => lesson.module === 'Imishusho');
    console.log(`Found ${lessonsToUpdate.length} lessons to update`);
    
    if (lessonsToUpdate.length === 0) {
      console.log("✅ No lessons need updating");
      return;
    }
    
    // Update each lesson
    let updatedCount = 0;
    for (const lesson of lessonsToUpdate) {
      console.log(`Updating: ${lesson.title}`);
      
      const updateResult = await makeRequest(`/api/admin/lessons/${lesson.id}`, 'PUT', {
        module: 'Amashusho n\'Amabara'
      });
      
      if (updateResult.status === 200) {
        updatedCount++;
        console.log(`  ✅ Updated successfully`);
      } else {
        console.log(`  ❌ Failed to update: ${updateResult.data}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount}/${lessonsToUpdate.length} lessons`);
    
    // Verify the changes
    console.log("\n🔍 Verifying changes...");
    const verifyResult = await makeRequest('/api/lessons');
    
    if (verifyResult.status === 200) {
      const updatedLessons = verifyResult.data.lessons.filter(lesson => lesson.module === 'Amashusho n\'Amabara');
      console.log(`✅ Found ${updatedLessons.length} lessons with updated module name`);
      
      // Show examples
      updatedLessons.slice(0, 3).forEach(lesson => {
        console.log(`  • ${lesson.title} (Module: ${lesson.module})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error updating module names:", error.message);
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
