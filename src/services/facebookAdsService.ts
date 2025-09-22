import { getCredential } from '../firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { createFacebookAdsApiUrl } from '../utils/facebookAdsUtils';

/**
 * Utility functions for image handling
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
}

function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

interface CampaignData {
  campaignName: string;
  budget: number;
  budgetType: 'daily' | 'lifetime';
  location: {
    country: string;
    city: string;
  };
  objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES';
  startDate: string;
  endDate: string;
  adText: string;
  adImage: string;
}

interface FacebookAdsCredentials {
  accessToken: string;
  adAccountId: string;
  pageId: string;
}

interface CreateCampaignResponse {
  success: boolean;
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  adAccountId?: string;
  error?: string;
}

interface CreateNewCampaignResponse {
  success: boolean;
  campaignId?: string;
  adAccountId?: string;
  campaignName?: string;
  objective?: string;
  status?: string;
  currency?: string;
  country?: string;
  error?: string;
}

interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
}

interface GetCampaignsResponse {
  success: boolean;
  campaigns?: FacebookCampaign[];
  error?: string;
}

interface CreateAdSetRequest {
  campaignId: string;
  adSetName: string;
  dailyBudget: number;
  startDate: string;
  endDate: string;
  targeting: {
    countries: string[];
    ageMin: number;
    ageMax: number;
    interests?: string[];
    behaviors?: string[];
  };
  optimizationGoal: string;
  billingEvent: string;
  bidStrategy: string;
}

interface CreateAdSetResponse {
  success: boolean;
  adSetId?: string;
  adSetName?: string;
  dailyBudget?: number;
  targeting?: any;
  adAccountId?: string;
  error?: string;
}

/**
 * Get Facebook Ads credentials for a user
 */
async function getFacebookAdsCredentials(userId: string): Promise<FacebookAdsCredentials | null> {
  try {
    // First try to get facebook_ads credentials
    let { success, data } = await getCredential(userId, 'facebook_ads');
    
    // If not found, try to get regular facebook credentials as fallback
    if (!success || !data) {
      console.log('Facebook Ads credentials not found, trying Facebook credentials as fallback...');
      const facebookResult = await getCredential(userId, 'facebook');
      if (facebookResult.success && facebookResult.data) {
        success = facebookResult.success;
        data = facebookResult.data;
      }
    }
    
    if (!success || !data) {
      throw new Error('Facebook Ads credentials not found');
    }

    // For now, we'll use the regular Facebook access token
    // In a production app, you'd want a separate Marketing API token
    return {
      accessToken: data.accessToken,
      adAccountId: data.adAccountId || import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID || '',
      pageId: data.pageId
    };
  } catch (error) {
    console.error('Failed to get Facebook Ads credentials:', error);
    return null;
  }
}

/**
 * Fetch existing Facebook campaigns
 */
