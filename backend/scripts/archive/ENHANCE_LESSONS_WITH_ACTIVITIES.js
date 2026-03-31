/**
 * Enhanced Lessons Enhancement Script
 * Populates all lessons with comprehensive activities, questions, and answers
 */

const admin = require('firebase-admin');
const { getDb } = require('./config/firebase');

// Initialize Firebase using existing config
const { db } = getDb();

// Comprehensive Activity Templates
const ACTIVITY_TEMPLATES = {
  // Inyuguti n'Inyajwi Activities
  vowels: [
    {
      id: "vowel_recognition_1",
      type: "mc",
      question: "Ni ipi iyinjwi iri hagati ya 'A' na 'I'?",
      correctAnswer: "E",
      options: ["E", "U", "O", "I"],
      instruction: "Kora neza kumenya iyinjwi ziri hagati",
      hint: "Reka kumva ijwi rya 'E' - 'E' nka 'Elephant'",
      feedback: "👍 Wakore neza! 'E' iri hagati ya 'A' na 'I'",
      points: 10,
      difficulty: "easy"
    },
    {
      id: "vowel_typing_1",
      type: "typing",
      prompt: "Andika iyinjwi yonyine uhereye ku ijwi rya 'bee'",
      correctAnswer: "i",
      instruction: "Wumve ijwav, wandika iyinjwi",
      hint: "Ijambo 'bee' riririrwa na 'i'",
      feedback: "🎉 Wakore neza! 'i' ni iyinjwi y'ijwi rya 'bee'",
      points: 15,
      difficulty: "easy"
    },
    {
      id: "vowel_matching_1",
      type: "mc",
      question: "Ijambo 'Umurimo' riririrwa na iyinjwi ipi?",
      correctAnswer: "U",
      options: ["A", "E", "I", "U"],
      instruction: "Reka kumva neza ijwi rya 'Umurimo'",
      hint: "Tangira kumva 'U...mu...ri...mo'",
      feedback: "✅ Yego! 'U' ni iyinjwi ya mbere mu 'Umurimo'",
      points: 10,
      difficulty: "easy"
    }
  ],

  // Imirongo Activities
  lines: [
    {
      id: "line_types_1",
      type: "mc",
      question: "Umurongo ugeranye (horizontal) ugira ingufu zingahe?",
      correctAnswer: "Ine",
      options: ["Ebyiri", "Eshatu", "Ine", "Eshanu"],
      instruction: "Wige imirongo yose uhereye ku muzingo",
      hint: "Umuzingo ufite inzira enye zingana",
      feedback: "🎯 Wakore neza! Umuzingo ufite inzira enye zingana",
      points: 10,
      difficulty: "easy"
    },
    {
      id: "line_direction_1",
      type: "typing",
      prompt: "Andika ijambo Kinyarwanda risobanura umurongo uhagarara (vertical)",
      correctAnswer: "ihagarara",
      instruction: "Wige imirongo n'imirongo y'imirongo",
      hint: "Umurongo uhagarara uva hejuru ugana hasi",
      feedback: "📝 Wakore neza! 'ihagarara' ni umurongo uhagarara",
      points: 15,
      difficulty: "medium"
    },
    {
      id: "line_identification_1",
      type: "mc",
      question: "Umurongo w'igitama (diagonal) uva hejuru ugana aho?",
      correctAnswer: "Ibumoso",
      options: ["Iburyo", "Ibumoso", "Hasi", "Hejuru"],
      instruction: "Wige umurongo w'igitama",
      hint: "Umurongo w'igitama uva hejuru ugana hasi",
      feedback: "✅ Wakore neza! Umurongo w'igitama uva hejuru ugana hasi",
      points: 12,
      difficulty: "medium"
    }
  ],

  // Imibare Activities
  numbers: [
    {
      id: "number_recognition_1",
      type: "mc",
      question: "3 mu Kinyarwanda ni iki?",
      correctAnswer: "Eshatu",
      options: ["Imwe", "Ebyiri", "Eshatu", "Eshanu"],
      instruction: "Kora neza kumenya imibare",
      hint: "Reka kumva: 'Eshatu' - 1, 2, 3",
      feedback: "🔢 Wakore neza! 3 ni 'Eshatu'",
      points: 10,
      difficulty: "easy"
    },
    {
      id: "number_typing_1",
      type: "typing",
      prompt: "Andika '10' mu Kinyarwanda",
      correctAnswer: "icumi",
      instruction: "Wandika imibare mu Kinyarwanda",
      hint: "Reka kumva: 'I...cu...mi'",
      feedback: "🎉 Wakore neza! 10 ni 'icumi'",
      points: 15,
      difficulty: "easy"
    },
    {
      id: "math_operation_1",
      type: "mc",
      question: "2 + 3 = ?",
      correctAnswer: "Eshatu",
      options: ["Ebyiri", "Eshatu", "Eshanu", "Eshatanu"],
      instruction: "Kora imibare y'igikombe",
      hint: "2 + 3 = 5, 5 ni 'Eshanu'",
      feedback: "✅ Wakore neza! 2 + 3 = 5 (Eshanu)",
      points: 12,
      difficulty: "medium"
    }
  ],

  // Amashusho n'Amabara Activities
  shapes_colors: [
    {
      id: "shape_recognition_1",
      type: "mc",
      question: "Uruziga (circle) ufite ingufu zingahe?",
      correctAnswer: "Nta na mo",
      options: ["Ebyiri", "Eshatu", "Ine", "Nta na mo"],
      instruction: "Wige amashusho yose",
      hint: "Uruziga nta mpinga zirimo",
      feedback: "🎯 Wakore neza! Uruziga nta mpinga zirimo",
      points: 10,
      difficulty: "easy"
    },
    {
      id: "color_typing_1",
      type: "typing",
      prompt: "Andika 'red' mu Kinyarwanda",
      correctAnswer: "umutuku",
      instruction: "Wandika amabara mu Kinyarwanda",
      hint: "Reka kumva: 'U...mu...tu...ku'",
      feedback: "🎨 Wakore neza! 'red' ni 'umutuku'",
      points: 15,
      difficulty: "easy"
    },
    {
      id: "shape_identification_1",
      type: "mc",
      question: "Urutonde (triangle) ufite ingufu zingahe?",
      correctAnswer: "Eshatu",
      options: ["Ebyiri", "Eshatu", "Ine", "Eshanu"],
      instruction: "Wige amashusho n'ingufu zazo",
      hint: "Urutonde ufite inzinziri eshatu",
      feedback: "📐 Wakore neza! Urutonde ufite inzinziri eshatu",
      points: 12,
      difficulty: "easy"
    }
  ]
};

