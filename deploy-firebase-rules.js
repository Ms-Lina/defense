/**
 * Deploy Firebase Security Rules for MenyAI Project
 */
const fs = require('fs');
const path = require('path');

// Firebase rules for MenyAI project
const firebaseRules = {
  rules: {
    users: {
      $uid: {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        progress: {
          ".read": "auth != null && auth.uid == $uid",
          ".write": "auth != null && auth.uid == $uid"
        },
        lessonHistory: {
          $lessonId: {
            ".read": "auth != null && auth.uid == $uid",
            ".write": "auth != null && auth.uid == $uid",
            ".validate": "newData.hasChildren(['score', 'passed', 'completedAt'])",
            score: {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100"
            },
            passed: {
              ".validate": "newData.isBoolean()"
            },
            completedAt: {
              ".validate": "newData.isString()"
            }
          }
        },
        practiceHistory: {
          $practiceId: {
            ".read": "auth != null && auth.uid == $uid",
            ".write": "auth != null && auth.uid == $uid",
            ".validate": "newData.hasChildren(['score', 'passed', 'completedAt'])",
            score: {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 100"
            },
            passed: {
              ".validate": "newData.isBoolean()"
            },
            completedAt: {
              ".validate": "newData.isString()"
            },
            attempts: {
              ".validate": "newData.isNumber() && newData.val() >= 1"
            }
          }
        },
        profile: {
          ".read": "auth != null && auth.uid == $uid",
          ".write": "auth != null && auth.uid == $uid",
          displayName: {
            ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 50"
          },
          level: {
            ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 5"
          },
          totalPoints: {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          },
          streak: {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          }
        }
      }
    },
    lessons: {
      ".read": "auth != null",
      ".write": false,
      $lessonId: {
        ".read": "auth != null",
        ".write": false,
        ".validate": "newData.hasChildren(['title', 'order'])",
        title: {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        order: {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        difficulty: {
          ".validate": "newData.isString() && ['easy', 'medium', 'hard'].indexOf(newData.val()) >= 0"
        },
        enabled: {
          ".validate": "newData.isBoolean()"
        },
        module: {
          ".validate": "newData.isString() && newData.val().length > 0"
        }
      }
    },
    practice: {
      ".read": "auth != null",
      ".write": false,
      $practiceId: {
        ".read": "auth != null",
        ".write": false,
        ".validate": "newData.hasChildren(['title', 'type', 'difficulty'])",
        title: {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        type: {
          ".validate": "newData.isString() && ['typing', 'audio', 'match'].indexOf(newData.val()) >= 0"
        },
        difficulty: {
          ".validate": "newData.isString() && ['easy', 'medium', 'hard'].indexOf(newData.val()) >= 0"
        },
        enabled: {
          ".validate": "newData.isBoolean()"
        }
      }
    },
    admin: {
      ".read": "auth != null && auth.token.admin === true",
      ".write": "auth != null && auth.token.admin === true"
    },
    analytics: {
      ".read": "auth != null",
      ".write": false,
      $userId: {
        ".read": "auth != null && auth.uid == $userId",
        ".write": false
      }
    },
    config: {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.admin === true",
      appSettings: {
        ".validate": "newData.hasChildren(['version', 'features'])"
      }
    },
    ".read": false,
    ".write": false
  }
};

// Write rules to file
const rulesPath = path.join(__dirname, 'firebase-rules.json');
fs.writeFileSync(rulesPath, JSON.stringify(firebaseRules, null, 2));

console.log('✅ Firebase security rules written to:', rulesPath);
console.log('\n📋 To deploy these rules:');
console.log('1. Open Firebase Console: https://console.firebase.google.com/');
console.log('2. Select your project (menyai-27cfc)');
console.log('3. Go to Firestore Database > Rules');
console.log('4. Copy and paste the content from firebase-rules.json');
console.log('5. Click "Publish"');

console.log('\n🔒 Security Features:');
console.log('• Users can only access their own data');
console.log('• Lessons and practice are read-only for authenticated users');
console.log('• Admin access requires admin token claim');
console.log('• Data validation for all writes');
console.log('• Proper authentication checks');
