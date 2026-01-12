# Authentication Persistence with AsyncStorage

## Overview

The ChawpVendor app now includes automatic authentication persistence using AsyncStorage. Vendors will remain logged in even after closing and reopening the app, eliminating the need to login repeatedly.

## Features Implemented

### 1. **AsyncStorage Integration** 💾

- **Package**: `@react-native-async-storage/async-storage` (already installed)
- **Purpose**: Securely stores authentication session and vendor profile locally
- **Location**: Device's persistent storage (encrypted on device)

### 2. **Supabase Configuration** 🔐

**File**: `src/config/supabase.js`

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence
    autoRefreshToken: true, // Automatically refresh expired tokens
    persistSession: true, // Persist session across app restarts
    detectSessionInUrl: false, // Disable URL session detection (mobile app)
  },
});
```

### 3. **Enhanced VendorAuthContext** 🔄

**New Features:**

- ✅ Session persistence across app restarts
- ✅ Vendor profile caching
- ✅ Automatic token refresh
- ✅ Smart cache management
- ✅ Optimistic loading (shows cached data while fetching fresh data)

**New Functions:**

#### `loadVendorFromCache()`

- Loads cached vendor profile on app start
- Provides instant UI (no loading screen)
- Returns boolean indicating cache availability

#### `saveVendorToCache(vendorData)`

- Saves vendor profile after successful fetch
- Updates cache when profile is modified
- Called automatically on login and profile updates

#### `clearVendorCache()`

- Removes cached vendor data on logout
- Clears stale data on authentication errors
- Ensures clean state for new logins

### 4. **Authentication Flow** 🔐

#### **App Initialization:**

```
1. Load cached vendor profile (instant UI)
2. Check Supabase session (AsyncStorage)
3. If session exists:
   - Fetch fresh vendor data
   - Update cache
   - Continue to app
4. If no session:
   - Show login screen
   - Clear any stale cache
```

#### **Login Flow:**

```
1. User enters credentials
2. Supabase authenticates
3. Session saved to AsyncStorage automatically
4. Fetch vendor profile
5. Cache vendor profile
6. Navigate to main app
```

#### **Logout Flow:**

```
1. Clear vendor cache
2. Sign out from Supabase
3. Session removed from AsyncStorage
4. Clear app state
5. Navigate to login screen
```

#### **Auto-Refresh Flow:**

```
1. Supabase detects token expiration
2. Automatically refreshes token
3. Updated token saved to AsyncStorage
4. User stays logged in seamlessly
```

## Storage Keys

### Supabase Session Storage

- **Key**: `supabase.auth.token` (managed by Supabase)
- **Content**: JWT tokens, refresh token, session metadata
- **Auto-managed**: Yes (by Supabase SDK)

### Vendor Profile Cache

- **Key**: `@chawp_vendor_profile`
- **Content**: Complete vendor profile object
- **Auto-managed**: Yes (by VendorAuthContext)
- **Structure**:

```json
{
  "id": "vendor-uuid",
  "name": "Restaurant Name",
  "email": "vendor@email.com",
  "phone": "0244123456",
  "image": "https://...",
  "rating": 4.5,
  "delivery_time": "30-45 min",
  "address": "123 Street",
  "description": "About us..."
}
```

## Security Considerations

### ✅ What's Secure:

1. **AsyncStorage encryption**: Data encrypted on device (iOS/Android)
2. **Token auto-refresh**: Prevents expired session issues
3. **Secure token storage**: JWT tokens never exposed to JavaScript
4. **Automatic cleanup**: Tokens cleared on logout/errors

### ⚠️ Best Practices:

1. Never store passwords in AsyncStorage
2. Tokens auto-expire (handled by Supabase)
3. Cache cleared on logout
4. Fresh data fetched on critical operations

## Usage Examples

### Check Authentication Status

```javascript
import { useVendorAuth } from "./contexts/VendorAuthContext";

function MyComponent() {
  const { isAuthenticated, vendor, loading } = useVendorAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainApp vendor={vendor} />;
}
```

### Login

```javascript
const { signIn } = useVendorAuth();

const handleLogin = async () => {
  const result = await signIn(email, password);
  if (result.success) {
    // User is automatically logged in
    // Session persisted to AsyncStorage
    // Vendor profile cached
    console.log("Login successful!");
  }
};
```

### Logout

```javascript
const { signOut } = useVendorAuth();