// Module-specific activity assignments
const MODULE_ACTIVITY_MAPPING = {
  "Inyuguti n'Inyajwi": ACTIVITY_TEMPLATES.vowels,
  "Imirongo n'Imyanya": ACTIVITY_TEMPLATES.lines,
  "Imibare": ACTIVITY_TEMPLATES.numbers,
  "Amashusho n'Amabara": ACTIVITY_TEMPLATES.shapes_colors,
  "Inkonsonanti": ACTIVITY_TEMPLATES.vowels, // Use vowels as base
  "Amagambo": ACTIVITY_TEMPLATES.vowels, // Use vowels as base
  "Ibindi": ACTIVITY_TEMPLATES.vowels // Use vowels as base
};

// Enhanced lesson data structure
function createEnhancedActivities(lesson, module) {
  const baseActivities = MODULE_ACTIVITY_MAPPING[module] || ACTIVITY_TEMPLATES.vowels;
  
  // Create customized activities based on lesson content
  const activities = baseActivities.map((template, index) => ({
    ...template,
    id: `${lesson.id}_activity_${index + 1}`,
    order: index + 1,
    estimatedTime: template.points * 2, // 2 seconds per point
    adaptiveContent: {
      hints: {
        available: 3,
        used: 0,
        cost: 5
      },
      scaffolding: {
        showExamples: true,
        provideTemplates: false,
        allowRetry: true,
        maxAttempts: 3
      }
    },
    assessment: {
      weight: template.points,
      passingThreshold: 80,
      timeBonus: 5
    }
  }));

  return activities;
}

