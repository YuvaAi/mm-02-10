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

// Enhanced Facebook sign-in that captures access token and ads credentials
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

      // Now fetch and save Facebook Ads credentials
      console.log('🚀 STARTING Facebook Ads credential extraction...');
      console.log('🚀 DEBUG: About to fetch Facebook Ads credentials...');
      console.log('🚀 FORCE CACHE REFRESH - VERSION 2.0');
      try {
        console.log('🔍 Fetching Facebook Ads credentials...');
        console.log('🔍 Using access token:', accessToken.substring(0, 20) + '...');
        
        // Get ad accounts for the user
        const adAccountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`);
        const adAccountsData = await adAccountsResponse.json();

        console.log('🔍 Ad accounts API response:', adAccountsResponse.status, adAccountsData);

        if (adAccountsResponse.ok && adAccountsData.data && adAccountsData.data.length > 0) {
          const firstAdAccount = adAccountsData.data[0];
          console.log('Facebook Ad Account found:', firstAdAccount);

          // Get campaigns for the ad account
          let campaignId = null;
          try {
            // Fix double "act_" prefix issue - check if ID already has "act_" prefix
            const adAccountId = firstAdAccount.id.startsWith('act_') ? firstAdAccount.id : `act_${firstAdAccount.id}`;
            const campaignsResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=id,name,status&limit=1&access_token=${accessToken}`);
            const campaignsData = await campaignsResponse.json();

            if (campaignsResponse.ok && campaignsData.data && campaignsData.data.length > 0) {
              campaignId = campaignsData.data[0].id;
              console.log('Existing campaign found:', campaignId);
            } else {
              // Create a default campaign if none exists
              console.log('No existing campaigns found, will create one when needed');
            }
          } catch (campaignError) {
            console.warn('Could not fetch campaigns:', campaignError);
          }

          // Save Facebook Ads credentials
          const adsSaveResult = await saveCredential(user.uid, {
            type: 'facebook_ads',
            accessToken: accessToken, // Use the main access token for ads
            adAccountId: firstAdAccount.id,
            adAccountName: firstAdAccount.name,
            currency: firstAdAccount.currency,
            accountStatus: firstAdAccount.account_status,
            pageId: firstPage.id, // Link to the page
            pageName: firstPage.name,
            campaignId: campaignId, // May be null if no campaigns exist yet
            email: user.email || '',
            displayName: user.displayName || '',
            createdAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            isAutoConnected: true
          });

          if (adsSaveResult.success) {
            console.log('Facebook Ads credentials saved successfully:', {
              adAccountId: firstAdAccount.id,
              adAccountName: firstAdAccount.name,
              campaignId: campaignId
            });
          } else {
            console.error('Failed to save Facebook Ads credentials:', adsSaveResult.error);
          }
        } else {
          console.warn('⚠️ No Facebook Ad Accounts found or error fetching them:', adAccountsData);
          console.warn('⚠️ This might be because:');
          console.warn('⚠️ 1. User does not have a Facebook Ad Account');
          console.warn('⚠️ 2. ads_management permission not granted');
          console.warn('⚠️ 3. Facebook App does not have Marketing API access');
          console.warn('⚠️ 4. User needs to grant permissions during login');
        }
      } catch (adsError) {
        console.error('🚨 ERROR in Facebook Ads credential extraction:', adsError);
        console.error('🚨 Full error details:', {
          message: adsError.message,
          stack: adsError.stack,
          name: adsError.name
        });
        // Don't fail the entire process if ads credentials can't be fetched
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
      
      console.log('🚀 DEBUG: Instagram section completed, continuing...');
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

// Enhanced LinkedIn sign-in that captures access token and saves credentials
// NOTE: The backend Firebase function already handles profile fetching and credential saving
// This function is kept for backward compatibility and logging purposes
export async function signInWithLinkedInAndConnect(user: User, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Auto-connecting LinkedIn account for user:', user.uid);
    console.log('LinkedIn credentials already saved by backend function');
    
    // The backend Firebase function (exchangeLinkedInCode) already:
    // 1. Fetched the LinkedIn profile
    // 2. Fetched organization pages
    // 3. Saved all credentials to Firestore
    // So we don't need to do anything here except confirm success
    
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in LinkedIn auto-connect:', err);
    return { success: false, error: err.message };
  }
}

// Auto-connect LinkedIn account when user signs up with LinkedIn
export async function autoConnectLinkedInAccount(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('autoConnectLinkedInAccount called for user:', user.uid);
    
    // Get stored LinkedIn access token
    const accessToken = sessionStorage.getItem('linkedin_access_token');
    console.log('LinkedIn access token from session storage:', accessToken ? 'Found' : 'Not found');
    
    if (!accessToken) {
      console.warn('No LinkedIn access token found in session storage');
      return { success: false, error: 'No LinkedIn access token available' };
    }

    // Use the enhanced function with the access token
    const result = await signInWithLinkedInAndConnect(user, accessToken);
    console.log('signInWithLinkedInAndConnect result:', result);
    return result;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in autoConnectLinkedInAccount:', err);
    return { success: false, error: err.message };
  }
}

// Check if LinkedIn is already connected and handle reconnection
export async function checkLinkedInConnection(user: User): Promise<{ success: boolean; error?: string; isConnected?: boolean }> {
  try {
    console.log('Checking LinkedIn connection for user:', user.uid);
    
    // Import getCredential function
    const { getCredential } = await import('../firebase/firestore');
    
    // Check if LinkedIn credentials already exist
    const credentialResult = await getCredential(user.uid, 'linkedin');
    
    if (credentialResult.success && credentialResult.data) {
      console.log('LinkedIn credentials found:', credentialResult.data);
      
      // Check if the access token is still valid
      const { validateLinkedInCredentials } = await import('../api/linkedin');
      const validationResult = await validateLinkedInCredentials(
        credentialResult.data.accessToken,
        credentialResult.data.linkedInPageId,
        credentialResult.data.hasOrganizationPages
      );
      
      if (validationResult.success) {
        console.log('LinkedIn connection is still valid');
        return { success: true, isConnected: true };
      } else {
        console.log('LinkedIn connection expired, needs reconnection');
        return { success: true, isConnected: false };
      }
    } else {
      console.log('No LinkedIn credentials found');
      return { success: true, isConnected: false };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error checking LinkedIn connection:', err);
    return { success: false, error: err.message };
  }
}