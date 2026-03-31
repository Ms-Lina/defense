/**
 * Verifies required branding asset exists.
 * The app now uses MenyAI-Logo.png directly for icon/splash/adaptive icon.
 */
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const logoPath = path.join(assetsDir, "MenyAI-Logo.png");
if (!fs.existsSync(logoPath)) {
  throw new Error(`Missing required logo file: ${logoPath}`);
}

console.log("OK:", logoPath);
console.log("App icons and splash are configured to use MenyAI-Logo.png directly via app.json.");
