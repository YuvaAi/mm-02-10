# LinkedIn OAuth Setup Guide

## Issue Identified
The LinkedIn OAuth is failing because the `VITE_LINKEDIN_CLIENT_ID` environment variable is not set, causing the "You need to pass the 'client_id' parameter" error.

## Solution Steps

### 1. Create Environment Variables File
Create a `.env` file in your project root with the following content:

```env
# LinkedIn API Configuration
VITE_LINKEDIN_CLIENT_ID=your_actual_linkedin_client_id_here
VITE_LINKEDIN_CLIENT_SECRET=your_actual_linkedin_client_secret_here

# App Configuration
VITE_APP_URL=https://marketmate-101.web.app
```

### 2. Get Your LinkedIn Client ID
1. Go to [LinkedIn Developers Console](https://www.linkedin.com/developers/)
2. Select your app
3. Go to the "Auth" tab
4. Copy your "Client ID" from the "OAuth 2.0 settings" section
5. Replace `your_actual_linkedin_client_id_here` with your actual Client ID

### 3. Verify Redirect URLs
Ensure your LinkedIn app has these redirect URLs configured:
- `https://marketmate-101.web.app/oauth/linkedin/callback`
- `https://marketmate-101.web.app/`

### 4. Restart Development Server
After creating the `.env` file:
```bash
npm run dev
```

## Current OAuth Scopes
Your LinkedIn OAuth is configured with these scopes:
- `openid` - Use your name and photo
- `profile` - Use your name and photo
- `email` - Use the primary email address
- `r_basicprofile` - Use your basic profile
- `w_member_social` - Create, modify, and delete posts
- `w_organization_social` - Create organization posts
- `r_organization_social` - Retrieve organization data
- `rw_organization_admin` - Manage organization pages
- `r_organization_admin` - Retrieve organization pages

## Testing
After setting up the environment variables, test the LinkedIn OAuth flow:
1. Click "Connect LinkedIn Account"
2. You should be redirected to LinkedIn's OAuth page
3. After authorization, you'll be redirected back to your app
4. The access token will be stored for posting capabilities

## Troubleshooting
If you still get the "client_id" error:
1. Verify the `.env` file is in the project root
2. Check that `VITE_LINKEDIN_CLIENT_ID` is set correctly
3. Restart the development server
4. Check the browser console for any error messages
