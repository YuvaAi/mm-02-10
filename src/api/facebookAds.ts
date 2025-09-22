import { getFunctions, httpsCallable } from 'firebase/functions';

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
    const campaignResponse = await fetch(`https://graph.facebook.com/v21.0/act_${import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: campaignData.campaignName,
        objective: campaignData.objective,
        status: 'PAUSED', // Start paused for safety
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
    const adSetResponse = await fetch(`https://graph.facebook.com/v21.0/act_${import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID}/adsets`, {
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
            countries: [campaignData.location.country],
            cities: campaignData.location.city ? [{ name: campaignData.location.city, radius: 25, distance_unit: 'mile' }] : []
          },
          age_min: 18,
          age_max: 65,
          facebook_positions: ['feed', 'stories'],
          instagram_positions: ['feed', 'stories']
        },
        start_time: new Date(campaignData.startDate).toISOString(),
        end_time: new Date(campaignData.endDate).toISOString(),
        status: 'PAUSED',
        access_token: campaignData.accessToken
      })
    });

    const adSetResult = await adSetResponse.json();
    
    if (!adSetResponse.ok) {
      throw new Error(adSetResult.error?.message || 'Failed to create ad set');
    }

    const adSetId = adSetResult.id;
    console.log('✅ Ad Set created:', adSetId);

    // Create ad creative
    const creativeResponse = await fetch(`https://graph.facebook.com/v21.0/act_${import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID}/adcreatives`, {
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
            image_hash: campaignData.adImage, // This should be an image hash from Facebook
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
    const adResponse = await fetch(`https://graph.facebook.com/v21.0/act_${import.meta.env.VITE_REACT_APP_FACEBOOK_AD_ACCOUNT_ID}/ads`, {
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
        status: 'PAUSED',
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
  return createAutomaticFacebookAd(postId, {
    dailyBudgetCents,
    targeting: {
      countries: targeting.countries,
      ageMin: targeting.ageMin,
      ageMax: targeting.ageMax,
      platforms: targeting.platforms
    },
    campaignId
  });
}