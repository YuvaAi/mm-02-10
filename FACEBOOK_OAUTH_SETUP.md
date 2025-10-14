# Facebook OAuth Setup Guide

## 🚨 **Current Issue: "App Not Available" Error**

The Facebook OAuth is **already dynamic** (same as LinkedIn), but the Facebook App configuration needs to be fixed.

## 🔧 **Facebook App Configuration Steps**

### **Step 1: Go to Facebook Developers Console**
1. Visit: https://developers.facebook.com/
2. Go to your app: **MarketMate101** (App ID: 1322293389529062)

### **Step 2: App Settings**
1. **App Status**: Make sure your app is **LIVE** (not in Development mode)
2. **App Review**: Submit for review if needed
3. **Permissions**: Ensure required permissions are approved

### **Step 3: OAuth Settings**
1. Go to **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs**:
   ```
   https://marketmate-101.web.app/oauth/facebook/callback
   ```
3. **App Domains**:
   ```
   marketmate-101.web.app
   ```

### **Step 4: Required Permissions**
Make sure these permissions are **approved**:
- `public_profile` ✅ (Basic)
- `email` ✅ (Basic)
- `pages_show_list` ⚠️ (Requires App Review)
- `pages_read_engagement` ⚠️ (Requires App Review)
- `pages_manage_posts` ⚠️ (Requires App Review)

### **Step 5: App Review Process**
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - **pages_show_list**
   - **pages_read_engagement** 
   - **pages_manage_posts**
3. Submit for review

### **Step 6: Test Users (Temporary Solution)**
If app review takes time, add test users:
1. Go to **Roles** → **Test Users**
2. Add test users who can access the app
3. This allows testing while waiting for app review

## 🔍 **Troubleshooting**

### **Error: "App Not Available"**
- **Cause**: App is in Development mode or permissions not approved
- **Solution**: Make app LIVE and approve permissions

### **Error: "Needs Supported Permission"**
- **Cause**: Required permissions are not approved
- **Solution**: Submit app for review or add test users

### **Error: "Invalid Client ID"**
- **Cause**: Wrong App ID in environment variables
- **Solution**: Check VITE_FACEBOOK_APP_ID in .env file

## 📋 **Current Configuration**

```env
VITE_FACEBOOK_APP_ID=1322293389529062
VITE_FACEBOOK_APP_SECRET=4c8b2af462ab26aa81096264e58b2551
```

**Redirect URI**: `https://marketmate-101.web.app/oauth/facebook/callback`

## ✅ **Verification Steps**

1. **Check App Status**: App should be LIVE
2. **Check Permissions**: All required permissions should be approved
3. **Check Redirect URI**: Should match exactly
4. **Test with Different Accounts**: Should work for any Facebook user

## 🚀 **Next Steps**

1. **Make App LIVE** in Facebook Developers Console
2. **Submit for App Review** for required permissions
3. **Add Test Users** for immediate testing
4. **Test OAuth Flow** with different accounts

The OAuth implementation is already dynamic - the issue is purely Facebook App configuration!
