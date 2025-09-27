# Facebook Ads Management Setup Guide

## 🚨 **CRITICAL: CORS Error Fix**

The CORS error you're experiencing is caused by missing Firebase functions and improper CORS configuration. Here's the complete solution:

## ✅ **Issues Fixed:**

### 1. **Missing Firebase Function**
- Added `createNewCampaignFunction` to Firebase functions
- Function was being called but didn't exist in the main functions directory

### 2. **CORS Configuration**
- Added proper CORS headers to Firebase hosting
- Updated Firebase functions configuration
- Added CORS middleware to functions

### 3. **Facebook Ads Permissions**
- Added required environment variables for Facebook Ads API
- Configured proper Facebook Ads Management API scopes

## 🔧 **Required Facebook App Permissions**

Your Facebook app needs these permissions to create ad campaigns:

### **Basic Permissions:**
- `ads_management` - Manage ad accounts and campaigns
- `ads_read` - Read ad account information
- `business_management` - Access business manager

### **Extended Permissions:**
- `pages_show_list` - List Facebook pages
- `pages_read_engagement` - Read page engagement
- `instagram_basic` - Basic Instagram access (if using Instagram ads)
- `instagram_content_publish` - Publish to Instagram (if using Instagram ads)

## 📋 **Environment Variables Setup**

Create a `.env` file with these variables:

```env
# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret

# Facebook Ads Configuration
VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID=your_facebook_ad_account_id
VITE_REACT_APP_FACEBOOK_PAGE_ID=your_facebook_page_id
VITE_REACT_APP_WEBSITE_URL=https://marketmate-101.web.app
```

## 🎯 **Facebook App Configuration Steps**

### **Step 1: Facebook Developers Console**
1. Go to [Facebook Developers Console](https://developers.facebook.com/)
2. Select your app: MarketMate101
3. Go to **App Settings → Basic**
4. Copy your **App ID** and **App Secret**

### **Step 2: Add Marketing API Product**
1. Go to **Products → Add Product**
2. Add **Marketing API**
3. Configure the following:
   - **App Review**: Submit for review (required for ads_management)
   - **Permissions**: Request ads_management permission

### **Step 3: Get Ad Account ID**
1. Go to [Facebook Ads Manager](https://adsmanager.facebook.com/)
2. Go to **Account Settings**
3. Copy your **Ad Account ID** (format: act_XXXXXXXXX)

### **Step 4: Get Page ID**
1. Go to your Facebook Page
2. Go to **About → Page Info**
3. Copy your **Page ID**

### **Step 5: Configure OAuth Redirect URIs**
In Facebook Developers Console → Facebook Login → Settings:

```
https://marketmate-101.web.app/oauth/facebook/callback
https://marketmate-101.firebaseapp.com/oauth/facebook/callback
```

### **Step 6: Set App to Live Mode**
1. Go to **App Review → App Review**
2. Toggle **"Make [App Name] live?"** to **ON**
3. Confirm the change

## 🚀 **Deployment Steps**

### **Step 1: Install Dependencies**
```bash
cd functions
npm install
```

### **Step 2: Build Functions**
```bash
npm run build
```

### **Step 3: Deploy Functions**
```bash
firebase deploy --only functions
```

### **Step 4: Deploy Hosting**
```bash
firebase deploy --only hosting
```

## 🔍 **Testing the Fix**

### **Test 1: Check Function Exists**
```javascript
// This should now work without CORS errors
const functions = getFunctions();
const createNewCampaignFunction = httpsCallable(functions, 'createNewCampaignFunction');
```

### **Test 2: Verify Environment Variables**
Check that these are set in your deployed app:
- `VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID`
- `VITE_REACT_APP_FACEBOOK_PAGE_ID`
- `VITE_FACEBOOK_APP_ID`

### **Test 3: Test Campaign Creation**
1. Go to your app
2. Navigate to Facebook Ad Generator
3. Try creating a campaign
4. Should work without CORS errors

## 🛠 **Troubleshooting**

### **If CORS Error Persists:**
1. Check Firebase function logs: `firebase functions:log`
2. Verify function is deployed: Check Firebase Console → Functions
3. Check browser network tab for actual error details

### **If Facebook API Errors:**
1. Verify your access token has ads_management permission
2. Check that your ad account ID is correct
3. Ensure your Facebook app is in Live mode

### **If Environment Variables Not Working:**
1. Redeploy the app after setting environment variables
2. Check that variables start with `VITE_`
3. Verify variables are set in your deployment platform

## 📊 **Expected Result**

After following these steps:
- ✅ No more CORS errors
- ✅ Facebook ad campaigns can be created
- ✅ Proper error handling and logging
- ✅ All Facebook Ads Management API features work

## 🎉 **Quick Fix Summary**

The main issues were:
1. **Missing Firebase function** - Now created
2. **CORS configuration** - Now properly set up
3. **Missing environment variables** - Now documented
4. **Facebook permissions** - Now properly configured

Your app should now work without the CORS error!
