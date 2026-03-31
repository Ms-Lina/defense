/**
 * Upload Enhanced Lessons to Firebase Firestore
 * Store all lessons with proper organization and arrangement
 */
const { getDb } = require('../config/firebase');
const fs = require('fs');
const path = require('path');

class FirebaseLessonUploader {
  constructor() {
    this.db = getDb();
    this.uploadedCount = 0;
    this.errorCount = 0;
    this.moduleStats = {};
  }

  async uploadAllEnhancedLessons() {
    console.log("🔥 Uploading Enhanced Lessons to Firebase Firestore");
    console.log("=" .repeat(60));

    try {
      if (!this.db) {
        throw new Error('Firebase not initialized');
      }

      // Load enhanced lessons
      const enhancedLessonsPath = path.join(__dirname, '..', 'data', 'enhanced-lessons.json');
      const enhancedLessons = JSON.parse(fs.readFileSync(enhancedLessonsPath, 'utf8'));
      
      console.log(`📚 Found ${enhancedLessons.length} enhanced lessons to upload\n`);

      // Upload lessons by module for better organization
      const lessonsByModule = this.groupLessonsByModule(enhancedLessons);
      
      for (const [module, lessons] of Object.entries(lessonsByModule)) {
        await this.uploadModule(module, lessons);
      }

      // Upload module metadata
      await this.uploadModuleMetadata(Object.keys(lessonsByModule));
      
      // Upload lesson arrangement/order
      await this.uploadLessonArrangement(enhancedLessons);

      this.generateUploadReport();

    } catch (error) {
      console.error('❌ Error uploading lessons:', error.message);
    }
  }

