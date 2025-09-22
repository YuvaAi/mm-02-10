// OAuth Service for Social Media Platform Connections
import { OAUTH_CONFIG } from '../api/oauth';

export interface OAuthServiceConfig {
  platform: 'facebook' | 'linkedin';
  redirectUri?: string;
}

export class OAuthService {
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static getStoredState(): string | null {
    return sessionStorage.getItem('oauth_state');
  }

  private static storeState(state: string): void {
    sessionStorage.setItem('oauth_state', state);
  }

  private static clearState(): void {
    sessionStorage.removeItem('oauth_state');
  }

  /**
   * Initiate OAuth flow for social media platform connection
   * This is separate from user authentication and is used for connecting social media accounts
   */
  static initiateSocialMediaConnection(platform: 'facebook' | 'linkedin'): void {
    const config = OAUTH_CONFIG[platform];
    
    if (!config.clientId) {
      throw new Error(`${platform} OAuth is not configured. Please check your environment variables.`);
    }

    const state = this.generateState();
    this.storeState(state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;
    
    console.log(`Initiating ${platform} OAuth flow:`, {
      authUrl,
      redirectUri: config.redirectUri,
      scope: config.scope
    });

    // Redirect to OAuth provider
    window.location.href = authUrl;
  }

  /**
   * Validate state parameter to prevent CSRF attacks
   */
  static validateState(receivedState: string): boolean {
    const storedState = this.getStoredState();
    this.clearState();
    return storedState === receivedState;
  }

  /**
   * Get OAuth configuration for a platform
   */
  static getConfig(platform: 'facebook' | 'linkedin') {
    return OAUTH_CONFIG[platform];
  }

  /**
   * Check if OAuth is properly configured
   */
  static isConfigured(platform: 'facebook' | 'linkedin'): boolean {
    const config = OAUTH_CONFIG[platform];
    return !!(config.clientId && config.redirectUri);
  }

  /**
   * Get all configured platforms
   */
  static getConfiguredPlatforms(): ('facebook' | 'linkedin')[] {
    const platforms: ('facebook' | 'linkedin')[] = [];
    if (this.isConfigured('facebook')) platforms.push('facebook');
    if (this.isConfigured('linkedin')) platforms.push('linkedin');
    return platforms;
  }
}
