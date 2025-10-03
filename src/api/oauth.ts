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

  static async handleCallback(code: string, userId: string): Promise<FacebookOAuthResponse> {
    try {
      // Use Firebase function to exchange code for access token (avoids CORS)
      const response = await fetch('https://us-central1-marketmate-101.cloudfunctions.net/exchangeFacebookCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: OAUTH_CONFIG.facebook.redirectUri,
          userId: userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to exchange code for token'
        };
      }

      return {
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        scope: result.scope,
        userInfo: result.userInfo,
        pageInfo: result.userInfo?.pages || [],
        instagramInfo: result.userInfo?.instagramInfo
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

  static async handleCallback(code: string, userId: string): Promise<LinkedInOAuthResponse> {
    try {
      // Use Firebase function to exchange code for access token (avoids CORS)
      const response = await fetch('https://exchangelinkedincode-zq4takmina-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: OAUTH_CONFIG.linkedin.redirectUri,
          userId: userId,
          clientId: OAUTH_CONFIG.linkedin.clientId,
          clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to exchange code for token'
        };
      }

      return {
        success: true,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        scope: 'w_member_social,w_organization_social,r_basicprofile',
        profile: {
          id: result.userInfo?.id || '',
          firstName: result.userInfo?.firstName || '',
          lastName: result.userInfo?.lastName || '',
          email: result.userInfo?.email || ''
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
  static async handleFacebookCallback(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await FacebookOAuth.handleCallback(code, userId);
      
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

  static async handleLinkedInCallback(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LinkedInOAuth.handleCallback(code, userId);
      
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