  groupLessonsByModule(lessons) {
    const grouped = {};
    
    lessons.forEach(lesson => {
      const module = lesson.module || 'General';
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(lesson);
    });

    // Sort lessons within each module by difficulty and prerequisites
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a, b) => {
        // First sort by difficulty level
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        const aDifficulty = difficultyOrder[a.difficultyLevel] || 2;
        const bDifficulty = difficultyOrder[b.difficultyLevel] || 2;
        
        if (aDifficulty !== bDifficulty) {
          return aDifficulty - bDifficulty;
        }
        
        // Then sort by prerequisites (lessons with fewer prerequisites come first)
        return a.prerequisites.length - b.prerequisites.length;
      });
    });

    return grouped;
  }

  async uploadModule(moduleName, lessons) {
    console.log(`📦 Uploading module: ${moduleName}`);
    
    try {
      // Create module document
      const moduleRef = this.db.collection('modules').doc(moduleName);
      await moduleRef.set({
        name: moduleName,
        displayName: this.getModuleDisplayName(moduleName),
        description: this.getModuleDescription(moduleName),
        lessonCount: lessons.length,
        totalDuration: lessons.reduce((sum, lesson) => sum + (lesson.estimatedDuration || 20), 0),
        difficulty: this.calculateModuleDifficulty(lessons),
        prerequisites: this.getModulePrerequisites(moduleName, lessons),
        order: this.getModuleOrder(moduleName),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: this.getModuleTags(moduleName),
        color: this.getModuleColor(moduleName),
        icon: this.getModuleIcon(moduleName)
      });

      // Upload lessons for this module
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        await this.uploadLesson(lesson, moduleName, i + 1);
      }

      console.log(`   ✅ Module uploaded: ${lessons.length} lessons`);
      this.moduleStats[moduleName] = lessons.length;

    } catch (error) {
      console.error(`   ❌ Error uploading module ${moduleName}:`, error.message);
      this.errorCount++;
    }
  }

  async uploadLesson(lesson, moduleName, orderInModule) {
    try {
      // Create lesson document with enhanced structure
      const lessonRef = this.db.collection('lessons').doc(lesson.id);
      
      const lessonData = {
        // Basic info
        title: lesson.title,
        subtitle: lesson.subtitle || '',
        description: lesson.description || '',
        module: moduleName,
        orderInModule: orderInModule,
        
        // Learning structure
        objectives: lesson.objectives || [],
        prerequisites: lesson.prerequisites || [],
        learningOutcomes: lesson.learningOutcomes || {},
        estimatedDuration: lesson.estimatedDuration || 20,
        difficultyLevel: lesson.difficultyLevel || 'beginner',
        
        // Content
        activities: lesson.activities || [],
        
        // Metadata
        metadata: {
          enhanced: lesson.metadata?.enhanced || true,
          version: lesson.metadata?.version || '2.0',
          tags: lesson.metadata?.tags || [],
          assessmentStrategy: lesson.metadata?.assessmentStrategy || {},
          adaptiveContent: lesson.metadata?.adaptiveContent || {},
          engagementFeatures: lesson.metadata?.engagementFeatures || {},
          createdAt: lesson.metadata?.enhancedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        
        // Status and visibility
        status: 'published',
        visible: true,
        featured: this.isFeaturedLesson(lesson),
        
        // Analytics
        analytics: {
          views: 0,
          completions: 0,
          averageScore: 0,
          averageTimeSpent: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      await lessonRef.set(lessonData);
      this.uploadedCount++;

    } catch (error) {
      console.error(`   ❌ Error uploading lesson ${lesson.id}:`, error.message);
      this.errorCount++;
    }
  }

  async uploadModuleMetadata(modules) {
    console.log(`📋 Uploading module metadata`);
    
    try {
      const metadataRef = this.db.collection('system').doc('modules');
      
      const metadata = {
        modules: modules.map((module, index) => ({
          name: module,
          displayName: this.getModuleDisplayName(module),
          order: index,
          color: this.getModuleColor(module),
          icon: this.getModuleIcon(module),
          description: this.getModuleDescription(module)
        })),
        totalModules: modules.length,
        lastUpdated: new Date().toISOString()
      };

      await metadataRef.set(metadata);
      console.log(`   ✅ Module metadata uploaded`);

    } catch (error) {
      console.error(`   ❌ Error uploading module metadata:`, error.message);
      this.errorCount++;
    }
  }

  async uploadLessonArrangement(lessons) {
    console.log(`📐 Uploading lesson arrangement`);
    
    try {
      const arrangementRef = this.db.collection('system').doc('lessonArrangement');
      
      const arrangement = {
        totalLessons: lessons.length,
        modules: this.groupLessonsByModule(lessons),
        recommendedPath: this.createRecommendedPath(lessons),
        difficultyProgression: this.createDifficultyProgression(lessons),
        lastUpdated: new Date().toISOString()
      };

      await arrangementRef.set(arrangement);
      console.log(`   ✅ Lesson arrangement uploaded`);

    } catch (error) {
      console.error(`   ❌ Error uploading lesson arrangement:`, error.message);
      this.errorCount++;
    }
  }

  // Helper methods for module information
  getModuleDisplayName(moduleName) {
    const displayNames = {
      'Inyuguti n\'Inyajwi': 'Inyuguti n\'Inyajwi',
      'Imirongo n\'Imyanya': 'Imirongo n\'Imyanya',
      'Inkonsonanti': 'Inkonsonanti',
      'Amagambo': 'Amagambo',
      'Imibare': 'Imibare',
      'Amashusho n\'Amabara': 'Amashusho n\'Amabara',
      'General': 'Ibindi'
    };
    return displayNames[moduleName] || moduleName;
  }

  getModuleDescription(moduleName) {
    const descriptions = {
      'Inyuguti n\'Inyajwi': 'Menya inyuguti z\'inyajwi na z\'inkonsonanti mu Kinyarwanda',
      'Imirongo n\'Imyanya': 'Menya imiringo n\'imyanya itandukanye',
      'Inkonsonanti': 'Menya inyuguti z\'inkonsonanti mu Kinyarwanda',
      'Amagambo': 'Menya gukora amagambo ukoresha ibyondo',
      'Imibare': 'Menya imibare no gukora imibare',
      'Amashusho n\'Amabara': 'Menya imishusho n\'amabara y\'ibanze',
      'General': 'Ibindi bigufi by\'amashuri'
    };
    return descriptions[moduleName] || '';
  }

  getModuleOrder(moduleName) {
    const orders = {
      'Inyuguti n\'Inyajwi': 1,
      'Imirongo n\'Imyanya': 2,
      'Inkonsonanti': 3,
      'Amagambo': 4,
      'Imibare': 5,
      'Amashusho n\'Amabara': 6,
      'General': 99
    };
    return orders[moduleName] || 99;
  }

  getModuleTags(moduleName) {
    const tags = {
      'Inyuguti n\'Inyajwi': ['inyuguti', 'inyajwi', 'gusoma', 'kwandika'],
      'Imirongo n\'Imyanya': ['imirongo', 'imyanya', 'guhera', 'ubwenge'],
      'Inkonsonanti': ['inkonsonanti', 'inyuguti', 'gusoma', 'kwandika'],
      'Amagambo': ['amagambo', 'ibyondo', 'gukora', 'gusoma'],
      'Imibare': ['imibare', 'kubara', 'gukora', 'ubwenge'],
      'Amashusho n\'Amabara': ['imishusho', 'amabara', 'kumenya', 'ubwenge'],
      'General': ['ibindi', 'amashuri', 'learning']
    };
    return tags[moduleName] || ['learning', 'education'];
  }

  getModuleColor(moduleName) {
    const colors = {
      'Inyuguti n\'Inyajwi': '#2D9B5F',
      'Imirongo n\'Imyanya': '#FFB84D',
      'Inkonsonanti': '#4CAF78',
      'Amagambo': '#2196F3',
      'Imibare': '#FF9800',
      'Amashusho n\'Amabara': '#9C27B0',
      'General': '#607D8B'
    };
    return colors[moduleName] || '#607D8B';
  }

  getModuleIcon(moduleName) {
    const icons = {
      'Inyuguti n\'Inyajwi': '🔤',
      'Imirongo n\'Imyanya': '🧭',
      'Inkonsonanti': '🔡',
      'Amagambo': '📝',
      'Imibare': '🔢',
      'Amashusho n\'Amabara': '🎨',
      'General': '📚'
    };
    return icons[moduleName] || '📚';
  }

  calculateModuleDifficulty(lessons) {
    const difficulties = lessons.map(l => l.difficultyLevel || 'beginner');
    const beginnerCount = difficulties.filter(d => d === 'beginner').length;
    const intermediateCount = difficulties.filter(d => d === 'intermediate').length;
    const advancedCount = difficulties.filter(d => d === 'advanced').length;
    
    if (advancedCount > 0) return 'advanced';
    if (intermediateCount > beginnerCount) return 'intermediate';
    return 'beginner';
  }

  getModulePrerequisites(moduleName, lessons) {
    const allPrerequisites = lessons.flatMap(l => l.prerequisites || []);
    const uniquePrerequisites = [...new Set(allPrerequisites)];
    
    // Filter prerequisites that belong to other modules
    return uniquePrerequisites.filter(prereq => 
      !prereq.includes(moduleName)
    );
  }

  isFeaturedLesson(lesson) {
    // Mark certain lessons as featured based on importance
    const featuredKeywords = ['Inyuguti n\'Inyajwi', 'Imibare 1-5', 'Imirongo Yegeranye'];
    return featuredKeywords.some(keyword => lesson.title.includes(keyword));
  }

  createRecommendedPath(lessons) {
    // Create a recommended learning path based on prerequisites and difficulty
    const sortedLessons = [...lessons].sort((a, b) => {
      // Sort by prerequisites first, then by difficulty
      if (a.prerequisites.length === 0 && b.prerequisites.length > 0) return -1;
      if (a.prerequisites.length > 0 && b.prerequisites.length === 0) return 1;
      
      const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      const aDifficulty = difficultyOrder[a.difficultyLevel] || 2;
      const bDifficulty = difficultyOrder[b.difficultyLevel] || 2;
      
      return aDifficulty - bDifficulty;
    });

    return sortedLessons.map((lesson, index) => ({
      lessonId: lesson.id,
      title: lesson.title,
      module: lesson.module,
      order: index + 1,
      estimatedDuration: lesson.estimatedDuration || 20,
      difficulty: lesson.difficultyLevel || 'beginner'
    }));
  }

  createDifficultyProgression(lessons) {
    const progression = {
      beginner: lessons.filter(l => (l.difficultyLevel || 'beginner') === 'beginner').length,
      intermediate: lessons.filter(l => (l.difficultyLevel || 'beginner') === 'intermediate').length,
      advanced: lessons.filter(l => (l.difficultyLevel || 'beginner') === 'advanced').length
    };

    return {
      total: lessons.length,
      progression,
      recommendedOrder: ['beginner', 'intermediate', 'advanced']
    };
  }

  generateUploadReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 FIREBASE UPLOAD REPORT");
    console.log("=" .repeat(60));

    console.log(`\n📚 UPLOAD STATISTICS:`);
    console.log(`   • Lessons Uploaded: ${this.uploadedCount}`);
    console.log(`   • Errors: ${this.errorCount}`);
    console.log(`   • Success Rate: ${((this.uploadedCount / (this.uploadedCount + this.errorCount)) * 100).toFixed(1)}%`);

    console.log(`\n📦 MODULES UPLOADED:`);
    Object.entries(this.moduleStats).forEach(([module, count]) => {
      console.log(`   • ${module}: ${count} lessons`);
    });

    console.log(`\n🔥 FIREBASE COLLECTIONS CREATED:`);
    console.log(`   • lessons: Individual lesson documents`);
    console.log(`   • modules: Module metadata and organization`);
    console.log(`   • system: Global configuration and arrangement`);

    console.log(`\n✨ ENHANCED FEATURES STORED:`);
    console.log(`   📝 Structured lesson metadata`);
    console.log(`   🎯 Learning objectives and outcomes`);
    console.log(`   ⏱️  Duration and difficulty levels`);
    console.log(`   🔗 Prerequisites and dependencies`);
    console.log(`   📊 Analytics tracking structure`);
    console.log(`   🎮 Gamification elements`);
    console.log(`   🏷️  Tags and categorization`);
    console.log(`   📈 Progress tracking support`);

    console.log(`\n🚀 READY FOR MOBILE APP:`);
    console.log(`   • All lessons organized by modules`);
    console.log(`   • Clear learning paths defined`);
    console.log(`   • Prerequisites tracked`);
    console.log(`   • Analytics structure ready`);
    console.log(`   • Enhanced metadata available`);

    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`   1. Update mobile app to fetch from Firebase`);
    console.log(`   2. Implement module-based navigation`);
    console.log(`   3. Add progress tracking`);
    console.log(`   4. Enable analytics collection`);
    console.log(`   5. Test lesson loading and display`);

    if (this.errorCount === 0) {
      console.log(`\n🎉 ALL LESSONS SUCCESSFULLY UPLOADED TO FIREBASE!`);
    } else {
      console.log(`\n⚠️  ${this.errorCount} errors occurred. Please check the logs.`);
    }
  }
}

// Run the upload
async function uploadEnhancedLessons() {
  const uploader = new FirebaseLessonUploader();
  await uploader.uploadAllEnhancedLessons();
}

// Execute if run directly
if (require.main === module) {
  uploadEnhancedLessons().catch(console.error);
}

module.exports = FirebaseLessonUploader;