export async function getExistingCampaigns(userId: string): Promise<GetCampaignsResponse> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return {
        success: false,
        error: 'Facebook Ads credentials not found'
      };
    }

    // Fetch campaigns using Facebook Marketing API
    const response = await fetch(
      `${createFacebookAdsApiUrl(credentials.adAccountId, 'campaigns')}?fields=id,name,status,objective,created_time,updated_time&access_token=${credentials.accessToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to fetch campaigns'
      };
    }

    return {
      success: true,
      campaigns: data.data || []
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching campaigns:', err);
    return {
      success: false,
      error: err.message || 'Failed to fetch campaigns'
    };
  }
}

/**
 * Create a new Facebook campaign and return Ad Account ID and Campaign ID
 */
export async function createNewCampaign(
  _userId: string,
  campaignData: {
    campaignName: string;
    objective: string;
    budget: number;
    budgetType: 'daily' | 'lifetime';
    startDate: string;
    endDate: string;
    country: string;
    currency: string;
    status?: 'PAUSED' | 'ACTIVE';
  }
): Promise<CreateNewCampaignResponse> {
  try {
    // Debug: Log the campaign data being sent to Firebase function
    console.log('🔍 DEBUG: Service layer - Campaign data being sent:', campaignData);
    console.log('🔍 DEBUG: Service layer - Status value:', campaignData.status);
    
    const functions = getFunctions();
    const createNewCampaignFunction = httpsCallable(functions, 'createNewCampaignFunction');
    
    const result = await createNewCampaignFunction(campaignData);
    const data = result.data as CreateNewCampaignResponse;
    
    if (data.success) {
      console.log('✅ Campaign created successfully:', data);
      return data;
    } else {
      throw new Error(data.error || 'Failed to create campaign');
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating new campaign:', err);
    
    // Handle Firebase callable function errors
    if (err.message.includes('INTERNAL')) {
      return { success: false, error: 'Internal server error. Please try again.' };
    } else if (err.message.includes('UNAUTHENTICATED')) {
      return { success: false, error: 'Authentication failed. Please log in again.' };
    } else if (err.message.includes('PERMISSION_DENIED')) {
      return { success: false, error: 'Permission denied. Please check your credentials.' };
    } else if (err.message.includes('NOT_FOUND')) {
      return { success: false, error: 'Service not found. Please contact support.' };
    }
    
    return { success: false, error: err.message };
  }
}

/**
 * Create a new Facebook Ad Set and return Ad Account ID and Ad Set ID
 */
export async function createNewAdSet(
  userId: string,
  campaignId: string,
  adSetData: CreateAdSetRequest
): Promise<CreateAdSetResponse> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    // Use direct API call instead of Firebase Cloud Function to avoid double prefix issue
    const budgetCents = Math.round(adSetData.dailyBudget * 100);

    // Prepare targeting object with proper Facebook API format
    const targeting: any = {
      geo_locations: {
        countries: adSetData.targeting.countries.map(country => country.toUpperCase())
      },
      age_min: adSetData.targeting.ageMin,
      age_max: adSetData.targeting.ageMax,
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed'],
      instagram_positions: ['feed']
    };

    // Add interests if provided (only if they exist and are valid)
    if (adSetData.targeting.interests && adSetData.targeting.interests.length > 0) {
      targeting.interests = adSetData.targeting.interests.map(interest => ({ id: interest }));
    }

    // Add behaviors if provided (only if they exist and are valid)
    if (adSetData.targeting.behaviors && adSetData.targeting.behaviors.length > 0) {
      targeting.behaviors = adSetData.targeting.behaviors.map(behavior => ({ id: behavior }));
    }

    // Validate optimization goal and billing event compatibility
    const validOptimizationGoals = ['LINK_CLICKS', 'REACH', 'IMPRESSIONS', 'VIDEO_VIEWS', 'APP_INSTALLS', 'CONVERSIONS', 'LANDING_PAGE_VIEWS'];
    const validBillingEvents = ['IMPRESSIONS', 'LINK_CLICKS', 'VIDEO_VIEWS'];
    
    if (!validOptimizationGoals.includes(adSetData.optimizationGoal)) {
      throw new Error(`Invalid optimization goal: ${adSetData.optimizationGoal}. Must be one of: ${validOptimizationGoals.join(', ')}`);
    }
    
    if (!validBillingEvents.includes(adSetData.billingEvent)) {
      throw new Error(`Invalid billing event: ${adSetData.billingEvent}. Must be one of: ${validBillingEvents.join(', ')}`);
    }

    // Validate and format dates
    const startDate = new Date(adSetData.startDate);
    const endDate = new Date(adSetData.endDate);
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid start or end date');
    }

    // Ensure end date is after start date
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate campaign ID format
    if (!campaignId || campaignId.trim() === '') {
      throw new Error('Campaign ID is required');
    }

    // Ensure campaign ID is properly formatted (should be numeric)
    const cleanCampaignId = campaignId.replace(/[^0-9]/g, '');
    if (!cleanCampaignId || cleanCampaignId.length < 10) {
      throw new Error(`Invalid campaign ID format: ${campaignId}. Campaign ID should be numeric.`);
    }

    // Verify campaign exists and user has access to it
    try {
      const campaignCheckUrl = `https://graph.facebook.com/v21.0/${cleanCampaignId}?fields=id,name,status&access_token=${credentials.accessToken}`;
      const campaignCheckResponse = await fetch(campaignCheckUrl);
      const campaignCheckResult = await campaignCheckResponse.json();
      
      if (!campaignCheckResponse.ok) {
        console.error('🚨 Campaign verification failed:', campaignCheckResult);
        throw new Error(`Campaign verification failed: ${campaignCheckResult.error?.message || 'Campaign not found or access denied'}`);
      }
      
      console.log('✅ Campaign verified:', campaignCheckResult);
    } catch (campaignError) {
      console.error('🚨 Campaign verification error:', campaignError);
      throw new Error(`Cannot verify campaign access: ${campaignError.message}`);
    }

    // Ensure minimum budget
    if (budgetCents < 100) { // $1.00 minimum
      throw new Error('Daily budget must be at least $1.00');
    }

    // Create a simplified payload with only essential parameters
    const adSetPayload = {
      name: adSetData.adSetName,
      campaign_id: cleanCampaignId,
      daily_budget: budgetCents,
      billing_event: 'IMPRESSIONS', // Use most basic billing event
      optimization_goal: 'LINK_CLICKS', // Use most basic optimization goal
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: {
        geo_locations: {
          countries: adSetData.targeting.countries.map(country => country.toUpperCase())
        },
        age_min: adSetData.targeting.ageMin,
        age_max: adSetData.targeting.ageMax,
        publisher_platforms: ['facebook', 'instagram']
      },
      start_time: Math.floor(startDate.getTime() / 1000), // Unix timestamp
      end_time: Math.floor(endDate.getTime() / 1000), // Unix timestamp
      status: 'PAUSED',
      access_token: credentials.accessToken
    };

    const apiUrl = createFacebookAdsApiUrl(credentials.adAccountId, 'adsets');
    console.log('🔗 Creating Ad Set with URL:', apiUrl);
    console.log('🔧 Ad Account ID being used:', credentials.adAccountId);
    console.log('🔧 Campaign ID being used:', cleanCampaignId);
    console.log('🔧 Access Token (first 20 chars):', credentials.accessToken.substring(0, 20) + '...');
    console.log('📦 Ad Set data being sent:', JSON.stringify(adSetPayload, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adSetPayload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('🚨 Ad Set creation error - Full response:', JSON.stringify(result, null, 2));
      console.error('🚨 Response status:', response.status);
      console.error('🚨 Response headers:', response.headers);
      
      // Provide more specific error messages
      if (result.error) {
        console.error('🚨 Facebook API Error details:', {
          message: result.error.message,
          type: result.error.type,
          code: result.error.code,
          error_subcode: result.error.error_subcode,
          error_user_title: result.error.error_user_title,
          error_user_msg: result.error.error_user_msg,
          fbtrace_id: result.error.fbtrace_id
        });
        
        if (result.error.message) {
          throw new Error(`Facebook API Error: ${result.error.message}`);
        } else if (result.error.error_user_msg) {
          throw new Error(`Facebook API Error: ${result.error.error_user_msg}`);
        } else if (result.error.error_subcode) {
          throw new Error(`Facebook API Error (Code: ${result.error.error_subcode}): ${result.error.message || 'Invalid parameter'}`);
        }
      }
      
      throw new Error('Failed to create ad set - Invalid parameter or configuration');
    }

    console.log('✅ Ad Set created successfully:', result);
    
    return {
      success: true,
      adSetId: result.id,
      adSetName: adSetData.adSetName,
      dailyBudget: adSetData.dailyBudget,
      targeting: adSetData.targeting,
      adAccountId: credentials.adAccountId
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating new ad set:', err);
    
    return { success: false, error: err.message };
  }
}

