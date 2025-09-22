// LinkedIn API Integration
export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

// Publish content to LinkedIn using LinkedIn API
export async function publishToLinkedIn(
  content: string,
  linkedInUserId: string,
  accessToken: string,
  mediaFiles?: File[]
): Promise<LinkedInPostResult> {
  try {
    console.log('💼 Starting LinkedIn posting process...');
    console.log('LinkedIn User ID:', linkedInUserId);
    console.log('Content length:', content.length);

    // LinkedIn API endpoint for creating posts
    let postBody: any = {
      author: `urn:li:person:${linkedInUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // If media files are provided, update the post to include media
    if (mediaFiles && mediaFiles.length > 0) {
      // For LinkedIn, we would need to upload the media first and get a media asset URN
      // This is a simplified implementation - in production you'd need to handle media upload
      console.log('Media files provided for LinkedIn post');
      postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      // Note: Full media upload implementation would require additional LinkedIn API calls
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postBody)
    });

    const result = await response.json();
    console.log('📥 LinkedIn publish response:', result);

    if (!response.ok) {
      console.error('❌ LinkedIn publishing failed:', result);
      return {
        success: false,
        error: result.message || result.error_description || 'Failed to publish to LinkedIn'
      };
    }

    // Extract post ID from LinkedIn response
    const postId = result.id || 'unknown';
    console.log('✅ LinkedIn post published successfully:', postId);

    return {
      success: true,
      postId: postId
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

// Fetch LinkedIn post analytics
export async function fetchLinkedInMetrics(
  postId: string,
  accessToken: string
): Promise<{
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
}> {
  try {
    console.log('🔍 Fetching LinkedIn metrics for post:', postId);
    
    // LinkedIn API endpoint for post analytics
    const response = await fetch(
      `https://api.linkedin.com/v2/socialActions/${postId}/statistics`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('📊 LinkedIn analytics response:', data);

    if (!response.ok) {
      console.warn('LinkedIn API error:', data);
      throw new Error(data.message || data.error_description || 'Failed to fetch LinkedIn insights');
    }

    // Extract metrics from LinkedIn response
    const impressions = data.numViews || 0;
    const likes = data.numLikes || 0;
    const comments = data.numComments || 0;
    const shares = data.numShares || 0;
    const clicks = data.numClicks || 0;
    
    // Calculate derived metrics
    const reach = impressions; // LinkedIn doesn't distinguish between impressions and reach
    const engagement = likes + comments + shares;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
      postId,
      platform: 'linkedin',
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      clicks,
      ctr,
      createdAt: data.createdAt,
      content: data.text || '',
      imageUrl: data.imageUrl || ''
    };
  } catch (error: unknown) {
    const e = error as Error;
    console.warn('LinkedIn metrics error:', e.message);
    
    // Return zero metrics on error
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

// Get LinkedIn post details
export async function getLinkedInPostDetails(
  postId: string,
  accessToken: string
): Promise<{
  success: boolean;
  post?: {
    id: string;
    text: string;
    createdAt: string;
    imageUrl?: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error_description || 'Failed to fetch LinkedIn post details'
      };
    }

    return {
      success: true,
      post: {
        id: data.id,
        text: data.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
        createdAt: data.createdAt,
        imageUrl: data.specificContent?.['com.linkedin.ugc.ShareContent']?.media?.[0]?.media || ''
      }
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      error: networkError.message || 'Network error while fetching LinkedIn post details'
    };
  }
}

// Validate LinkedIn credentials
export async function validateLinkedInCredentials(
  accessToken: string,
  linkedInUserId: string
): Promise<{ success: boolean; profile?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/people/(id:${linkedInUserId})?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error_description || 'Failed to validate LinkedIn credentials'
      };
    }

    return {
      success: true,
      profile: data
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      error: networkError.message || 'Network error while validating LinkedIn credentials'
    };
  }
}