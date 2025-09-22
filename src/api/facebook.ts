// Facebook Graph API Integration
export interface FacebookPermission {
  permission: string;
  status: string;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

// Check Facebook permissions
export async function checkFacebookPermissions(accessToken: string): Promise<{
  success: boolean;
  permissions: FacebookPermission[];
  error?: string;
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        permissions: [],
        error: data.error?.message || 'Failed to check permissions'
      };
    }

    return {
      success: true,
      permissions: data.data || []
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      permissions: [],
      error: networkError.message || 'Network error while checking permissions'
    };
  }
}

// Get Facebook Pages
export async function getFacebookPages(accessToken: string): Promise<{
  success: boolean;
  pages: FacebookPageInfo[];
  error?: string;
}> {
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Facebook API Error:', data);
      return {
        success: false,
        pages: [],
        error: data.error?.message || `API Error: ${response.status} ${response.statusText}`
      };
    }

    console.log('Facebook Pages Response:', data);
    
    // Handle case where user has no pages
    if (!data.data || data.data.length === 0) {
      return {
        success: true,
        pages: [],
        error: 'No Facebook pages found. Make sure you have admin access to at least one Facebook page.'
      };
    }
    return {
      success: true,
      pages: data.data || []
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('Network error fetching Facebook pages:', networkError);
    return {
      success: false,
      pages: [],
      error: networkError.message || 'Network error while fetching pages'
    };
  }
}