/**
 * Get user's Facebook Ad Accounts
 */
export async function getAdAccounts(userId: string): Promise<{ success: boolean; adAccounts?: any[]; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?access_token=${credentials.accessToken}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to get ad accounts');
    }

    return { success: true, adAccounts: result.data };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error getting ad accounts:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create a Facebook campaign using the Meta Marketing API (legacy function)
 */
export async function createCampaign(
  userId: string,
  campaignName: string,
  objective: string,
  _budget: number
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    const response = await fetch(createFacebookAdsApiUrl(credentials.adAccountId, 'campaigns'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: campaignName,
        objective: objective,
        status: 'PAUSED', // Start paused for safety
        special_ad_categories: [],
        access_token: credentials.accessToken
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to create campaign');
    }

    return { success: true, campaignId: result.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating campaign:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create an ad set for a campaign
 */
export async function createAdSet(
  userId: string,
  campaignId: string,
  location: { country: string; city: string },
  startDate: string,
  endDate: string,
  budget: number
): Promise<{ success: boolean; adSetId?: string; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    const budgetCents = Math.round(budget * 100);

    const adSetData = {
      name: `Ad Set for Campaign ${campaignId}`,
      campaign_id: campaignId,
      daily_budget: budgetCents,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: {
        geo_locations: {
          countries: [location.country],
          cities: location.city ? [{ name: location.city, radius: 25, distance_unit: 'mile' }] : []
        },
        age_min: 18,
        age_max: 65,
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: ['feed', 'stories'],
        instagram_positions: ['feed', 'stories']
      },
      start_time: new Date(startDate).toISOString(),
      end_time: new Date(endDate).toISOString(),
      status: 'PAUSED',
      access_token: credentials.accessToken
    };

    console.log('🔗 Creating Ad Set with URL:', createFacebookAdsApiUrl(credentials.adAccountId, 'adsets'));
    console.log('📦 Ad Set data being sent:', JSON.stringify(adSetData, null, 2));

    const response = await fetch(createFacebookAdsApiUrl(credentials.adAccountId, 'adsets'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adSetData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to create ad set');
    }

    return { success: true, adSetId: result.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating ad set:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload image to Facebook and get image hash
 */
async function uploadImageToFacebook(
  userId: string,
  imageSource: string | File
): Promise<{ success: boolean; imageHash?: string; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    let imageData: string;
    let filename = 'ad_image.jpg';

    // Handle different image sources
    if (imageSource instanceof File) {
      // Handle uploaded file
      imageData = await fileToBase64(imageSource);
      filename = imageSource.name || 'ad_image.jpg';
    } else if (typeof imageSource === 'string') {
      if (imageSource.startsWith('blob:')) {
        // Handle blob URL (from URL.createObjectURL)
        const response = await fetch(imageSource);
        const blob = await response.blob();
        imageData = await blobToBase64(blob);
      } else if (imageSource.startsWith('data:')) {
        // Handle data URL
        imageData = imageSource.split(',')[1];
      } else if (imageSource.startsWith('http')) {
        // Handle public URL
        imageData = imageSource;
      } else {
        return { success: false, error: 'Invalid image source format' };
      }
    } else {
      return { success: false, error: 'Invalid image source type' };
    }

    // Upload image to Facebook
    const formData = new FormData();
    
    if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
      // For public URLs, use URL parameter
      formData.append('url', imageData);
    } else {
      // For base64 data or files, use file parameter
      const blob = base64ToBlob(imageData);
      formData.append('filename', filename);
      formData.append('file', blob, filename);
    }
    
    formData.append('access_token', credentials.accessToken);

    const imageUploadResponse = await fetch(
      createFacebookAdsApiUrl(credentials.adAccountId, 'adimages'),
      {
        method: 'POST',
        body: formData
      }
    );

    const imageResult = await imageUploadResponse.json();
    
    if (!imageUploadResponse.ok) {
      console.error('Image upload error:', imageResult);
      throw new Error(imageResult.error?.message || 'Failed to upload image to Facebook');
    }

    const imageHash = imageResult.images?.ad_image?.hash || imageResult.hash;
    
    if (!imageHash) {
      throw new Error('No image hash returned from Facebook');
    }

    return { success: true, imageHash };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error uploading image to Facebook:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create an ad creative
 */
export async function createAdCreative(
  userId: string,
  adSetId: string,
  adText: string,
  adImage: string | File
): Promise<{ success: boolean; creativeId?: string; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    // Upload image to Facebook first
    const imageUploadResult = await uploadImageToFacebook(userId, adImage);
    if (!imageUploadResult.success) {
      return { success: false, error: imageUploadResult.error };
    }

    const imageHash = imageUploadResult.imageHash!;

    // Create the ad creative
    const creativeResponse = await fetch(createFacebookAdsApiUrl(credentials.adAccountId, 'adcreatives'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Creative for Ad Set ${adSetId}`,
        object_story_spec: {
          page_id: credentials.pageId,
          link_data: {
            message: adText,
            image_hash: imageHash,
            link: import.meta.env.VITE_REACT_APP_WEBSITE_URL || 'https://example.com'
          }
        },
        access_token: credentials.accessToken
      })
    });

    const creativeResult = await creativeResponse.json();
    
    if (!creativeResponse.ok) {
      console.error('Creative creation error:', creativeResult);
      throw new Error(creativeResult.error?.message || 'Failed to create ad creative');
    }

    return { success: true, creativeId: creativeResult.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating ad creative:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create an ad
 */
export async function createAd(
  userId: string,
  adSetId: string,
  creativeId: string
): Promise<{ success: boolean; adId?: string; error?: string }> {
  try {
    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook credentials not found' };
    }

    const response = await fetch(createFacebookAdsApiUrl(credentials.adAccountId, 'ads'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Ad for Ad Set ${adSetId}`,
        adset_id: adSetId,
        creative: {
          creative_id: creativeId
        },
        status: 'PAUSED',
        access_token: credentials.accessToken
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to create ad');
    }

    return { success: true, adId: result.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating ad:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create an enhanced Facebook ad with advanced features
 */
export async function createEnhancedFacebookAd(
  userId: string,
  adData: {
    post_id: string;
    image_url?: string | File;
    caption?: string;
    daily_budget_cents?: number;
    targeting?: {
      countries?: string[];
      age_min?: number;
      age_max?: number;
      platforms?: string[];
    };
    campaign_id?: string;
    maxLength?: number;
    includeHashtags?: boolean;
    generateOnlyCaption?: boolean;
    imagePromptOnly?: boolean;
    uploadedMedia?: string[];
    generatedHashtags?: string;
    finalPost?: string;
  }
): Promise<{ success: boolean; campaign_id?: string; adset_id?: string; ad_id?: string; instagram_post_id?: string; error?: string }> {
  try {
    console.log('🚀 Creating enhanced Facebook ad with advanced features');
    console.log('📦 Enhanced ad data:', JSON.stringify(adData, null, 2));

    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook Ads credentials not found or invalid. Please check your credentials in the Credential Vault.' };
    }

    // Use existing campaign or create a new one
    let campaignId = adData.campaign_id;
    if (!campaignId) {
      const campaignResult = await createCampaign(
        userId,
        `Auto Campaign ${new Date().toISOString().split('T')[0]}`,
        'OUTCOME_TRAFFIC',
        (adData.daily_budget_cents || 5000) / 100 // Convert cents to dollars
      );
      
      if (!campaignResult.success) {
        return { success: false, error: campaignResult.error || 'Failed to create campaign' };
      }
      campaignId = campaignResult.campaignId!;
    }

    // Create ad set
    const adSetResult = await createAdSet(
      userId,
      campaignId,
      { 
        country: adData.targeting?.countries?.[0] || 'US',
        city: ''
      },
      new Date().toISOString(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      (adData.daily_budget_cents || 5000) / 100 // Convert cents to dollars
    );

    if (!adSetResult.success) {
      return { success: false, error: adSetResult.error || 'Failed to create ad set' };
    }

    // Create ad creative with proper image handling
    if (!adData.image_url) {
      return { success: false, error: 'No image provided for ad creation' };
    }

    const creativeResult = await createAdCreative(
      userId,
      adSetResult.adSetId!,
      adData.caption || adData.finalPost || 'Check out this amazing offer!',
      adData.image_url
    );

    if (!creativeResult.success) {
      return { success: false, error: creativeResult.error || 'Failed to create ad creative' };
    }

    // Create the ad
    const adResult = await createAd(
      userId,
      adSetResult.adSetId!,
      creativeResult.creativeId!
    );

    if (!adResult.success) {
      return { success: false, error: adResult.error || 'Failed to create ad' };
    }

    console.log('✅ Enhanced Facebook ad created successfully:', {
      campaign_id: campaignId,
      adset_id: adSetResult.adSetId,
      ad_id: adResult.adId
    });

    return {
      success: true,
      campaign_id: campaignId,
      adset_id: adSetResult.adSetId,
      ad_id: adResult.adId
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Error creating enhanced Facebook ad:', err);
    
    return { success: false, error: err.message };
  }
}

/**
 * Create a Facebook ad using the 4-step workflow: Generate Content -> Campaign -> Ad Set -> Ad Creation
 */
export async function createFacebookAdWithWorkflow(
  userId: string,
  adData: {
    campaignId: string;
    adSetId: string;
    adName: string;
    headline: string;
    description: string;
    imageUrl: string | File;
    callToAction?: string;
    landingPageUrl?: string;
  }
): Promise<{ success: boolean; adId?: string; error?: string }> {
  try {
    console.log('🚀 Creating Facebook ad with workflow');
    console.log('📦 Ad data:', JSON.stringify(adData, null, 2));

    const credentials = await getFacebookAdsCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'Facebook Ads credentials not found or invalid. Please check your credentials in the Credential Vault.' };
    }

    // Create ad creative with proper image handling
    const creativeResult = await createAdCreative(
      userId,
      adData.adSetId,
      adData.description,
      adData.imageUrl
    );

    if (!creativeResult.success) {
      return { success: false, error: creativeResult.error || 'Failed to create ad creative' };
    }

    // Create the ad
    const adResult = await createAd(
      userId,
      adData.adSetId,
      creativeResult.creativeId!
    );

    if (!adResult.success) {
      return { success: false, error: adResult.error || 'Failed to create ad' };
    }

    console.log('✅ Facebook ad created successfully:', {
      campaignId: adData.campaignId,
      adSetId: adData.adSetId,
      adId: adResult.adId
    });

    return {
      success: true,
      adId: adResult.adId
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Error creating Facebook ad with workflow:', err);
    
    return { success: false, error: err.message };
  }
}

/**
 * Complete Facebook ad campaign creation workflow
 */
export async function createCompleteFacebookAdCampaign(
  userId: string,
  campaignData: CampaignData
): Promise<CreateCampaignResponse> {
  try {
    console.log('🚀 Starting Facebook ad campaign creation:', campaignData.campaignName);
    console.log('📦 Campaign data:', JSON.stringify(campaignData, null, 2));

    // Initialize Firebase Functions
    const functions = getFunctions();
    
    // Create callable function reference
    const createFacebookAdCampaignFunction = httpsCallable(functions, 'createFacebookAdCampaignFunction');

    console.log('📞 Calling Firebase function...');

    // Call the Firebase function
    const result = await createFacebookAdCampaignFunction({
      userId,
      campaignData
    });

    console.log('✅ Firebase function response:', result.data);

    const response = result.data as any;
    
    // Callable functions return the data directly, no need to check response.success
    return {
      success: true,
      campaignId: response.campaignId,
      adSetId: response.adSetId,
      adId: response.adId
    };

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Error in complete campaign creation:', err);
    console.error('❌ Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    // Extract error message from Firebase callable function error
    let errorMessage = err.message;
    
    if (err.message.includes('INTERNAL')) {
      errorMessage = 'Internal server error. Please check your Facebook credentials and try again.';
    } else if (err.message.includes('UNAUTHENTICATED')) {
      errorMessage = 'Authentication failed. Please log in again.';
    } else if (err.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'Permission denied. Please check your Facebook credentials.';
    } else if (err.message.includes('NOT_FOUND')) {
      errorMessage = 'Function not found. Please contact support.';
    }
    
    return { success: false, error: errorMessage };
  }
}
