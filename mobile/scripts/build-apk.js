/**
 * Build Android APK locally without EAS.
 * Requires: Android SDK (Android Studio or command-line tools), JAVA_HOME set.
 * Run from mobile/: pnpm run build:apk
 *
 * If you see CMake "path has 193 characters / maximum 250" or "build.ninja still dirty",
 * ensure mobile/.npmrc is present (node-linker=hoisted) and run: pnpm install
 * so node_modules is hoisted and paths stay under the limit.
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradlew = isWin ? "gradlew.bat" : "gradlew";

// Remove existing android so prebuild generates fresh SDK 53 project.
const androidDirPath = path.join(root, "android");
if (fs.existsSync(androidDirPath)) {
  console.log("Stopping Gradle daemon so android/ can be removed...");
  try {
    execSync(isWin ? "gradlew.bat --stop" : "./gradlew --stop", { cwd: androidDirPath, stdio: "ignore" });
  } catch (_) {}
  // On Windows, CMake/Gradle often keep .cxx build files locked; wait for handles to release.
  if (isWin) {
    console.log("Waiting 4s for file handles to release (Windows)...");
    try {
      execSync("cmd /c \"timeout /t 4 /nobreak >nul 2>&1\"", { stdio: "ignore" });
    } catch (_) {
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline) {
        const t = Date.now();
        while (Date.now() - t < 1000) {}
      }
    }
  }
  console.log("Removing existing android/ for clean prebuild...");

  const removeAttempts = [
    () => {
      execSync("pnpm dlx rimraf android", { cwd: root, stdio: "inherit" });
    },
    () => {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(androidDirPath, { recursive: true, maxRetries: 2, retryDelay: 500 });
          return;
        } catch (e) {
          if (i < 4) {
            try {
              if (isWin) execSync("cmd /c \"timeout /t 2 /nobreak >nul 2>&1\"", { stdio: "ignore" });
              else execSync("sleep 2", { stdio: "ignore" });
            } catch (_) {}
          } else throw e;
        }
      }
    },
  ];
  if (isWin) {
    removeAttempts.push(() => {
      execSync('cmd /c "rd /s /q android"', { cwd: root, stdio: "inherit" });
    });
  }

  let removed = false;
  for (const attempt of removeAttempts) {
    if (removed) break;
    try {
      attempt();
      removed = !fs.existsSync(androidDirPath);
    } catch (_) {}
  }

  if (!removed && fs.existsSync(androidDirPath)) {
    console.error("\nCould not remove android/. Windows is locking files (often .cxx or build outputs).");
    console.error("Do this, then run 'pnpm run build:apk' again:");
    console.error("  1. Close Android Studio and any terminal opened in mobile/ or android/.");
    console.error("  2. Open a new PowerShell, cd to mobile/, then run: Remove-Item -Recurse -Force android");
    console.error("  3. Run: pnpm run build:apk");
    process.exit(1);
  }
}
console.log("Step 1: Generating native Android project (expo prebuild)...");
execSync("npx expo prebuild --platform android --clean", {
  cwd: root,
  stdio: "inherit",
});

if (!fs.existsSync(androidDir)) {
  console.error("Prebuild did not create android/ directory.");
  process.exit(1);
}

// Create .settings so VS Code Java extension does not report "Missing Gradle project configuration folder"
const settingsDir = path.join(androidDir, ".settings");
if (!fs.existsSync(settingsDir)) {
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(
    path.join(settingsDir, "org.eclipse.buildship.core.prefs"),
    "# Gradle/Buildship – so VS Code Java recognizes this project\neclipse.preferences.version=1\nconnection.project.dir=\n",
    "utf8"
  );
}

// Inject workaround for Expo SDK 53: generated PackageList.java uses expo.core.ExpoModulesPackage
// but the class lives in expo.modules. Patch during Gradle compile.
const appBuildGradle = path.join(androidDir, "app", "build.gradle");
if (fs.existsSync(appBuildGradle)) {
  const gradlePatch = `
// Workaround: Expo SDK 53 autolinking generates expo.core.ExpoModulesPackage; class is in expo.modules.
tasks.whenTaskAdded { task ->
    if (task.name == "compileReleaseJavaWithJavac" || task.name == "compileDebugJavaWithJavac") {
        task.doFirst {
            def packageList = file("\${buildDir}/generated/autolinking/src/main/java/com/facebook/react/PackageList.java")
            if (packageList.exists()) {
                def text = packageList.getText("UTF-8")
                if (text.contains("expo.core.ExpoModulesPackage")) {
                    packageList.write(text.replace("expo.core.ExpoModulesPackage", "expo.modules.ExpoModulesPackage"), "UTF-8")
                    println "Patched PackageList.java: expo.core -> expo.modules"
                }
            }
        }
    }
}

`;
  let content = fs.readFileSync(appBuildGradle, "utf8");
  if (!content.includes("expo.core.ExpoModulesPackage")) {
    content = content.replace(/(\ndependencies\s*\{)/, gradlePatch + "$1");
    fs.writeFileSync(appBuildGradle, content);
    console.log("Injected PackageList.java workaround into app/build.gradle.");
  }
}

console.log("\nStep 2: Building release APK with Gradle...");
// Stop Gradle daemons so we don't hit "Timeout waiting to lock build logic queue".
try {
  execSync(isWin ? "gradlew.bat --stop" : "./gradlew --stop", { cwd: androidDir, stdio: "ignore", timeout: 15000 });
} catch (_) {}
// Wait for lock release (Windows often needs longer).
const stopWaitSec = isWin ? 8 : 3;
console.log(`Waiting ${stopWaitSec}s for Gradle lock release...`);
try {
  if (isWin) execSync(`cmd /c "timeout /t ${stopWaitSec} /nobreak >nul 2>&1"`, { stdio: "ignore" });
  else execSync(`sleep ${stopWaitSec}`, { stdio: "ignore" });
} catch (_) {}
// --no-daemon avoids competing with other Gradle instances (e.g. Android Studio).
execSync(isWin ? "gradlew.bat assembleRelease --no-daemon" : "./gradlew assembleRelease --no-daemon", {
  cwd: androidDir,
  stdio: "inherit",
});

const apkPath = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);
if (fs.existsSync(apkPath)) {
  console.log("\nAPK created:", apkPath);
} else {
  console.warn("\nAPK may be in a different path; check android/app/build/outputs/apk/");
}
