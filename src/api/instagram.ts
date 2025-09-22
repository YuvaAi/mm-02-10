// Instagram Graph API Integration
import { processFileForInstagram, validateInstagramFile } from '../utils/imageUtils';

export interface InstagramPermissionCheck {
  success: boolean;
  permissions?: string[];
  missingPermissions?: string[];
  error?: string;
}

export interface InstagramPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

interface FacebookPermission {
  permission: string;
  status: string;
}

// Check Instagram permissions
export async function checkInstagramPermissions(
  accessToken: string
): Promise<InstagramPermissionCheck> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to check permissions'
      };
    }

    const grantedPermissions = data.data
      .filter((perm: FacebookPermission) => perm.status === 'granted')
      .map((perm: FacebookPermission) => perm.permission);

    const requiredPermissions = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list'
    ];

    const missingPermissions = requiredPermissions.filter(
      perm => !grantedPermissions.includes(perm)
    );

    return {
      success: missingPermissions.length === 0,
      permissions: grantedPermissions,
      missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    return {
      success: false,
      error: networkError.message || 'Network error while checking permissions'
    };
  }
}

// Publish content to Instagram using Graph API
export async function publishToInstagram(
  content: string,
  imageUrl: string,
  instagramUserId: string,
  accessToken: string,
  mediaFiles?: File[],
  userId?: string
): Promise<InstagramPostResult> {
  try {
    console.log('📸 Starting Instagram posting process...');
    console.log('Instagram User ID:', instagramUserId);
    console.log('Image URL:', imageUrl);
    console.log('Media Files:', mediaFiles?.length || 0);

    // Validate that we have either an image URL or media files
    if (!imageUrl && (!mediaFiles || mediaFiles.length === 0)) {
      console.error('❌ No image URL or media files provided for Instagram post');
      return {
        success: false,
        error: 'Instagram requires an image or video. Please provide an image URL or upload a media file. Text-only posts are not supported on Instagram.'
      };
    }

    // Step 1: Create media container
    console.log('📤 Creating Instagram media container...');
    
    let mediaResponse;
    let mediaUrl = imageUrl;
    
    // If media files are provided, process them for Instagram
    if (mediaFiles && mediaFiles.length > 0) {
      const mediaFile = mediaFiles[0];
      console.log('📁 Processing media file for Instagram:', {
        name: mediaFile.name,
        type: mediaFile.type,
        size: mediaFile.size
      });
      
      // Validate file for Instagram requirements
      const validation = validateInstagramFile(mediaFile);
      if (!validation.valid) {
        console.error('❌ Invalid file for Instagram:', validation.error);
        return {
          success: false,
          error: validation.error || 'Invalid file for Instagram'
        };
      }
      
      // Process file for Instagram: convert to JPG and upload to Firebase Storage
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required for processing media files for Instagram'
        };
      }
      
      try {
        mediaUrl = await processFileForInstagram(mediaFile, userId);
        console.log('✅ Media file processed for Instagram:', mediaUrl);
      } catch (error) {
        console.error('❌ Failed to process media file for Instagram:', error);
        return {
          success: false,
          error: `Failed to process media file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    // Validate the media URL
    if (!mediaUrl || mediaUrl.trim() === '') {
      console.error('❌ No valid media URL for Instagram post');
      return {
        success: false,
        error: 'No valid image URL provided for Instagram post.'
      };
    }

    console.log('📤 Creating Instagram media with URL:', mediaUrl);
    
    mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramUserId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: content,
        access_token: accessToken
      })
    });

    const mediaResult = await mediaResponse.json();
    console.log('📥 Instagram media creation response:', mediaResult);

    if (!mediaResponse.ok) {
      console.error('❌ Instagram media creation failed:', mediaResult);
      const errorMessage = mediaResult.error?.message || 'Failed to create Instagram media container';
      
      // Provide more specific error messages
      if (errorMessage.includes('media type')) {
        return {
          success: false,
          error: 'Invalid media type. Instagram only accepts images (JPG, PNG) and videos (MP4). Please check your image URL or file format.'
        };
      } else if (errorMessage.includes('image_url')) {
        return {
          success: false,
          error: 'Invalid image URL. Please ensure the image URL is accessible and points to a valid image file.'
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    const creationId = mediaResult.id;
    console.log('✅ Instagram media container created:', creationId);

    // Step 2: Publish the media
    console.log('📤 Publishing Instagram media...');
    const publishResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramUserId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });

    const publishResult = await publishResponse.json();
    console.log('📥 Instagram publish response:', publishResult);

    if (!publishResponse.ok) {
      console.error('❌ Instagram publishing failed:', publishResult);
      return {
        success: false,
        error: publishResult.error?.message || 'Failed to publish Instagram media'
      };
    }

    const instagramPostId = publishResult.id;
    console.log('✅ Instagram post published successfully:', instagramPostId);

    return {
      success: true,
      postId: instagramPostId
    };

  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('🔥 Error in Instagram posting:', networkError);
    return {
      success: false,
      error: networkError.message || 'Network error while posting to Instagram'
    };
  }
}

// Validate Instagram credentials
export async function validateInstagramCredentials(
  accessToken: string,
  instagramUserId: string
): Promise<{ success: boolean; username?: string; error?: string; missingPermissions?: string[] }> {
  try {
    console.log('🔍 Validating Instagram credentials for user:', instagramUserId);
    
    // Try to check permissions, but don't fail if it doesn't work
    let permissionCheck = { success: false, permissions: [], missingPermissions: undefined, error: '' };
    try {
      permissionCheck = await checkInstagramPermissions(accessToken);
      if (permissionCheck.success) {
        console.log('📋 Instagram permissions check successful');
      } else {
        console.warn('⚠️ Instagram permission check failed, but continuing with account validation:', permissionCheck.error);
      }
    } catch (permError) {
      console.warn('⚠️ Instagram permission check failed with exception, but continuing with account validation:', permError);
    }

    // Validate Instagram account access (this is the critical check)
    console.log('🔍 Validating Instagram account access...');
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${instagramUserId}?fields=id,username&access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Instagram account validation failed:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to validate Instagram credentials'
      };
    }

    console.log('✅ Instagram account validation successful:', data.username);
    
    // If we have permission data, check for missing permissions
    if (permissionCheck.missingPermissions && permissionCheck.missingPermissions.length > 0) {
      console.warn('⚠️ Missing some Instagram permissions:', permissionCheck.missingPermissions);
      console.warn('⚠️ This may cause publishing to fail, but attempting anyway...');
    }

    return {
      success: true,
      username: data.username,
      missingPermissions: permissionCheck.missingPermissions
    };
  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('❌ Instagram validation error:', networkError);
    return {
      success: false,
      error: networkError.message || 'Network error while validating Instagram credentials',
      missingPermissions: undefined
    };
  }
}