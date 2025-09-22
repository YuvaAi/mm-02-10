// Auto-connect social media accounts when user signs up with social login
import { User } from 'firebase/auth';
import { saveCredential } from '../firebase/firestore';

export interface SocialAccountData {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'google';
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  username?: string;
  email?: string;
  profileData?: any;
}


// Auto-connect Google account when user signs up with Google
export async function autoConnectGoogleAccount(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Google user signed up:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    // Google doesn't provide direct access to social media accounts
    // But we can store the user's Google profile information
    const googleSaveResult = await saveCredential(user.uid, {
      type: 'google',
      accessToken: 'google_signup_token', // Placeholder
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      isAutoConnected: true
    });

    if (googleSaveResult.success) {
      console.log('Google credentials saved successfully');
    } else {
      console.error('Failed to save Google credentials:', googleSaveResult.error);
      return { success: false, error: googleSaveResult.error || 'Failed to save Google credentials' };
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

// Check if user signed up with social login and auto-connect accounts
export async function handleSocialSignup(user: User): Promise<void> {
  try {
    console.log('=== handleSocialSignup START ===');
    console.log('handleSocialSignup called for user:', user.uid);
    console.log('User object:', user);
    console.log('User providerData:', user.providerData);
    const providerId = user.providerData[0]?.providerId;
    console.log('Provider ID:', providerId);
    
    switch (providerId) {
      case 'facebook.com':
        console.log('Auto-connecting Facebook account...');
        await autoConnectFacebookAccount(user);
        break;
      case 'google.com':
        console.log('Auto-connecting Google account...');
        await autoConnectGoogleAccount(user);
        break;
      default:
        console.log('No auto-connect available for provider:', providerId);
    }
    console.log('=== handleSocialSignup END ===');
  } catch (error: unknown) {
    const err = error as Error;
    console.error('=== handleSocialSignup ERROR ===');
    console.error('Error handling social signup:', err.message);
    console.error('Full error:', err);
    console.error('=== handleSocialSignup ERROR END ===');
  }
}

// Enhanced Facebook sign-in that captures access token
export async function signInWithFacebookAndConnect(user: User, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Auto-connecting Facebook account for user:', user.uid);
    
    // Fetch user's Facebook pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('Failed to fetch Facebook pages:', pagesData);
      return { success: false, error: pagesData.error?.message || 'Failed to fetch Facebook pages' };
    }

    console.log('Facebook pages fetched:', pagesData.data?.length || 0);

    // Save Facebook credentials with the first page
    if (pagesData.data && pagesData.data.length > 0) {
      const firstPage = pagesData.data[0];
      
      const saveResult = await saveCredential(user.uid, {
        type: 'facebook',
        accessToken: firstPage.access_token,
        pageId: firstPage.id,
        pageName: firstPage.name,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        isAutoConnected: true
      });

      if (saveResult.success) {
        console.log('Facebook credentials saved successfully for page:', firstPage.name);
      } else {
        console.error('Failed to save Facebook credentials:', saveResult.error);
        return { success: false, error: saveResult.error || 'Failed to save credentials' };
      }

      // Try to get Instagram business account
      try {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v21.0/${firstPage.id}?fields=instagram_business_account&access_token=${firstPage.access_token}`
        );
        const instagramData = await instagramResponse.json();
        
        if (instagramData.instagram_business_account) {
          const instagramAccountResponse = await fetch(
            `https://graph.facebook.com/v21.0/${instagramData.instagram_business_account.id}?fields=id,username&access_token=${firstPage.access_token}`
          );
          const instagramAccountData = await instagramAccountResponse.json();
          
          if (instagramAccountResponse.ok) {
            const instagramSaveResult = await saveCredential(user.uid, {
              type: 'instagram',
              accessToken: firstPage.access_token,
              instagramUserId: instagramAccountData.id,
              username: instagramAccountData.username,
              createdAt: new Date().toISOString(),
              lastValidated: new Date().toISOString(),
              isAutoConnected: true
            });
            
            if (instagramSaveResult.success) {
              console.log('Instagram credentials saved successfully for account:', instagramAccountData.username);
            } else {
              console.error('Failed to save Instagram credentials:', instagramSaveResult.error);
            }
          }
        }
      } catch (instagramError) {
        console.warn('Could not auto-connect Instagram:', instagramError);
      }
    } else {
      console.warn('No Facebook pages found for user');
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in Facebook auto-connect:', err);
    return { success: false, error: err.message };
  }
}

// Auto-connect Facebook account when user signs up with Facebook
export async function autoConnectFacebookAccount(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('autoConnectFacebookAccount called for user:', user.uid);
    
    // Get stored Facebook access token
    const accessToken = sessionStorage.getItem('facebook_access_token');
    console.log('Facebook access token from session storage:', accessToken ? 'Found' : 'Not found');
    
    if (!accessToken) {
      console.warn('No Facebook access token found in session storage');
      return { success: false, error: 'No Facebook access token available' };
    }

    // Use the enhanced function with the access token
    const result = await signInWithFacebookAndConnect(user, accessToken);
    console.log('signInWithFacebookAndConnect result:', result);
    return result;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in autoConnectFacebookAccount:', err);
    return { success: false, error: err.message };
  }
}
