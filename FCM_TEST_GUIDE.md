# FCM Testing Guide for ChawpVendor

## ✅ Configuration Status

### Package Name

- **app.json**: `com.stephen_j.ChawpVendor` ✅
- **google-services.json**: `com.stephen_j.ChawpVendor` ✅
- **Status**: MATCHED ✅

### FCM Setup

- ✅ google-services.json configured
- ✅ expo-notifications plugin added
- ✅ Android permissions configured
- ✅ Notification service implemented

## 🧪 How to Test FCM Before Building

### Option 1: Development Build Test (Recommended)

```bash
# Build development APK with FCM support
eas build --profile development --platform android
```

### Option 2: Production Build Test

```bash
# Build production APK
eas build --profile production --platform android
```

### Option 3: Manual Testing in App

1. **Run the app** (after building standalone APK/AAB)
2. **Sign in** with a vendor account
3. **Check console logs** for:

   ```
   Vendor FCM Push Token: [token]
   Push token saved successfully
   ```

4. **Verify in Supabase**:
   - Check `chawp_device_tokens` table for new entry
   - Verify `device_type` = 'vendor'
   - Check `push_token` field is populated

## 📱 Test Notification Receiving

### Method 1: Using Expo Push Tool

1. Get the FCM token from console logs
2. Go to: https://expo.dev/notifications
3. Enter the token and send a test notification

### Method 2: Using Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Select "Send test message"
3. Enter the FCM token
4. Send notification

### Method 3: Backend API Test

Create a test endpoint in your backend to send notifications:

```javascript
// Test sending notification to vendor
const admin = require("firebase-admin");

async function testVendorNotification(vendorToken) {
  const message = {
    notification: {
      title: "🔔 Test: New Order",
      body: "This is a test notification for vendor app",
    },
    data: {
      type: "order",
      orderId: "test-123",
    },
    token: vendorToken,
  };

  const response = await admin.messaging().send(message);
  console.log("Successfully sent:", response);
}
```

## 🔍 Troubleshooting

### Issue: "Notification handler not available"

- **Cause**: Running in Expo Go
- **Solution**: Build standalone app with `eas build`

### Issue: No FCM token received

- **Check**:
  1. google-services.json is in root directory
  2. Package name matches in app.json and google-services.json
  3. Android permissions are set
  4. Device has Google Play Services

### Issue: Notifications not appearing

- **Check**:
  1. Notification permissions granted
  2. Notification channels created (Android)
  3. App is in foreground/background
  4. Device settings allow notifications

## ✅ Pre-Build Checklist

- [x] Package name matches: `com.stephen_j.ChawpVendor`
- [x] google-services.json in root directory
- [x] expo-notifications plugin configured
- [x] Android permissions added
- [x] Notification service implemented
- [x] Token saving logic implemented
- [ ] Test on real device with production build
- [ ] Verify notifications received when app is:
  - [ ] Foreground
  - [ ] Background
  - [ ] Killed/Closed

## 🚀 Build Commands

```bash
# Development build (for testing)
eas build --profile development --platform android

# Preview build (for testing)
eas build --profile preview --platform android

# Production build (for release)
eas build --profile production --platform android
```

## 📝 Expected Behavior

1. **On App Launch** (when user logged in):
   - Request notification permissions
   - Get FCM token
   - Save token to database
   - Console shows: "Vendor FCM Push Token: [token]"

2. **On Notification Received**:
   - Foreground: Alert shown, sound plays
   - Background: Notification in tray
   - Tapped: App opens to relevant screen

3. **Token Storage**:
   - Saved to `chawp_device_tokens` table
   - Saved to `chawp_user_profiles` table
   - Device type: 'vendor'

## 🔔 Notification Channels (Android)

- **vendor-orders**: High priority, sound + vibration
- **vendor-updates**: Default priority, vibration only

## 📊 Database Schema Check

Ensure these tables exist:

```sql
-- Check device tokens table
SELECT * FROM chawp_device_tokens
WHERE device_type = 'vendor'
ORDER BY created_at DESC LIMIT 5;

-- Check user profiles
SELECT id, email, push_token, push_token_updated_at
FROM chawp_user_profiles
WHERE role = 'vendor'
ORDER BY push_token_updated_at DESC LIMIT 5;
```

---

**Note**: FCM only works in standalone builds (APK/AAB), not in Expo Go!