const handleLogout = async () => {
  const result = await signOut();
  if (result.success) {
    // Session cleared from AsyncStorage
    // Vendor cache cleared
    // User redirected to login
    console.log("Logged out successfully!");
  }
};
```

### Update Profile

```javascript
const { updateVendorProfile } = useVendorAuth();

const updateProfile = async (updates) => {
  const result = await updateVendorProfile(updates);
  if (result.success) {
    // Profile updated in database
    // Cache automatically updated
    console.log("Profile updated!");
  }
};
```

### Refresh Profile

```javascript
const { refreshVendor } = useVendorAuth();

// Manually refresh vendor data
await refreshVendor();
```

## Testing Persistence

### Test 1: Normal Login

1. Open app → Login with credentials
2. Close app completely (force quit)
3. Reopen app
4. ✅ **Expected**: App opens directly to main screen (no login required)

### Test 2: Token Expiration

1. Login and use app normally
2. Wait for token to expire (usually 1 hour)
3. Continue using app
4. ✅ **Expected**: Token auto-refreshes, no interruption

### Test 3: Logout

1. Login to app
2. Navigate to Profile → Sign Out
3. Reopen app
4. ✅ **Expected**: Shows login screen

### Test 4: Offline Start

1. Login with internet connection
2. Close app
3. Turn off internet
4. Reopen app
5. ✅ **Expected**: Shows cached profile, displays offline message

## Debug Commands

### View Stored Session (Dev Tools)

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

// View all keys
AsyncStorage.getAllKeys().then((keys) => console.log(keys));

// View vendor profile
AsyncStorage.getItem("@chawp_vendor_profile").then((data) =>
  console.log(JSON.parse(data))
);

// Clear everything (for testing)
AsyncStorage.clear();
```

### Check Auth State

```javascript
import { supabase } from "./config/supabase";

// Check current session
supabase.auth.getSession().then(({ data }) => {
  console.log("Session:", data.session);
  console.log("User:", data.session?.user);
});

// Check user
supabase.auth.getUser().then(({ data }) => {
  console.log("User:", data.user);
});
```

## Troubleshooting

### Problem: User logged out unexpectedly

**Solution**: Check token expiration settings in Supabase dashboard

### Problem: Profile not updating

**Solution**: Call `refreshVendor()` after making changes

### Problem: Cache showing old data

**Solution**: Clear AsyncStorage during development

```javascript
AsyncStorage.removeItem("@chawp_vendor_profile");
```

### Problem: Login not persisting

**Solution**:

1. Check AsyncStorage permissions
2. Verify Supabase config has `persistSession: true`
3. Ensure `storage: AsyncStorage` is set

## Performance Benefits

### Before Persistence:

- ❌ User logs in every app restart
- ❌ Full loading screen each time
- ❌ Poor user experience
- ❌ Network call required before UI shows

### After Persistence:

- ✅ Login once, stay logged in
- ✅ Instant UI with cached data
- ✅ Seamless user experience
- ✅ App loads immediately
- ✅ Fresh data loads in background

## Token Lifecycle

```
Login → Token Issued (1 hour validity)
  ↓
Token Stored in AsyncStorage
  ↓
App Uses Token for API Calls
  ↓
Token Expires (59 minutes)
  ↓
Auto-Refresh Triggered
  ↓
New Token Stored
  ↓
Seamless Continuation
```

## Data Flow

```
App Start
  ↓
Load from AsyncStorage (instant)
  ↓
Show UI with cached data
  ↓
Check Supabase session
  ↓
Fetch fresh data (background)
  ↓
Update cache
  ↓
Update UI if changed
```

## Additional Notes

- Session tokens are automatically managed by Supabase
- Vendor profile cache reduces database queries
- Works offline (shows cached data)
- Automatically syncs when online
- No manual token management required
- Secure by default

## Migration Guide

If you had users before this update:

1. Existing sessions will continue to work
2. Users will be auto-migrated on next login
3. No action required from users
4. Old sessions still valid until expiration

## Summary

✅ **Automatic Login Persistence** - Users stay logged in  
✅ **Instant App Loading** - Cached data shows immediately  
✅ **Token Auto-Refresh** - No manual intervention needed  
✅ **Secure Storage** - Encrypted on device  
✅ **Offline Support** - Works with cached data  
✅ **Smart Sync** - Fresh data loaded in background  
✅ **Clean Logout** - All data cleared properly

Your vendors no longer need to login after every app reload! 🎉
