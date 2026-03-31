/**
 * Creates the missing .settings folder under async-storage Android to satisfy
 * the Gradle/Java language server and remove the "Missing Gradle project configuration folder" diagnostic.
 * Safe to run on every install; idempotent.
 */
const fs = require("fs");
const path = require("path");

const androidDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@react-native-async-storage",
  "async-storage",
  "android"
);
const settingsDir = path.join(androidDir, ".settings");

if (!fs.existsSync(androidDir)) {
  process.exit(0);
}

if (!fs.existsSync(settingsDir)) {
  fs.mkdirSync(settingsDir, { recursive: true });
}
const prefsPath = path.join(settingsDir, "org.eclipse.buildship.core.prefs");
if (!fs.existsSync(prefsPath)) {
  fs.writeFileSync(
    prefsPath,
    "# Gradle project configuration\nconnection.project.dir=.\n",
    "utf8"
  );
}
