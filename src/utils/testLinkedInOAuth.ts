// Test LinkedIn OAuth URL construction
export const testLinkedInOAuthURL = () => {
  const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/linkedin/callback`;
  const scope = 'r_liteprofile,r_emailaddress,w_member_social,w_organization_social';
  
  console.log('=== LinkedIn OAuth URL Test ===');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  console.log('Scope:', scope);
  console.log('Current Origin:', window.location.origin);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: 'test-state-123',
    scope: scope
  });
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  
  console.log('Generated OAuth URL:', authUrl);
  console.log('URL Parameters:', Object.fromEntries(params));
  
  // Test if URL is valid
  try {
    const url = new URL(authUrl);
    console.log('✅ URL is valid');
    console.log('Hostname:', url.hostname);
    console.log('Pathname:', url.pathname);
    console.log('Search params:', url.search);
    
    // Test the URL by opening it
    console.log('Opening LinkedIn OAuth URL in new tab...');
    window.open(authUrl, '_blank');
    
  } catch (error) {
    console.error('❌ Invalid URL:', error);
  }
  
  return authUrl;
};

// Make it available globally for testing
(window as any).testLinkedInOAuthURL = testLinkedInOAuthURL;
