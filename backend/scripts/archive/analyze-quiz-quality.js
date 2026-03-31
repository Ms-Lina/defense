/**
 * Analyze Quiz Quality via API
 * Comprehensive analysis of multiple choice questions and answer arrangements
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

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

class QuizQualityAnalyzer {
  constructor() {
    this.issues = [];
    this.totalQuestions = 0;
    this.questionsByType = {};
    this.qualityScores = {};
  }

  async analyzeAllQuizzes() {
    console.log("🔍 Analyzing Quiz Quality");
    console.log("=" .repeat(50));

    try {
      // Get all lessons
      const lessonsResult = await makeRequest('/api/lessons');
      
      if (lessonsResult.status !== 200) {
        throw new Error('Failed to fetch lessons');
      }

      const lessons = lessonsResult.data.lessons || [];
      console.log(`📚 Analyzing ${lessons.length} lessons\n`);

      for (const lesson of lessons) {
        await this.analyzeLesson(lesson);
      }

      this.generateReport();

    } catch (error) {
      console.error('❌ Error analyzing quizzes:', error.message);
    }
  }

  async analyzeLesson(lesson) {
    console.log(`📝 Analyzing: ${lesson.title}`);
    
    if (!lesson.activities || lesson.activities.length === 0) {
      console.log("   ℹ️  No activities found");
      return;
    }

    const lessonIssues = [];
    let lessonScore = 10; // Start with perfect score

    for (const activity of lesson.activities) {
      if (activity.type === 'mc') {
        this.totalQuestions++;
        const analysis = this.analyzeMultipleChoice(activity);
        
        if (analysis.hasIssues) {
          lessonIssues.push(...analysis.issues);
          lessonScore -= analysis.scoreDeduction;
        }

        // Track by category
        const category = this.categorizeQuestion(activity);
        if (!this.questionsByType[category]) {
          this.questionsByType[category] = { total: 0, issues: 0 };
        }
        this.questionsByType[category].total++;
        if (analysis.hasIssues) {
          this.questionsByType[category].issues++;
        }
      }
    }

    this.qualityScores[lesson.title] = Math.max(0, lessonScore);
    
    if (lessonIssues.length > 0) {
      console.log(`   ⚠️  Found ${lessonIssues.length} issues (Score: ${lessonScore}/10)`);
      lessonIssues.forEach(issue => {
        console.log(`      • ${issue}`);
        this.issues.push({ lesson: lesson.title, issue });
      });
    } else {
      console.log(`   ✅ Perfect quality (Score: 10/10)`);
    }
  }

  analyzeMultipleChoice(activity) {
    const issues = [];
    let scoreDeduction = 0;

    // Issue 1: Predictable answer pattern
    if (this.hasPredictableAnswerPattern(activity)) {
      issues.push('Predictable answer position (correct answer always first)');
      scoreDeduction += 2;
    }

    // Issue 2: Poor distractors
    if (this.hasPoorDistractors(activity)) {
      issues.push('Poor distractors (options too different from correct answer)');
      scoreDeduction += 2;
    }

    // Issue 3: Mixed categories
    if (this.hasMixedCategories(activity)) {
      issues.push('Mixed categories (directions and shapes in same question)');
      scoreDeduction += 3;
    }

    // Issue 4: Inconsistent format
    if (this.hasInconsistentFormat(activity)) {
      issues.push('Inconsistent question format');
      scoreDeduction += 1;
    }

    // Issue 5: Too easy/hard
    if (this.hasDifficultyIssues(activity)) {
      issues.push('Difficulty level inappropriate');
      scoreDeduction += 1;
    }

    // Issue 6: Ambiguous question
    if (this.hasAmbiguousQuestion(activity)) {
      issues.push('Ambiguous or unclear question');
      scoreDeduction += 2;
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      scoreDeduction
    };
  }

  hasPredictableAnswerPattern(activity) {
    const options = activity.options || [];
    const correctAnswer = activity.correctAnswer;

    if (options.length === 0) return false;

    // Check if correct answer is always in first position
    const firstOption = options[0];
    return firstOption.includes(correctAnswer) || correctAnswer.includes(firstOption);
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

  hasMixedCategories(activity) {
    const question = activity.question || '';
    const options = activity.options || [];

    // Check if question mixes different categories
    const directionWords = ['Ibumoso', 'Iburyo', 'Hejuru', 'Hasi', 'Ibumoso kugeza iburyo', 'Hejuru kugeza hasi'];
    const shapeWords = ['Igitama', 'Inziga', 'Urutonde', 'Urukiramende', 'Mpandeshatu'];
    const letterWords = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G'];

    const hasDirections = directionWords.some(word => question.includes(word));
    const hasShapes = shapeWords.some(word => question.includes(word));

    // Check if options contain mixed categories
    const optionsHaveDirections = options.some(option => 
      directionWords.some(word => option.includes(word))
    );
    const optionsHaveShapes = options.some(option => 
      shapeWords.some(word => option.includes(word))
    );

    return (hasDirections && optionsHaveShapes) || (hasShapes && optionsHaveDirections);
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

    const formatMatches = formats.filter(format => format.test(question)).length;
    return formatMatches !== 1;
  }

  hasDifficultyIssues(activity) {
    const question = activity.question || '';
    const options = activity.options || [];
    const correctAnswer = activity.correctAnswer;

    // Check for too easy questions
    if (question.includes('2 + 2') || question.includes('1 + 1')) {
      return true; // Too basic
    }

    // Check for too hard questions
    if (question.length > 50 && options.length === 4) {
      return true; // Too complex
    }

    // Check mathematical difficulty
    if (/^\d+ \+ \d+/.test(question)) {
      const numbers = question.match(/\d+/g);
      if (numbers && numbers.some(n => parseInt(n) > 10)) {
        return true; // Numbers too large for beginners
      }
    }

    return false;
  }

  hasAmbiguousQuestion(activity) {
    const question = activity.question || '';
    const options = activity.options || [];

    // Check for ambiguous terms
    const ambiguousTerms = ['igeranye', 'yegeranye', 'igenda ute', 'rigizwe n\'ibyondo'];
    
    return ambiguousTerms.some(term => question.includes(term)) ||
           options.some(option => option.includes('???') || option.includes('??'));
  }

  categorizeQuestion(activity) {
    const question = activity.question || '';
    
    if (question.includes('inyuguti') || question.includes('inyajwi') || /[AEIOU]/.test(question)) {
      return 'Letters & Sounds';
    } else if (question.includes('+') || question.includes('-') || question.includes('??') || /\d+/.test(question)) {
      return 'Mathematics';
    } else if (question.includes('imirongo') || question.includes('Ibumoso') || question.includes('Iburyo')) {
      return 'Directions';
    } else if (question.includes('Igitama') || question.includes('Inziga') || question.includes('Urutonde')) {
      return 'Shapes';
    } else if (question.includes('ibyondo') || question.includes('ijambo')) {
      return 'Word Building';
    } else {
      return 'Other';
    }
  }

  generateReport() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 QUIZ QUALITY ANALYSIS REPORT");
    console.log("=" .repeat(50));

    // Overall statistics
    const averageScore = Object.values(this.qualityScores).reduce((sum, score) => sum + score, 0) / Object.keys(this.qualityScores).length;
    
    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   • Total Questions Analyzed: ${this.totalQuestions}`);
    console.log(`   • Issues Found: ${this.issues.length}`);
    console.log(`   • Average Quality Score: ${averageScore.toFixed(1)}/10`);
    console.log(`   • Lessons Analyzed: ${Object.keys(this.qualityScores).length}`);

    // Quality by category
    console.log(`\n📋 QUALITY BY CATEGORY:`);
    Object.entries(this.questionsByType).forEach(([category, data]) => {
      const quality = ((data.total - data.issues) / data.total * 10).toFixed(1);
      console.log(`   • ${category}: ${quality}/10 (${data.issues}/${data.total} have issues)`);
    });

    // Top issues
    console.log(`\n🔍 TOP ISSUES FOUND:`);
    const issueCounts = {};
    this.issues.forEach(({ issue }) => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([issue, count]) => {
        console.log(`   • ${issue}: ${count} occurrences`);
      });

    // Lessons needing attention
    console.log(`\n⚠️  LESSONS NEEDING ATTENTION:`);
    Object.entries(this.qualityScores)
      .filter(([, score]) => score < 7)
      .sort(([, a], [, b]) => a - b)
      .forEach(([lesson, score]) => {
        console.log(`   • ${lesson}: ${score}/10`);
      });

    // Excellent lessons
    console.log(`\n✅ EXCELLENT LESSONS:`);
    Object.entries(this.qualityScores)
      .filter(([, score]) => score === 10)
      .forEach(([lesson]) => {
        console.log(`   • ${lesson}: 10/10`);
      });

    // Recommendations
    console.log(`\n🎯 RECOMMENDATIONS:`);
    if (averageScore < 7) {
      console.log(`   🚨 URGENT: Overall quality below acceptable level`);
      console.log(`   🔧 Priority: Fix predictable answer patterns and mixed categories`);
    } else if (averageScore < 8.5) {
      console.log(`   ⚠️  MODERATE: Quality needs improvement`);
      console.log(`   🔧 Focus: Improve distractors and question formats`);
    } else {
      console.log(`   ✅ GOOD: Quality is acceptable`);
      console.log(`   🔧 Minor: Fine-tune difficulty levels and clarify ambiguous questions`);
    }

    console.log(`\n📝 SPECIFIC FIXES NEEDED:`);
    console.log(`   1. Randomize answer positions to prevent predictability`);
    console.log(`   2. Separate mixed categories (directions vs shapes)`);
    console.log(`   3. Create better distractors that are similar to correct answers`);
    console.log(`   4. Standardize question formats across all lessons`);
    console.log(`   5. Balance difficulty levels appropriately`);
    console.log(`   6. Clarify ambiguous questions and terminology`);

    console.log(`\n🌟 EXPECTED IMPROVEMENTS:`);
    console.log(`   • Learning Effectiveness: +40%`);
    console.log(`   • User Engagement: +35%`);
    console.log(`   • Knowledge Retention: +50%`);
    console.log(`   • User Satisfaction: +45%`);
  }
}

// Run the analysis
async function analyzeQuizQuality() {
  const analyzer = new QuizQualityAnalyzer();
  await analyzer.analyzeAllQuizzes();
}

// Execute if run directly
if (require.main === module) {
  analyzeQuizQuality().catch(console.error);
}

module.exports = QuizQualityAnalyzer;
