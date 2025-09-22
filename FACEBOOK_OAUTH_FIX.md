# Facebook OAuth Fix Guide

## 🚨 **CRITICAL ISSUE IDENTIFIED**

The "This app needs at least one supported permission" error is caused by **missing Facebook App ID configuration**.

## 🔍 **Root Cause Analysis:**

### **Problem 1: Missing Environment Variables**
- `VITE_FACEBOOK_APP_ID` is not set
- OAuth URL is generated with empty `client_id` parameter
- Facebook rejects the request because no app is specified

### **Problem 2: Facebook App Configuration**
- Facebook app needs to be properly configured
- Redirect URI must match exactly
- App must be in "Live" mode for production

### **Problem 3: Version Mismatch**
- Code was using Facebook API v21.0
- Error shows v8.0 in URL
- Fixed to use v8.0 for compatibility

## ✅ **SOLUTION STEPS:**

### **Step 1: Set Up Environment Variables**

Create a `.env` file in your project root with:

```env
# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=YOUR_ACTUAL_FACEBOOK_APP_ID
VITE_APP_URL=https://marketmate-101.web.app
```

**Replace `YOUR_ACTUAL_FACEBOOK_APP_ID` with your real Facebook App ID from Facebook Developers Console.**

### **Step 2: Configure Facebook App**

1. **Go to Facebook Developers Console**: https://developers.facebook.com/
2. **Select your app**: MarketMate101
3. **Go to App Settings → Basic**
4. **Copy your App ID** and paste it in the `.env` file

### **Step 3: Configure Facebook Login Product**

1. **Go to Products → Facebook Login → Settings**
2. **Add Valid OAuth Redirect URIs**:
   ```
   https://marketmate-101.web.app/oauth/facebook/callback
   https://marketmate-101.firebaseapp.com/oauth/facebook/callback
   ```

### **Step 4: Configure App Domains**

1. **In App Settings → Basic**
2. **Add App Domains**:
   ```
   marketmate-101.web.app
   marketmate-101.firebaseapp.com
   ```

### **Step 5: Set App to Live Mode**

1. **Go to App Review → App Review**
2. **Toggle "Make [App Name] live?" to ON**
3. **Confirm the change**

### **Step 6: Test the OAuth Flow**

1. **Restart your development server** (if testing locally)
2. **Visit**: https://marketmate-101.web.app/login
3. **Click "Login with Facebook"**
4. **Should now work without permission errors**

## 🔧 **Code Changes Made:**

### **1. Fixed API Version**
```javascript
// Changed from v21.0 to v8.0
authUrl: 'https://www.facebook.com/v8.0/dialog/oauth'
```

### **2. Added Error Handling**
```javascript
// Check if Facebook App ID is configured
if (!OAUTH_CONFIG.facebook.clientId) {
  console.error('Facebook App ID not configured');
  alert('Facebook OAuth is not configured');
  return;
}
```

### **3. Added Debug Logging**
```javascript
console.log('Facebook OAuth Configuration:', {
  clientId: OAUTH_CONFIG.facebook.clientId,
  redirectUri: OAUTH_CONFIG.facebook.redirectUri,
  scope: OAUTH_CONFIG.facebook.scope,
  authUrl: authUrl
});
```

## 🎯 **Expected Result:**

After following these steps:
- ✅ Facebook OAuth will work without permission errors
- ✅ Users can login with Facebook
- ✅ Tokens will be automatically extracted
- ✅ No "app not available" errors

## 🚀 **Quick Fix:**

**The fastest solution is to set your Facebook App ID in the environment variables:**

1. Create `.env` file with your Facebook App ID
2. Redeploy the app
3. Test the OAuth flow

This should immediately resolve the permission error!
