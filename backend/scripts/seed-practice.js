/**
 * Seed Firebase with practice data
 * Run with: node scripts/seed-practice.js
 */
const { getDb } = require("../config/firebase");

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

async function seedPracticeData() {
  const db = getDb();
  if (!db) {
    console.error("Database not configured");
    process.exit(1);
  }

  console.log("Seeding practice data...");

  try {
    // Clear existing practice data
    const existingPractice = await db.collection("practice").get();
    if (!existingPractice.empty) {
      console.log("Clearing existing practice data...");
      const batch = db.batch();
      existingPractice.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Add new practice data
    const batch = db.batch();
    practiceData.forEach((practice) => {
      const docRef = db.collection("practice").doc();
      batch.set(docRef, {
        ...practice,
        createdAt: new Date().toISOString()
      });
    });

    await batch.commit();
    console.log(`✅ Seeded ${practiceData.length} practice exercises`);
    
    // Verify the data
    const snapshot = await db.collection("practice").get();
    console.log(`✅ Verification: ${snapshot.size} practice items in database`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} (${data.type}) - ${data.questions?.length || 0} questions`);
    });

  } catch (error) {
    console.error("❌ Error seeding practice data:", error);
    process.exit(1);
  }
}

// Run the seeding
seedPracticeData().then(() => {
  console.log("🎉 Practice data seeding completed!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
