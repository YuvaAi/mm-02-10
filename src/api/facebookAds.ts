import { getFunctions, httpsCallable } from 'firebase/functions';
import { convertCountryNameToCode } from '../utils/countryMapping';

interface CreateAdRequest {
  post_id: string;
  instagram_user_id?: string;
  image_url?: string;
  caption?: string;
  daily_budget_cents?: number;
  targeting?: {
    countries?: string[];
    age_min?: number;
    age_max?: number;
    platforms?: string[];
  };
  campaign_id?: string;
}

interface FacebookAdResponse {
  success: boolean;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  instagram_post_id?: string;
  error?: string;
}

interface CreateCampaignRequest {
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
  accessToken: string;
}

interface CreateCampaignResponse {
  success: boolean;
  campaignId?: string;
  adId?: string;
  error?: string;
}

// Initialize Firebase Functions
const functions = getFunctions();

// Create callable function reference
const createFacebookAdFunction = httpsCallable<CreateAdRequest, FacebookAdResponse>(
  functions, 
  'createFacebookAd'
);

/**
 * Create a Facebook ad campaign with the Meta Marketing API
 */
export async function createFacebookAdCampaign(
  campaignData: CreateCampaignRequest
): Promise<CreateCampaignResponse> {
  try {
    console.log('🚀 Creating Facebook ad campaign:', campaignData.campaignName);
    
    // Convert budget to cents (Meta API expects amounts in cents)
    const budgetCents = Math.round(campaignData.budget * 100);
    
    // Create campaign
    const adAccountId = import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID?.startsWith('act_') 
      ? import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID 
      : `act_${import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID}`;
    const campaignResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: campaignData.campaignName,
        objective: campaignData.objective,
        status: 'ACTIVE', // Start paused for safety
        special_ad_categories: [],
        access_token: campaignData.accessToken
      })
    });

    const campaignResult = await campaignResponse.json();
    
    if (!campaignResponse.ok) {
      throw new Error(campaignResult.error?.message || 'Failed to create campaign');
    }

    const campaignId = campaignResult.id;
    console.log('✅ Campaign created:', campaignId);

    // Create ad set
    const adSetResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/adsets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${campaignData.campaignName} - Ad Set`,
        campaign_id: campaignId,
        daily_budget: budgetCents,
        billing_event: 'IMPRESSIONS',
        optimization_goal: campaignData.objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 
                          campaignData.objective === 'OUTCOME_ENGAGEMENT' ? 'POST_ENGAGEMENT' :
                          campaignData.objective === 'OUTCOME_LEADS' ? 'LEAD_GENERATION' :
                          campaignData.objective === 'OUTCOME_SALES' ? 'CONVERSIONS' : 'POST_ENGAGEMENT',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: {
          geo_locations: {
            countries: [convertCountryNameToCode(campaignData.location.country)],
            cities: campaignData.location.city ? [{ name: campaignData.location.city, radius: 25, distance_unit: 'mile' }] : []
          },
          age_min: 18,
          age_max: 65,
          facebook_positions: ['feed', 'stories'],
          instagram_positions: ['feed', 'stories']
        },
        start_time: new Date(campaignData.startDate).toISOString(),
        end_time: new Date(campaignData.endDate).toISOString(),
        status: 'ACTIVE',
        access_token: campaignData.accessToken
      })
    });

    const adSetResult = await adSetResponse.json();
    
    if (!adSetResponse.ok) {
      throw new Error(adSetResult.error?.message || 'Failed to create ad set');
    }

    const adSetId = adSetResult.id;
    console.log('✅ Ad Set created:', adSetId);

    // First, upload the image to Facebook to get the image hash
    console.log('🖼️ Uploading image to Facebook...');
    const imageUploadResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/adimages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'ad_image.jpg',
        url: campaignData.adImage,
        access_token: campaignData.accessToken
      })
    });

    const imageResult = await imageUploadResponse.json();
    
    // 🔍 DEBUG: Log the entire response from Facebook
    console.log('🔍 Facebook Image Upload Response Status:', imageUploadResponse.status);
    console.log('🔍 Facebook Image Upload Response Headers:', Object.fromEntries(imageUploadResponse.headers.entries()));
    console.log('🔍 Facebook Image Upload Full Response Body:', JSON.stringify(imageResult, null, 2));
    
    if (!imageUploadResponse.ok) {
      console.error('❌ Image upload error - Status:', imageUploadResponse.status);
      console.error('❌ Image upload error - Response:', imageResult);
      throw new Error(imageResult.error?.message || 'Failed to upload image to Facebook');
    }

    // 🔍 DEBUG: Log the extracted image hash
    console.log('🔍 imageResult.images:', imageResult.images);
    console.log('🔍 imageResult.images?.ad_image:', imageResult.images?.ad_image);
    console.log('🔍 imageResult.hash:', imageResult.hash);
    
    // Fix: Facebook returns the hash in images[filename].hash structure
    let imageHash = imageResult.images?.ad_image?.hash || imageResult.hash;
    
    // If the above doesn't work, try to get hash from the first image in the images object
    if (!imageHash && imageResult.images) {
      const imageKeys = Object.keys(imageResult.images);
      console.log('🔍 Available image keys:', imageKeys);
      if (imageKeys.length > 0) {
        const firstImageKey = imageKeys[0];
        imageHash = imageResult.images[firstImageKey]?.hash;
        console.log('🔍 Found hash in images[' + firstImageKey + '].hash:', imageHash);
      }
    }
    
    console.log('🔍 Final extracted image hash:', imageHash);
    
    if (!imageHash) {
      console.error('❌ No image hash found in Facebook response');
      console.error('❌ Response status:', imageUploadResponse.status);
      console.error('❌ Response body:', JSON.stringify(imageResult, null, 2));
      throw new Error('No image hash returned from Facebook');
    }

    console.log('✅ Image uploaded successfully, hash:', imageHash);

    // Create ad creative
    const creativeResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/adcreatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${campaignData.campaignName} - Creative`,
        object_story_spec: {
          page_id: import.meta.env.VITE_REACT_APP_FACEBOOK_PAGE_ID,
          link_data: {
            message: campaignData.adText,
            image_hash: imageHash, // Now using the actual hash from Facebook
            link: import.meta.env.VITE_REACT_APP_WEBSITE_URL || 'https://example.com'
          }
        },
        access_token: campaignData.accessToken
      })
    });

    const creativeResult = await creativeResponse.json();
    
    if (!creativeResponse.ok) {
      throw new Error(creativeResult.error?.message || 'Failed to create ad creative');
    }

    const creativeId = creativeResult.id;
    console.log('✅ Ad Creative created:', creativeId);

    // Create ad
    const adResponse = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${campaignData.campaignName} - Ad`,
        adset_id: adSetId,
        creative: {
          creative_id: creativeId
        },
        status: 'ACTIVE',
        access_token: campaignData.accessToken
      })
    });

    const adResult = await adResponse.json();
    
    if (!adResponse.ok) {
      throw new Error(adResult.error?.message || 'Failed to create ad');
    }

    const adId = adResult.id;
    console.log('✅ Ad created:', adId);

    return {
      success: true,
      campaignId,
      adId
    };

  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('Error creating Facebook ad campaign:', networkError);
    return {
      success: false,
      error: networkError.message || 'Failed to create Facebook ad campaign'
    };
  }
}

/**
 * Automatically create a Facebook ad using a published post
 */
export async function createAutomaticFacebookAd(
  postId: string,
  imageUrl?: string,
  caption?: string,
  options?: {
    dailyBudgetCents?: number;
    targeting?: {
      countries?: string[];
      ageMin?: number;
      ageMax?: number;
      platforms?: string[];
    };
  }
): Promise<FacebookAdResponse> {
  try {
    console.log('🚀 Calling createFacebookAd function with postId:', postId);
    
    const request: CreateAdRequest = {
      post_id: postId,
      image_url: imageUrl,
      caption: caption,
      daily_budget_cents: options?.dailyBudgetCents,
      targeting: options?.targeting ? {
        countries: options.targeting.countries,
        age_min: options.targeting.ageMin,
        age_max: options.targeting.ageMax,
        platforms: options.targeting.platforms
      } : undefined,
    };

    console.log('📦 Request payload:', JSON.stringify(request, null, 2));

    const result = await createFacebookAdFunction(request);
    console.log('📥 Function response:', JSON.stringify(result.data, null, 2));
    
    return result.data;
  } catch (error: unknown) {
    const networkError = error as Error;
    console.error('Error calling createFacebookAd function:', networkError);
    return {
      success: false,
      error: networkError.message || 'Failed to create Facebook ad'
    };
  }
}

/**
 * Create Facebook ad with custom targeting
 */
export async function createCustomFacebookAd(
  postId: string,
  dailyBudgetCents: number,
  targeting: {
    countries: string[];
    ageMin: number;
    ageMax: number;
    platforms: string[];
  },
  campaignId?: string
): Promise<FacebookAdResponse> {
  return createAutomaticFacebookAd(postId, undefined, undefined, {
    dailyBudgetCents,
    targeting: {
      countries: targeting.countries,
      ageMin: targeting.ageMin,
      ageMax: targeting.ageMax,
      platforms: targeting.platforms
    }
  });
}