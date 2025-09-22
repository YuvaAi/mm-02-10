# OAuth Setup Guide for MarketMate

This guide explains how to properly configure Facebook OAuth for the MarketMate application.

## Overview

MarketMate uses two different OAuth flows:

1. **User Authentication**: Firebase Auth with Facebook/Google (popup-based)
2. **Social Media Connection**: Custom OAuth flow for connecting social media accounts

## Prerequisites

- Facebook Developer Account
- Firebase Project
- Domain registered for production deployment

## Step 1: Facebook App Configuration

### 1.1 Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Consumer" → "Next"
3. Fill in app details:
   - App Name: MarketMate
   - App Contact Email: your-email@example.com
   - App Purpose: Business

### 1.2 Configure Facebook Login

1. In your Facebook App dashboard, go to "Products" → "Facebook Login" → "Settings"
2. Add the following **Valid OAuth Redirect URIs**:

   **Production:**
   ```
   https://marketmate-101.web.app/oauth/facebook/callback
   https://marketmate-101.firebaseapp.com/oauth/facebook/callback
   ```

   **Development:**
   ```
   http://localhost:5173/oauth/facebook/callback
   http://localhost:3000/oauth/facebook/callback
   ```

3. Save the configuration

### 1.3 Configure App Domains

1. Go to "App Settings" → "Basic"
2. Add your domains to "App Domains":
   ```
   marketmate-101.web.app
   marketmate-101.firebaseapp.com
   localhost
   ```

### 1.4 Get App Credentials

1. Note down your **App ID** and **App Secret**
2. These will be used in your environment variables

## Step 2: Firebase Configuration

### 2.1 Enable Facebook Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Authentication" → "Sign-in method"
4. Enable "Facebook" provider
5. Enter your Facebook App ID and App Secret
6. Copy the OAuth redirect URI provided by Firebase

### 2.2 Add Firebase OAuth Redirect URI to Facebook

1. Go back to Facebook App settings
2. Add the Firebase OAuth redirect URI to "Valid OAuth Redirect URIs":
   ```
   https://marketmate-101.firebaseapp.com/__/auth/handler
   ```

## Step 3: Environment Configuration

### 3.1 Create Environment File

Create a `.env` file in your project root:

```bash
# Copy the example file
cp env.example .env
```

### 3.2 Configure Environment Variables

Edit `.env` with your actual values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=marketmate-101.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=marketmate-101
VITE_FIREBASE_STORAGE_BUCKET=marketmate-101.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_FACEBOOK_APP_SECRET=your_facebook_app_secret

# App Configuration
VITE_APP_URL=https://marketmate-101.web.app
VITE_APP_DOMAIN=marketmate-101.web.app
```

## Step 4: Testing the Implementation

### 4.1 Development Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the flows:
   - **User Authentication**: Click "Continue with Facebook" on login/signup
   - **Social Media Connection**: Go to Credential Vault → "Connect Facebook Page"

### 4.2 Production Testing

1. Deploy to Firebase:
   ```bash
   npm run build
   firebase deploy
   ```

2. Test the production flows

## Important Notes

### Redirect URI Requirements

- **MUST** be registered in Facebook Developer Console
- **MUST** match exactly (including protocol, domain, path)
- **CANNOT** use dynamic URLs like `window.location.origin`
- **MUST** be HTTPS in production

### User Experience

- Users never see or manually enter redirect URIs
- Authentication uses popup (stays in app)
- Social media connection uses redirect (leaves app temporarily)
- Both flows return users to the app automatically

### Security

- State parameter prevents CSRF attacks
- App secrets are server-side only
- Access tokens are stored securely
- OAuth scopes are minimal and necessary

## Troubleshooting

### Common Issues

1. **"URL not in the list of valid OAuth redirect URIs"**
   - Check that the redirect URI is exactly registered in Facebook
   - Ensure protocol (http/https) matches
   - Verify domain and path are correct

2. **"Invalid state parameter"**
   - Clear browser storage and try again
   - Check that state is being generated and validated properly

3. **"App not configured"**
   - Verify environment variables are set
   - Check that `.env` file is in project root
   - Restart development server after adding env vars

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test redirect URIs manually
4. Check Facebook App settings
5. Verify Firebase configuration

## Support

If you encounter issues:

1. Check this guide first
2. Review Facebook Developer documentation
3. Check Firebase Auth documentation
4. Contact the development team

Remember: The key to successful OAuth is having **one registered redirect URI** that works for both authentication and social media connection, with a seamless user experience that abstracts away the complexity.
