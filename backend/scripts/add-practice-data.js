/**
 * Simple script to add practice data via HTTP API
 * Run with: node scripts/add-practice-data.js
 */
const http = require('http');

const practiceData = [
  {
    title: "Kwihanganira Amagambo",
    description: "Dufatanye amagambo n'ibishushanyo kugirango witeze neza",
    type: "match",
    difficulty: "easy",
    order: 1,
    enabled: true,
    questions: [
      {
        id: "1",
        question: "Ifu",
        image: "🏠",
        options: ["Ifu", "Inyanya", "Amagi", "Ibikombe"],
        correctAnswer: "Ifu",
        type: "mc"
      },
      {
        id: "2", 
        question: "Inyanya",
        image: "🍅",
        options: ["Ifu", "Inyanya", "Amagi", "Ibikombe"],
        correctAnswer: "Inyanya",
        type: "mc"
      },
      {
        id: "3",
        question: "Amagi",
        image: "🥚",
        options: ["Ifu", "Inyanya", "Amagi", "Ibikombe"],
        correctAnswer: "Amagi",
        type: "mc"
      }
    ]
  },
  {
    title: "Gusoma Ijwi",
    description: "Reba ijwi rya Kinyarwanda wite amagambo neza",
    type: "audio",
    difficulty: "medium",
    order: 2,
    enabled: true,
    questions: [
      {
        id: "1",
        question: "Soma inyuguti iyi: A-B-C",
        correctAnswer: "A-B-C",
        type: "typing"
      },
      {
        id: "2",
        question: "Soma inyuguti iyi: D-E-F",
        correctAnswer: "D-E-F",
        type: "typing"
      },
      {
        id: "3",
        question: "Soma inyuguti iyi: G-H-I",
        correctAnswer: "G-H-I",
        type: "typing"
      }
    ]
  },
  {
    title: "Kwandika Neza",
    description: "Wandike amagambo mu buryo bwiza kugirango witeze neza",
    type: "typing",
    difficulty: "hard",
    order: 3,
    enabled: true,
    questions: [
      {
        id: "1",
        question: "Wandike 'Inka'",
        correctAnswer: "Inka",
        type: "typing"
      },
      {
        id: "2",
        question: "Wandike 'Imboga'",
        correctAnswer: "Imboga",
        type: "typing"
      },
      {
        id: "3",
        question: "Wandike 'Umuganga'",
        correctAnswer: "Umuganga",
        type: "typing"
      }
    ]
  }
];

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/admin/practice',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Admin-Key': '123' // Development admin key
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

    req.write(postData);
    req.end();
  });
}

async function addPracticeData() {
  console.log("Adding practice data to Firebase via API...");
  
  try {
    for (let i = 0; i < practiceData.length; i++) {
      const practice = practiceData[i];
      console.log(`Adding practice ${i + 1}: ${practice.title}`);
      
      const result = await makeRequest(practice);
      if (result.status === 200 || result.status === 201) {
        console.log(`✅ Added: ${practice.title}`);
      } else {
        console.log(`❌ Failed to add ${practice.title}:`, result.data);
      }
    }
    
    console.log("🎉 Practice data addition completed!");
    
  } catch (error) {
    console.error("❌ Error adding practice data:", error.message);
  }
}

// Add the practice data
addPracticeData();
