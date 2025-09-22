
// OAuth Integration for Social Media Platforms
import { saveCredential } from '../firebase/firestore';

// OAuth Configuration
const getRedirectUri = (platform: 'facebook' | 'linkedin') => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/oauth/${platform}/callback`;
};

export const OAUTH_CONFIG = {
  facebook: {
    clientId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    redirectUri: getRedirectUri('facebook'),
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,ads_management,ads_read,business_management,public_profile,email',
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth'
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: getRedirectUri('linkedin'),
    scope: 'r_basicprofile,email,w_member_social,rw_ads,w_organization_social,r_organization_social,r_ads',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
  }
};

// OAuth Response Types
export interface OAuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  error?: string;
  userInfo?: any;
}

export interface FacebookOAuthResponse extends OAuthResponse {
  pageInfo?: {
    id: string;
    name: string;
    access_token: string;
  }[];
  instagramInfo?: {
    id: string;
    username: string;
  };
}

export interface LinkedInOAuthResponse extends OAuthResponse {
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

// Facebook OAuth Flow
export class FacebookOAuth {
  static initiateAuth(): void {
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.facebook.clientId,
      redirect_uri: OAUTH_CONFIG.facebook.redirectUri,
      scope: OAUTH_CONFIG.facebook.scope,
      response_type: 'code',
      state: this.generateState()
    });

    const authUrl = `${OAUTH_CONFIG.facebook.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  }

  static async handleCallback(code: string, state: string): Promise<FacebookOAuthResponse> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: OAUTH_CONFIG.facebook.clientId,
          client_secret: import.meta.env.VITE_FACEBOOK_APP_SECRET || '',
          redirect_uri: OAUTH_CONFIG.facebook.redirectUri,
          code: code
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return {
          success: false,
          error: tokenData.error?.message || 'Failed to exchange code for token'
        };
      }

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in;

      // Get user info and pages
      const [userResponse, pagesResponse] = await Promise.all([
        fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`),
        fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`)
      ]);

      const userData = await userResponse.json();
      const pagesData = await pagesResponse.json();

      // Get Instagram business accounts
      let instagramInfo = null;
      if (pagesData.data && pagesData.data.length > 0) {
        const firstPage = pagesData.data[0];
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
            instagramInfo = instagramAccountData;
          }
        } catch (error) {
          console.warn('Could not fetch Instagram info:', error);
        }
      }

      return {
        success: true,
        accessToken,
        expiresIn,
        scope: tokenData.scope,
        userInfo: userData,
        pageInfo: pagesData.data || [],
        instagramInfo
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'OAuth callback failed'
      };
    }
  }

  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// LinkedIn OAuth Flow
export class LinkedInOAuth {
  static initiateAuth(): void {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: OAUTH_CONFIG.linkedin.clientId,
      redirect_uri: OAUTH_CONFIG.linkedin.redirectUri,
      state: this.generateState(),
      scope: OAUTH_CONFIG.linkedin.scope
    });

    const authUrl = `${OAUTH_CONFIG.linkedin.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  }

  static async handleCallback(code: string, state: string): Promise<LinkedInOAuthResponse> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: OAUTH_CONFIG.linkedin.redirectUri,
          client_id: OAUTH_CONFIG.linkedin.clientId,
          client_secret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || ''
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return {
          success: false,
          error: tokenData.error_description || 'Failed to exchange code for token'
        };
      }

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in;

      // Get user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const profileData = await profileResponse.json();

      return {
        success: true,
        accessToken,
        expiresIn,
        scope: tokenData.scope,
        profile: {
          id: profileData.id,
          firstName: profileData.firstName?.localized?.en_US || '',
          lastName: profileData.lastName?.localized?.en_US || '',
          email: profileData.emailAddress
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'LinkedIn OAuth callback failed'
      };
    }
  }

  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

// OAuth Callback Handler
export class OAuthCallbackHandler {
  static async handleFacebookCallback(userId: string, code: string, state: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FacebookOAuth.handleCallback(code, state);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Save Facebook credentials
      if (result.pageInfo && result.pageInfo.length > 0) {
        const firstPage = result.pageInfo[0];
        await saveCredential(userId, {
          type: 'facebook',
          accessToken: firstPage.access_token,
          pageId: firstPage.id,
          pageName: firstPage.name,
          expiresIn: result.expiresIn,
          createdAt: new Date().toISOString(),
          lastValidated: new Date().toISOString()
        });
      }

      // Save Instagram credentials if available
      if (result.instagramInfo) {
        await saveCredential(userId, {
          type: 'instagram',
          accessToken: result.accessToken!,
          instagramUserId: result.instagramInfo.id,
          username: result.instagramInfo.username,
          expiresIn: result.expiresIn,
          createdAt: new Date().toISOString(),
          lastValidated: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  static async handleLinkedInCallback(userId: string, code: string, state: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LinkedInOAuth.handleCallback(code, state);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Save LinkedIn credentials
      await saveCredential(userId, {
        type: 'linkedin',
        accessToken: result.accessToken!,
        linkedInUserId: result.profile!.id,
        firstName: result.profile!.firstName,
        lastName: result.profile!.lastName,
        email: result.profile!.email,
        expiresIn: result.expiresIn,
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString()
      });

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
}

// Utility function to check if OAuth is configured
export function isOAuthConfigured(): boolean {
  return !!(
    OAUTH_CONFIG.facebook.clientId &&
    OAUTH_CONFIG.linkedin.clientId &&
    import.meta.env.VITE_FACEBOOK_APP_SECRET &&
    import.meta.env.VITE_LINKEDIN_CLIENT_SECRET
  );
}
