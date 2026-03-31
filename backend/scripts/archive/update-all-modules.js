/**
 * Update all lessons with old module name to new one
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

function getLessons() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/lessons',
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
          resolve(response.lessons || []);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateAllLessons() {
  console.log("🔧 Updating all lessons with old module name...");
  
  try {
    const lessons = await getLessons();
    const lessonsToUpdate = lessons.filter(lesson => lesson.module === 'Imishusho');
    
    console.log(`Found ${lessonsToUpdate.length} lessons to update:`);
    lessonsToUpdate.forEach(lesson => {
      console.log(`  • ${lesson.title}`);
    });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const lesson of lessonsToUpdate) {
      try {
        console.log(`\nUpdating: ${lesson.title} (${lesson.id})`);
        const result = await updateLesson(lesson.id, 'Amashusho n\'Amabara');
        
        if (result.status === 200) {
          console.log(`  ✅ Success`);
          successCount++;
        } else {
          console.log(`  ❌ Failed: ${result.status}`);
          failCount++;
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failCount++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Failed to update: ${failCount}`);
    
    // Verify
    console.log(`\n🔍 Verifying updates...`);
    const updatedLessons = await getLessons();
    const newModuleCount = updatedLessons.filter(lesson => lesson.module === 'Amashusho n\'Amabara').length;
    const oldModuleCount = updatedLessons.filter(lesson => lesson.module === 'Imishusho').length;
    
    console.log(`  Lessons with 'Amashusho n\'Amabara': ${newModuleCount}`);
    console.log(`  Lessons with 'Imishusho': ${oldModuleCount}`);
    
    if (oldModuleCount === 0) {
      console.log(`\n🎉 All lessons successfully updated!`);
    } else {
      console.log(`\n⚠️  ${oldModuleCount} lessons still need updating`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

updateAllLessons();