// Main enhancement function
async function enhanceAllLessons() {
  try {
    console.log("🚀 Starting lesson enhancement process...");
    
    // Get all lessons
    const lessonsSnapshot = await db.collection("lessons").get();
    const lessons = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📚 Found ${lessons.length} lessons to enhance`);
    
    let enhancedCount = 0;
    let skippedCount = 0;
    
    for (const lesson of lessons) {
      try {
        // Check if lesson already has proper activities
        const currentActivities = lesson.activities || [];
        const hasValidActivities = currentActivities.length > 0 && 
          currentActivities.some(activity => activity.type && activity.question);
        
        if (hasValidActivities && currentActivities.length >= 3) {
          console.log(`⏭️  Skipping lesson "${lesson.title}" - already has valid activities`);
          skippedCount++;
          continue;
        }
        
        // Create enhanced activities
        const module = lesson.module || "Ibindi";
        const enhancedActivities = createEnhancedActivities(lesson, module);
        
        // Update lesson with enhanced activities
        await db.collection("lessons").doc(lesson.id).update({
          activities: enhancedActivities,
          enhanced: true,
          enhancedAt: new Date().toISOString(),
          version: "2.0",
          lastEnhancedBy: "system"
        });
        
        console.log(`✅ Enhanced lesson "${lesson.title}" with ${enhancedActivities.length} activities`);
        enhancedCount++;
        
      } catch (error) {
        console.error(`❌ Error enhancing lesson "${lesson.title}":`, error.message);
      }
    }
    
    console.log("\n🎉 Lesson Enhancement Complete!");
    console.log(`📊 Summary:`);
    console.log(`   - Total lessons: ${lessons.length}`);
    console.log(`   - Enhanced: ${enhancedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Success rate: ${Math.round((enhancedCount / lessons.length) * 100)}%`);
    
  } catch (error) {
    console.error("❌ Fatal error during enhancement:", error);
  }
}

// Validation function
async function validateEnhancedLessons() {
  try {
    console.log("🔍 Validating enhanced lessons...");
    
    const lessonsSnapshot = await db.collection("lessons").get();
    const lessons = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const lesson of lessons) {
      const activities = lesson.activities || [];
      const hasValidStructure = activities.every(activity => 
        activity.id && 
        activity.type && 
        (activity.question || activity.prompt) && 
        activity.correctAnswer &&
        activity.instruction &&
        activity.feedback
      );
      
      if (hasValidStructure && activities.length >= 3) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`❌ Invalid lesson: "${lesson.title}" - Activities: ${activities.length}`);
      }
    }
    
    console.log("\n📊 Validation Results:");
    console.log(`   - Valid lessons: ${validCount}`);
    console.log(`   - Invalid lessons: ${invalidCount}`);
    console.log(`   - Validation rate: ${Math.round((validCount / lessons.length) * 100)}%`);
    
  } catch (error) {
    console.error("❌ Error during validation:", error);
  }
}

// Run the enhancement
if (require.main === module) {
  console.log("🎯 MenyAI Lesson Enhancement System");
  console.log("=====================================");
  
  enhanceAllLessons()
    .then(() => {
      console.log("\n🔄 Running validation...");
      return validateEnhancedLessons();
    })
    .then(() => {
      console.log("\n✅ Process completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Process failed:", error);
      process.exit(1);
    });
}

module.exports = {
  enhanceAllLessons,
  validateEnhancedLessons,
  createEnhancedActivities,
  ACTIVITY_TEMPLATES,
  MODULE_ACTIVITY_MAPPING
};
