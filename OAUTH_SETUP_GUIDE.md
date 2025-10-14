# OAuth Setup Guide - Fix LinkedIn and Facebook Connect Buttons

## 🚨 **CRITICAL ISSUES IDENTIFIED & FIXED**

Your LinkedIn and Facebook connect buttons aren't working due to missing environment variables and configuration issues. Here's the complete fix:

## ✅ **Issues Fixed:**

1. **Missing Environment Variables** - No `.env` file with OAuth credentials
2. **Incorrect LinkedIn Function URL** - Fixed backend function endpoint
3. **Missing Error Handling** - Added proper validation and user feedback
4. **No Debug Information** - Added console logging for troubleshooting

## 🔧 **Step 1: Create Environment Variables**

Create a `.env` file in your project root with these variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn OAuth Configuration
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
VITE_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# App Configuration
VITE_APP_URL=https://marketmate-101.web.app
VITE_APP_DOMAIN=marketmate-101.web.app
```

## 🎯 **Step 2: Get Your OAuth Credentials**

### **Facebook OAuth Setup:**

1. **Go to Facebook Developers Console**: https://developers.facebook.com/
2. **Select your app**: MarketMate101
3. **Go to App Settings → Basic**
4. **Copy your App ID** and paste it as `VITE_FACEBOOK_APP_ID`
5. **Copy your App Secret** and paste it as `VITE_FACEBOOK_APP_SECRET`

### **LinkedIn OAuth Setup:**

1. **Go to LinkedIn Developers Console**: https://www.linkedin.com/developers/
2. **Create a new app** or select existing app
3. **Go to Auth tab**
4. **Copy your Client ID** and paste it as `VITE_LINKEDIN_CLIENT_ID`
5. **Copy your Client Secret** and paste it as `VITE_LINKEDIN_CLIENT_SECRET`

## 🔧 **Step 3: Configure OAuth Redirect URIs**

### **Facebook Configuration:**

1. **In Facebook Developers Console → Products → Facebook Login → Settings**
2. **Add Valid OAuth Redirect URIs**:
   ```
   https://marketmate-101.web.app/oauth/facebook/callback
   https://marketmate-101.firebaseapp.com/oauth/facebook/callback
   ```

### **LinkedIn Configuration:**

1. **In LinkedIn Developers Console → Auth tab**
2. **Add Authorized Redirect URLs**:
   ```
   https://marketmate-101.web.app/oauth/linkedin/callback
   https://marketmate-101.firebaseapp.com/oauth/linkedin/callback
   ```

## 🚀 **Step 4: Deploy Firebase Functions**

Make sure your Firebase functions are deployed:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🧪 **Step 5: Test the OAuth Flow**

1. **Restart your development server** (if testing locally)
2. **Open browser console** to see debug information
3. **Click "Connect Facebook"** - should show configuration in console
4. **Click "Connect LinkedIn"** - should show configuration in console

## 🔍 **Debug Information**

The updated code now includes:

- **Console logging** for OAuth configuration
- **Error handling** with user-friendly messages
- **Validation** to check if OAuth is configured
- **Proper error messages** when credentials are missing

## 🎯 **Expected Results**

After following these steps:

- ✅ Facebook OAuth button will work without errors
- ✅ LinkedIn OAuth button will work without errors
- ✅ Console will show OAuth configuration details
- ✅ Users will get clear error messages if OAuth is not configured
- ✅ OAuth flow will redirect properly to callback URLs

## 🚨 **Common Issues & Solutions**

### **Issue: "OAuth is not configured" error**
- **Solution**: Make sure you've created the `.env` file with proper credentials

### **Issue: "Failed to initiate OAuth" error**
- **Solution**: Check that your OAuth apps are properly configured in Facebook/LinkedIn consoles

### **Issue: CORS errors**
- **Solution**: Make sure Firebase functions are deployed and accessible

### **Issue: Redirect URI mismatch**
- **Solution**: Ensure redirect URIs in OAuth apps match exactly with your domain

## 📋 **Quick Checklist**

- [ ] Created `.env` file with OAuth credentials
- [ ] Configured Facebook app with correct redirect URIs
- [ ] Configured LinkedIn app with correct redirect URIs
- [ ] Deployed Firebase functions
- [ ] Tested OAuth buttons in browser
- [ ] Checked console for debug information

## 🎉 **Success!**

Once configured, your OAuth buttons should work perfectly and users will be able to connect their social media accounts seamlessly!
