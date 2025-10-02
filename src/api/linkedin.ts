// LinkedIn API Integration
export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface LinkedInMetrics {
  postId: string;
  platform: 'linkedin';
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  ctr: number;
  createdAt?: string;
  content?: string;
  imageUrl?: string;
}

// Publish content to LinkedIn via backend Firebase function to avoid CORS issues
export async function publishToLinkedIn(
  content: string,
  linkedInPageId: string,
  accessToken: string,
  mediaFiles?: File[],
  isOrganizationPage: boolean = false
): Promise<LinkedInPostResult> {
  try {
    console.log('🔗 Starting LinkedIn posting process...');
    console.log('LinkedIn Page ID:', linkedInPageId);
    console.log('Is Organization Page:', isOrganizationPage);
    console.log('Content length:', content.length);
    console.log('Media Files:', mediaFiles?.length || 0);

    // If media files are provided, we would need to upload them first
    // For now, LinkedIn API v2 has limited media support, so we'll focus on text posts
    if (mediaFiles && mediaFiles.length > 0) {
      console.warn('⚠️ LinkedIn media upload not implemented yet. Publishing text-only post.');
    }

    console.log('📤 Publishing to LinkedIn via backend function:', {
      content: content.substring(0, 100) + '...',
      linkedInPageId,
      hasAccessToken: !!accessToken
    });

    // Use backend Firebase function to avoid CORS issues
    const response = await fetch('https://us-central1-marketmate-101.cloudfunctions.net/publishLinkedInPost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        linkedInPageId,
        accessToken,
        isOrganizationPage
      })
    });

    const result = await response.json();
    console.log('📥 LinkedIn posting response:', {
      status: response.status,
      statusText: response.statusText,
      result: result
    });

    if (!response.ok || !result.success) {
      console.error('❌ LinkedIn publishing failed:', result);
      const errorMessage = result.error || 'Failed to publish to LinkedIn';
      
      // Provide more specific error messages
      if (errorMessage.includes('unauthorized') || response.status === 401) {
        return {
          success: false,
          error: 'LinkedIn authorization failed. Please check your access token and try re-authorizing your LinkedIn account.'
        };
      } else if (errorMessage.includes('forbidden') || response.status === 403) {
        return {
          success: false,
          error: 'LinkedIn posting permission denied. Please ensure your LinkedIn app has the required permissions.'
        };
      }
      
      return {
        success: false,
        error: `LinkedIn API Error: ${errorMessage}`
      };
    }

    const linkedInPostId = result.postId;
    console.log('✅ LinkedIn post published successfully:', linkedInPostId);

    return {
      success: true,
      postId: linkedInPostId
    };

  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('🔥 Error in LinkedIn posting:', networkError);
    return {
      success: false,
      error: networkError.message || 'Network error while posting to LinkedIn'
    };
  }
}

// Validate LinkedIn credentials
export async function validateLinkedInCredentials(
  accessToken: string,
  linkedInPageId: string,
  isOrganizationPage: boolean = false
): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    console.log('🔍 Validating LinkedIn credentials for page:', linkedInPageId);
    console.log('Is Organization Page:', isOrganizationPage);
    
    let response;
    let data;
    
    if (isOrganizationPage) {
      // Validate organization page
      response = await fetch(
        `https://api.linkedin.com/v2/organizations/${linkedInPageId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      data = await response.json();
      
      if (response.ok) {
        console.log('✅ LinkedIn organization page validation successful:', data.name);
        return {
          success: true,
          name: data.name
        };
      }
    } else {
      // Validate personal profile
      response = await fetch(
        `https://api.linkedin.com/v2/people/${linkedInPageId}?projection=(id,firstName,lastName)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );
      data = await response.json();
      
      if (response.ok) {
        const fullName = `${data.firstName?.localized?.en_US || ''} ${data.lastName?.localized?.en_US || ''}`.trim();
        console.log('✅ LinkedIn personal profile validation successful:', fullName);
        return {
          success: true,
          name: fullName
        };
      }
    }

    console.error('❌ LinkedIn account validation failed:', data);
    return {
      success: false,
      error: data.message || 'Failed to validate LinkedIn credentials'
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('❌ LinkedIn validation error:', networkError);
    return {
      success: false,
      error: networkError.message || 'Network error while validating LinkedIn credentials'
    };
  }
}

// Fetch LinkedIn metrics for analytics
export async function fetchLinkedInMetrics(postId: string, accessToken: string): Promise<LinkedInMetrics> {
  try {
    console.log('🔍 Fetching LinkedIn metrics for post:', postId);
    
    // LinkedIn API v2 doesn't provide detailed analytics for individual posts
    // We'll return basic metrics structure with placeholder values
    // In a real implementation, you would need LinkedIn Marketing API access
    
    console.log('⚠️ LinkedIn metrics: LinkedIn API v2 has limited analytics for individual posts');
    console.log('⚠️ For detailed metrics, LinkedIn Marketing API access is required');
    
    // Return basic structure with placeholder values
    return {
      postId,
      platform: 'linkedin',
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      ctr: 0,
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    console.warn('LinkedIn metrics error:', networkError.message);
    return {
      postId,
      platform: 'linkedin',
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      ctr: 0,
    };
  }
}
