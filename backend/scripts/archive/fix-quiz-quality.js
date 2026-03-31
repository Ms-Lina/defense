/**
 * Fix Quiz Quality Issues
 * Automatically improves multiple choice questions and answer arrangements
 */
const { getDb } = require('../config/firebase');

class QuizQualityFixer {
  constructor() {
    this.db = getDb();
    this.fixesApplied = 0;
    this.issuesFound = 0;
  }

  async fixAllQuizzes() {
    console.log("🔧 Starting Quiz Quality Fixes");
    console.log("=" .repeat(50));

    try {
      // Get all lessons
      const lessonsSnap = await this.db.collection('lessons').get();
      const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`📚 Found ${lessons.length} lessons to analyze\n`);

      for (const lesson of lessons) {
        await this.fixLesson(lesson);
      }

      console.log("\n" + "=".repeat(50));
      console.log(`✅ Quiz Quality Fix Complete:`);
      console.log(`   • Issues Found: ${this.issuesFound}`);
      console.log(`   • Fixes Applied: ${this.fixesApplied}`);
      console.log(`   • Lessons Processed: ${lessons.length}`);

    } catch (error) {
      console.error('❌ Error fixing quizzes:', error);
    }
  }

  async fixLesson(lesson) {
    console.log(`📝 Processing: ${lesson.title}`);
    
    if (!lesson.activities || lesson.activities.length === 0) {
      console.log("   ℹ️  No activities found");
      return;
    }

    let lessonHasChanges = false;
    const fixedActivities = [];

    for (const activity of lesson.activities) {
      if (activity.type === 'mc') {
        const fixedActivity = await this.fixMultipleChoice(activity);
        if (fixedActivity.hasChanges) {
          lessonHasChanges = true;
          this.fixesApplied++;
        }
        fixedActivities.push(fixedActivity.activity);
      } else {
        fixedActivities.push(activity);
      }
    }

    if (lessonHasChanges) {
      // Update the lesson with fixed activities
      await this.db.collection('lessons').doc(lesson.id).update({
        activities: fixedActivities
      });
      console.log(`   ✅ Fixed ${lesson.title}`);
    } else {
      console.log(`   ℹ️  No fixes needed`);
    }
  }

  async fixMultipleChoice(activity) {
    let hasChanges = false;
    const fixedActivity = { ...activity };

    // Issue 1: Fix answer arrangement (randomize correct answer position)
    if (this.hasPredictableAnswerPattern(activity)) {
      fixedActivity.options = this.randomizeAnswerPosition(activity);
      hasChanges = true;
      this.issuesFound++;
      console.log(`      🔀 Randomized answer position`);
    }

    // Issue 2: Improve distractors
    if (this.hasPoorDistractors(activity)) {
      fixedActivity.options = this.improveDistractors(activity);
      hasChanges = true;
      this.issuesFound++;
      console.log(`      🎯 Improved distractors`);
    }

    // Issue 3: Fix mixed categories
    if (this.hasMixedCategories(activity)) {
      fixedActivity = this.separateCategories(activity);
      hasChanges = true;
      this.issuesFound++;
      console.log(`      📂 Separated categories`);
    }

    // Issue 4: Standardize question format
    if (this.hasInconsistentFormat(activity)) {
      fixedActivity.question = this.standardizeQuestionFormat(activity);
      hasChanges = true;
      this.issuesFound++;
      console.log(`      📝 Standardized format`);
    }

    return { activity: fixedActivity, hasChanges };
  }

  hasPredictableAnswerPattern(activity) {
    // Check if correct answer is always in first position
    const options = activity.options || [];
    if (options.length === 0) return false;

    // Simple heuristic: if correct answer matches first option pattern
    const firstOption = options[0];
    const correctAnswer = activity.correctAnswer;

    // Check if first option contains the correct answer
    return firstOption.includes(correctAnswer) || correctAnswer.includes(firstOption);
  }

  randomizeAnswerPosition(activity) {
    const options = [...activity.options];
    const correctAnswer = activity.correctAnswer;
    
    // Find current position of correct answer
    let correctIndex = -1;
    for (let i = 0; i < options.length; i++) {
      if (options[i].includes(correctAnswer) || correctAnswer.includes(options[i])) {
        correctIndex = i;
        break;
      }
    }

    if (correctIndex === -1) return options;

    // Randomize positions
    const positions = [0, 1, 2, 3];
    const newPosition = positions[Math.floor(Math.random() * positions.length)];
    
    // Swap positions
    [options[correctIndex], options[newPosition]] = [options[newPosition], options[correctIndex]];
    
    return options;
  }

  hasPoorDistractors(activity) {
    const options = activity.options || [];
    const correctAnswer = activity.correctAnswer;

    // Check if options are too different from correct answer
    const correctWords = correctAnswer.split(' ');
    
    return options.some(option => {
      const optionWords = option.split(' ');
      
      // If options have completely different words, they're poor distractors
      const commonWords = correctWords.filter(word => 
        optionWords.some(optWord => optWord.includes(word) || word.includes(optWord))
      );
      
      return commonWords.length === 0;
    });
  }

  improveDistractors(activity) {
    const options = [...activity.options];
    const correctAnswer = activity.correctAnswer;

    // Generate better distractors based on correct answer
    const improvedOptions = this.generateBetterDistractors(correctAnswer, options.length);
    
    // Ensure correct answer is included
    if (!improvedOptions.includes(correctAnswer)) {
      improvedOptions[0] = correctAnswer;
    }

    return improvedOptions.slice(0, options.length);
  }

  generateBetterDistractors(correctAnswer, count) {
    const distractors = [];
    const words = correctAnswer.split(' ');

    // Generate distractors that are similar to correct answer
    for (let i = 0; i < count - 1; i++) {
      const distractor = this.createSimilarDistractor(words);
      if (distractor !== correctAnswer && !distractors.includes(distractor)) {
        distractors.push(distractor);
      }
    }

    // Add correct answer
    distractors.push(correctAnswer);

    // Shuffle and return
    return this.shuffleArray(distractors);
  }

  createSimilarDistractor(words) {
    // Create distractors by changing one word
    const similarWords = {
      'A': ['E', 'I', 'O', 'U'],
      'E': ['A', 'I', 'O', 'U'],
      'I': ['A', 'E', 'O', 'U'],
      'O': ['A', 'E', 'I', 'U'],
      'U': ['A', 'E', 'I', 'O'],
      '1': ['2', '3', '4', '5'],
      '2': ['1', '3', '4', '5'],
      '3': ['1', '2', '4', '5'],
      '4': ['1', '2', '3', '5'],
      '5': ['1', '2', '3', '4'],
      'Ibumoso': ['Iburyo', 'Hejuru', 'Hasi'],
      'Iburyo': ['Ibumoso', 'Hejuru', 'Hasi'],
      'Hejuru': ['Ibumoso', 'Iburyo', 'Hasi'],
      'Hasi': ['Ibumoso', 'Iburyo', 'Hejuru']
    };

    if (words.length === 1) {
      const word = words[0];
      const alternatives = similarWords[word] || [word];
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    } else {
      // Change one word in multi-word answers
      const indexToChange = Math.floor(Math.random() * words.length);
      const wordToChange = words[indexToChange];
      const alternatives = similarWords[wordToChange] || [wordToChange];
      words[indexToChange] = alternatives[Math.floor(Math.random() * alternatives.length)];
      return words.join(' ');
    }
  }

  hasMixedCategories(activity) {
    const question = activity.question || '';
    const options = activity.options || [];

    // Check if question mixes different categories
    const directionWords = ['Ibumoso', 'Iburyo', 'Hejuru', 'Hasi', 'Ibumoso kugeza iburyo', 'Hejuru kugeza hasi'];
    const shapeWords = ['Igitama', 'Inziga', 'Urutonde', 'Urukiramende', 'Mpandeshatu'];
    const letterWords = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G'];

    const hasDirections = directionWords.some(word => question.includes(word));
    const hasShapes = shapeWords.some(word => question.includes(word));
    const hasLetters = letterWords.some(word => question.includes(word));

    // Check if options contain mixed categories
    const optionsHaveDirections = options.some(option => 
      directionWords.some(word => option.includes(word))
    );
    const optionsHaveShapes = options.some(option => 
      shapeWords.some(word => option.includes(word))
    );

    return (hasDirections && optionsHaveShapes) || (hasShapes && optionsHaveDirections);
  }

  separateCategories(activity) {
    // For mixed categories, we'll clean up the question and options
    const question = activity.question || '';
    const options = [...activity.options];

    // Remove shape options from direction questions
    const shapeWords = ['Igitama', 'Inziga', 'Urutonde', 'Urukiramende', 'Mpandeshatu'];
    const cleanedOptions = options.filter(option => 
      !shapeWords.some(shape => option.includes(shape))
    );

    // Update question to be clearer
    let cleanedQuestion = question;
    if (question.includes('igeranye')) {
      cleanedQuestion = question.replace('igeranye', 'yegeranye');
    }

    return {
      ...activity,
      question: cleanedQuestion,
      options: cleanedOptions.length >= 2 ? cleanedOptions : options
    };
  }

  hasInconsistentFormat(activity) {
    const question = activity.question || '';
    
    // Check for inconsistent question formats
    const formats = [
      /^Ni /,           // "Ni ..." format
      /^Ijambo /,       // "Ijambo ..." format  
      /^\d+/,           // Starts with number
      /\?$/,            // Ends with ?
    ];

    // Count how many format patterns match
    const formatMatches = formats.filter(format => format.test(question)).length;
    
    // If no format matches or multiple formats match, it's inconsistent
    return formatMatches !== 1;
  }

  standardizeQuestionFormat(activity) {
    let question = activity.question || '';

    // Standardize to "Ni iyihe:" format for most questions
    if (question.startsWith('Ijambo')) {
      question = question.replace('Ijambo', 'Ni iyihe ijambo');
    } else if (/^\d+/.test(question)) {
      question = `Bara iyihe: ${question}`;
    } else if (!question.startsWith('Ni iyihe') && !question.startsWith('Bara')) {
      question = `Ni iyihe: ${question}`;
    }

    // Ensure question ends with proper punctuation
    if (!question.endsWith('?') && !question.endsWith('.')) {
      question += '?';
    }

    return question;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Run the quiz quality fixer
async function fixQuizQuality() {
  const fixer = new QuizQualityFixer();
  await fixer.fixAllQuizzes();
}

// Execute if run directly
if (require.main === module) {
  fixQuizQuality().catch(console.error);
}

module.exports = QuizQualityFixer;
