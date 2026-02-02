#!/usr/bin/env node

/**
 * FCM Configuration Validator for ChawpVendor
 * Run this script to verify FCM setup before building
 */

const fs = require("fs");
const path = require("path");

console.log("\n🔍 ChawpVendor FCM Configuration Validator\n");
console.log("=".repeat(50));

let allPassed = true;

// Check 1: google-services.json exists
console.log("\n1. Checking google-services.json...");
const googleServicesPath = path.join(__dirname, "google-services.json");
if (fs.existsSync(googleServicesPath)) {
  console.log("   ✅ google-services.json found");

  try {
    const googleServices = JSON.parse(
      fs.readFileSync(googleServicesPath, "utf8"),
    );
    const vendorClient = googleServices.client.find(
      (c) =>
        c.client_info.android_client_info.package_name ===
        "com.stephen_j.ChawpVendor",
    );

    if (vendorClient) {
      console.log("   ✅ Vendor package found in google-services.json");
      console.log(`   📦 Package: com.stephen_j.ChawpVendor`);
      console.log(`   🔑 App ID: ${vendorClient.client_info.mobilesdk_app_id}`);
    } else {
      console.log("   ❌ Vendor package NOT found in google-services.json");
      allPassed = false;
    }
  } catch (error) {
    console.log("   ❌ Error parsing google-services.json:", error.message);
    allPassed = false;
  }
} else {
  console.log("   ❌ google-services.json NOT found");
  allPassed = false;
}

// Check 2: app.json configuration
console.log("\n2. Checking app.json configuration...");
const appJsonPath = path.join(__dirname, "app.json");
if (fs.existsSync(appJsonPath)) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const androidPackage = appJson.expo.android.package;
    const googleServicesFile = appJson.expo.android.googleServicesFile;

    if (androidPackage === "com.stephen_j.ChawpVendor") {
      console.log("   ✅ Package name matches: com.stephen_j.ChawpVendor");
    } else {
      console.log(`   ❌ Package name mismatch: ${androidPackage}`);
      allPassed = false;
    }

    if (googleServicesFile === "./google-services.json") {
      console.log("   ✅ googleServicesFile configured");
    } else {
      console.log("   ❌ googleServicesFile not properly configured");
      allPassed = false;
    }

    // Check plugins
    const hasNotificationPlugin = appJson.expo.plugins?.some((plugin) =>
      Array.isArray(plugin)
        ? plugin[0] === "expo-notifications"
        : plugin === "expo-notifications",
    );

    if (hasNotificationPlugin) {
      console.log("   ✅ expo-notifications plugin configured");
    } else {
      console.log("   ❌ expo-notifications plugin NOT found");
      allPassed = false;
    }

    // Check permissions
    const permissions = appJson.expo.android.permissions || [];
    const hasNotifPermission = permissions.includes("POST_NOTIFICATIONS");

    if (hasNotifPermission) {
      console.log("   ✅ POST_NOTIFICATIONS permission added");
    } else {
      console.log(
        "   ⚠️  POST_NOTIFICATIONS permission not found (may work without it)",
      );
    }
  } catch (error) {
    console.log("   ❌ Error parsing app.json:", error.message);
    allPassed = false;
  }
} else {
  console.log("   ❌ app.json NOT found");
  allPassed = false;
}

// Check 3: Notification service
console.log("\n3. Checking notification service...");
const notifServicePath = path.join(
  __dirname,
  "src",
  "services",
  "notifications.js",
);
if (fs.existsSync(notifServicePath)) {
  console.log("   ✅ notifications.js service found");

  const content = fs.readFileSync(notifServicePath, "utf8");
  if (content.includes("registerForPushNotifications")) {
    console.log("   ✅ registerForPushNotifications function exists");
  }
  if (content.includes("getDevicePushTokenAsync")) {
    console.log("   ✅ FCM token retrieval implemented");
  }
  if (content.includes("chawp_device_tokens")) {
    console.log("   ✅ Token saving to database implemented");
  }
} else {
  console.log("   ❌ notifications.js service NOT found");
  allPassed = false;
}

// Check 4: package.json dependencies
console.log("\n4. Checking dependencies...");
const packageJsonPath = path.join(__dirname, "package.json");
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (deps["expo-notifications"]) {
      console.log(
        `   ✅ expo-notifications installed (${deps["expo-notifications"]})`,
      );
    } else {
      console.log("   ❌ expo-notifications NOT installed");
      allPassed = false;
    }

    if (deps["expo-device"]) {
      console.log(`   ✅ expo-device installed (${deps["expo-device"]})`);
    } else {
      console.log("   ⚠️  expo-device NOT installed");
    }
  } catch (error) {
    console.log("   ❌ Error parsing package.json:", error.message);
  }
}

// Final summary
console.log("\n" + "=".repeat(50));
if (allPassed) {
  console.log("\n✅ All FCM checks passed!");
  console.log("\n📱 You can proceed with building the standalone app:");
  console.log("   npm run build:android");
  console.log("   or");
  console.log("   eas build --platform android --profile production");
  console.log(
    "\n💡 Remember: FCM only works in standalone builds, not Expo Go!",
  );
} else {
  console.log("\n❌ Some checks failed. Please fix the issues above.");
  console.log("\n📖 See FCM_TEST_GUIDE.md for detailed instructions.");
}
console.log("\n");

process.exit(allPassed ? 0 : 1);
