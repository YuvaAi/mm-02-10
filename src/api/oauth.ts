// OAuth Configuration and Services
export interface OAuthConfig {
  facebook: {
    clientId: string;
    redirectUri: string;
    scope: string;
    authUrl: string;
  };
}

export interface OAuthTokens {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export interface FacebookOAuthResponse {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
  userInfo?: {
    id: string;
    name: string;
    email: string;
  };
  pages?: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
  }>;
}

// Get redirect URI for OAuth
const getRedirectUri = (platform: 'facebook') => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/oauth/${platform}/callback`;
};

// OAuth Configuration
export const OAUTH_CONFIG: OAuthConfig = {
  facebook: {
    clientId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    redirectUri: getRedirectUri('facebook'),
    scope: 'public_profile,email,pages_manage_posts,pages_manage_ads,pages_show_list,business_management,pages_read_engagement,instagram_basic,ads_management,ads_read,instagram_content_publish,instagram_manage_insights,catalog_management,leads_retrieval,pages_messaging,pages_messaging_subscriptions',
    authUrl: 'https://www.facebook.com/v8.0/dialog/oauth'
  }
};

// Facebook OAuth Service
export class FacebookOAuthService {
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static storeState(state: string): void {
    sessionStorage.setItem('oauth_state', state);
  }

  private static getStoredState(): string | null {
    return sessionStorage.getItem('oauth_state');
  }

  private static clearState(): void {
    sessionStorage.removeItem('oauth_state');
  }

  // Initiate Facebook OAuth flow using implicit flow (simpler, no backend needed)
  static initiateAuth(): void {
    // Check if Facebook App ID is configured
    if (!OAUTH_CONFIG.facebook.clientId) {
      console.error('Facebook App ID not configured. Please set VITE_FACEBOOK_APP_ID environment variable.');
      alert('Facebook OAuth is not configured. Please contact the administrator.');
      return;
    }

    const state = this.generateState();
    this.storeState(state);
    
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.facebook.clientId,
      redirect_uri: OAUTH_CONFIG.facebook.redirectUri,
      scope: OAUTH_CONFIG.facebook.scope,
      response_type: 'token', // Use implicit flow
      state: state
    });

    const authUrl = `${OAUTH_CONFIG.facebook.authUrl}?${params.toString()}`;
    console.log('Facebook OAuth Configuration:', {
      clientId: OAUTH_CONFIG.facebook.clientId,
      redirectUri: OAUTH_CONFIG.facebook.redirectUri,
      scope: OAUTH_CONFIG.facebook.scope,
      authUrl: authUrl
    });
    
    console.log('Redirecting to Facebook OAuth:', authUrl);
    window.location.href = authUrl;
  }

  // Handle OAuth callback (implicit flow - access token in URL fragment)
  static async handleCallback(accessToken: string, state: string): Promise<FacebookOAuthResponse> {
    try {
      // Verify state parameter
      const storedState = this.getStoredState();
      if (!storedState || storedState !== state) {
        return {
          success: false,
          error: 'Invalid state parameter'
        };
      }
      this.clearState();

      console.log('OAuth access token received:', accessToken);
      console.log('State parameter:', state);
      
      // For implicit flow, we already have the access token
      const expiresIn = 3600; // Default expiration

      // Get user info (basic permissions only)
      const userResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
      const userData = await userResponse.json();

      // Try to get pages (may fail if permissions not granted)
      let pagesData = { data: [] };
      try {
        const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
        pagesData = await pagesResponse.json();
      } catch (error) {
        console.warn('Could not fetch pages - permissions may not be granted:', error);
      }

      return {
        success: true,
        accessToken,
        expiresIn,
        userInfo: {
          id: userData.id,
          name: userData.name,
          email: userData.email
        },
        pages: pagesData.data || []
      };

    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Store tokens securely
  static storeTokens(tokens: OAuthTokens, userInfo: any): void {
    const tokenData = {
      ...tokens,
      userInfo,
      timestamp: Date.now()
    };
    
    // Store in sessionStorage for security (cleared on browser close)
    sessionStorage.setItem('facebook_oauth_tokens', JSON.stringify(tokenData));
    
    // Also store in localStorage for persistence (with expiration)
    const expirationTime = Date.now() + (tokens.expiresIn * 1000);
    localStorage.setItem('facebook_oauth_expires', expirationTime.toString());
  }

  // Get stored tokens
  static getStoredTokens(): OAuthTokens | null {
    try {
      const tokenData = sessionStorage.getItem('facebook_oauth_tokens');
      if (!tokenData) return null;

      const parsed = JSON.parse(tokenData);
      const expirationTime = localStorage.getItem('facebook_oauth_expires');
      
      if (expirationTime && Date.now() > parseInt(expirationTime)) {
        this.clearTokens();
        return null;
      }

      return {
        accessToken: parsed.accessToken,
        expiresIn: parsed.expiresIn,
        tokenType: parsed.tokenType,
        scope: parsed.scope
      };
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      return null;
    }
  }

  // Clear stored tokens
  static clearTokens(): void {
    sessionStorage.removeItem('facebook_oauth_tokens');
    localStorage.removeItem('facebook_oauth_expires');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getStoredTokens() !== null;
  }
}

// Utility function to check if OAuth is configured
export const isOAuthConfigured = (): boolean => {
  return !!(import.meta.env.VITE_FACEBOOK_APP_ID && import.meta.env.VITE_APP_URL);
};