// Validate Facebook credentials
export async function validateFacebookCredentials(accessToken: string, pageId: string): Promise<{
  success: boolean;
  pageInfo?: FacebookPageInfo;
  permissions?: FacebookPermission[];
  error?: string;
}> {
  try {
    console.log('🔍 Validating Facebook credentials for page:', pageId);
    console.log('🔍 Using access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    // Skip permission check entirely to avoid the Page permissions error
    console.log('⏭️ Skipping Facebook permission check to avoid API error');
    console.log('⚠️ Note: Permission validation is disabled. Publishing will be attempted directly.');

    // IMPORTANT: The accessToken passed here should be the PAGE ACCESS TOKEN, not the user token
    // If it's a page access token, we can use it directly
    // If it's a user token, we need to get the page access token
    
    console.log('🔍 Checking if access token is a page token or user token...');
    
    // Test if this is a page access token by trying to access the page directly
    try {
      console.log('🧪 Testing if access token is a page access token...');
      const testResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=id,name&access_token=${accessToken}`);
      const testData = await testResponse.json();
      
      if (testResponse.ok) {
        console.log('✅ Access token is a valid page access token for:', testData.name);
        // This is a page access token, we can use it directly
        const pageInfo: FacebookPageInfo = {
          id: testData.id,
          name: testData.name,
          access_token: accessToken,
          category: 'Unknown'
        };
        
        return {
          success: true,
          pageInfo: pageInfo,
          permissions: []
        };
      } else {
        console.log('⚠️ Access token is not a page access token, trying to get page access token...');
        // This is a user token, we need to get the page access token
        const pagesResult = await getFacebookPages(accessToken);
        if (!pagesResult.success) {
          console.error('❌ Failed to get Facebook pages:', pagesResult.error);
          return {
            success: false,
            error: pagesResult.error
          };
        }

        console.log('📋 Available Facebook pages:', pagesResult.pages.map(p => `${p.name} (${p.id})`));

        const targetPage = pagesResult.pages.find(page => page.id === pageId);
        if (!targetPage) {
          const availablePagesList = pagesResult.pages.length > 0 
            ? pagesResult.pages.map(p => `${p.name} (${p.id})`).join(', ')
            : 'No pages available - you may not have admin access to any Facebook pages';
            
          console.error('❌ Page not found:', { pageId, availablePages: availablePagesList });
          return {
            success: false,
            error: `Page ID ${pageId} not found in your accessible pages. Available pages: ${availablePagesList}. Make sure you have admin access to the page and the correct permissions.`
          };
        }

        console.log('✅ Facebook page validation successful:', targetPage.name);
        console.log('✅ Page access token available:', !!targetPage.access_token);

        return {
          success: true,
          pageInfo: targetPage,
          permissions: []
        };
      }
    } catch (testError) {
      console.warn('⚠️ Page access token test error:', testError);
      // Fall back to getting pages with user token
      const pagesResult = await getFacebookPages(accessToken);
      if (!pagesResult.success) {
        console.error('❌ Failed to get Facebook pages:', pagesResult.error);
        return {
          success: false,
          error: pagesResult.error
        };
      }

      const targetPage = pagesResult.pages.find(page => page.id === pageId);
      if (!targetPage) {
        return {
          success: false,
          error: `Page ID ${pageId} not found in your accessible pages.`
        };
      }

      return {
        success: true,
        pageInfo: targetPage,
        permissions: []
      };
    }

  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      error: networkError.message || 'Failed to validate Facebook credentials'
    };
  }
}

// Publish content to Facebook with enhanced error handling
export async function publishToFacebook(
  content: string,
  imageUrl: string,
  pageId: string,
  accessToken: string,
  mediaFiles?: File[]
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log('📤 Publishing to Facebook:', { 
      content: content.substring(0, 100) + '...', 
      imageUrl: !!imageUrl, 
      pageId, 
      hasAccessToken: !!accessToken,
      mediaFilesCount: mediaFiles?.length || 0
    });
    
    console.log('⚠️ IMPORTANT: If publishing fails with permission errors, your Facebook app may need App Review for the "pages_manage_posts" permission. This is required by Facebook for production apps.');
    console.log('📝 NOTE: Facebook Page posting requires a PAGE ACCESS TOKEN, not a user access token. The OAuth flow should save the page access token from /me/accounts endpoint.');

    // First validate credentials
    const validation = await validateFacebookCredentials(accessToken, pageId);
    if (!validation.success) {
      console.error('❌ Facebook credential validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    console.log('✅ Facebook credentials validated successfully');

    // Use the page's access token if available
    const pageAccessToken = validation.pageInfo?.access_token || accessToken;
    console.log('🔑 Using access token for publishing:', pageAccessToken ? 'Page token available' : 'Using user token');
    console.log('🔑 Page access token details:', {
      hasPageToken: !!validation.pageInfo?.access_token,
      pageTokenLength: validation.pageInfo?.access_token?.length || 0,
      pageTokenStart: validation.pageInfo?.access_token?.substring(0, 20) || 'N/A',
      pageName: validation.pageInfo?.name || 'N/A',
      pageId: validation.pageInfo?.id || 'N/A'
    });

    // If media files are provided, upload them first (prioritize uploaded files over generated images)
    if (mediaFiles && mediaFiles.length > 0) {
      console.log('📁 Processing uploaded media files:', {
        count: mediaFiles.length,
        firstFile: {
          name: mediaFiles[0].name,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        }
      });
      
      // For now, we'll use the first media file
      const mediaFile = mediaFiles[0];
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('source', mediaFile);
      formData.append('caption', content);
      formData.append('access_token', pageAccessToken);
      
      console.log('📤 Uploading media file to Facebook:', {
        fileName: mediaFile.name,
        fileType: mediaFile.type,
        fileSize: mediaFile.size,
        pageId: pageId
      });

      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('📥 Facebook API response:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });

      if (!response.ok) {
        console.error('❌ Failed to publish media to Facebook:', result.error);
        const errorMessage = result.error?.message || 'Failed to publish media to Facebook';
        const errorCode = result.error?.code || 'Unknown';
        const errorType = result.error?.type || 'Unknown';
        
        console.error('❌ Detailed Facebook error:', {
          message: errorMessage,
          code: errorCode,
          type: errorType,
          fullError: result.error
        });
        
        if (errorMessage.includes('permission') || errorMessage.includes('access') || errorCode === 200) {
          return {
            success: false,
            error: `Permission denied (${errorCode}): ${errorMessage}. Please check that you have 'pages_manage_posts' permission and try re-authorizing your Facebook account.`
          };
        }
        return {
          success: false,
          error: `Facebook API Error (${errorCode}): ${errorMessage}`
        };
      }

      console.log('✅ Facebook post published successfully with media:', result.id);
      return {
        success: true,
        postId: result.id
      };
    } else if (imageUrl) {
      console.log('📷 Publishing with generated image URL:', imageUrl);
      // Publish the post with image URL
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: imageUrl,
          caption: content,
          access_token: pageAccessToken
        })
      });

      const result = await response.json();
      console.log('📥 Facebook API response (image URL):', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });

      if (!response.ok) {
        console.error('❌ Failed to publish image to Facebook:', result.error);
        const errorMessage = result.error?.message || 'Failed to publish to Facebook';
        const errorCode = result.error?.code || 'Unknown';
        const errorType = result.error?.type || 'Unknown';
        
        console.error('❌ Detailed Facebook error (image URL):', {
          message: errorMessage,
          code: errorCode,
          type: errorType,
          fullError: result.error
        });
        
        if (errorMessage.includes('permission') || errorMessage.includes('access') || errorCode === 200) {
          return {
            success: false,
            error: `Permission denied (${errorCode}): ${errorMessage}. Please check that you have 'pages_manage_posts' permission and try re-authorizing your Facebook account.`
          };
        }
        return {
          success: false,
          error: `Facebook API Error (${errorCode}): ${errorMessage}`
        };
      }

      console.log('✅ Facebook post published successfully with image:', result.id);
      return {
        success: true,
        postId: result.id
      };
    } else {
      console.log('📝 Publishing text-only post (no media files or image URL)');
      // Publish text-only post
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          access_token: pageAccessToken
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to publish text to Facebook:', result.error);
        const errorMessage = result.error?.message || 'Failed to publish to Facebook';
        if (errorMessage.includes('permission') || errorMessage.includes('access')) {
          return {
            success: false,
            error: `Permission denied: ${errorMessage}. Please check that you have 'pages_manage_posts' permission and try re-authorizing your Facebook account.`
          };
        }
        return {
          success: false,
          error: errorMessage
        };
      }

      console.log('✅ Facebook text post published successfully:', result.id);
      return {
        success: true,
        postId: result.id
      };
    }

  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      error: networkError.message || 'Network error while publishing to Facebook'
    };
  }
}