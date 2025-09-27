"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFacebookAdCampaign = exports.createAdSetAndAd = exports.createNewCampaignFunction = void 0;
const admin = __importStar(require("firebase-admin"));
// Country name to ISO 2-letter country code mapping
const COUNTRY_NAME_TO_CODE = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE',
    'Greece': 'GR',
    'Cyprus': 'CY',
    'Malta': 'MT',
    'Luxembourg': 'LU',
    'Japan': 'JP',
    'South Korea': 'KR',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Venezuela': 'VE',
    'Ecuador': 'EC',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'South Africa': 'ZA',
    'Egypt': 'EG',
    'Nigeria': 'NG',
    'Kenya': 'KE',
    'Morocco': 'MA',
    'Tunisia': 'TN',
    'Algeria': 'DZ',
    'Israel': 'IL',
    'Turkey': 'TR',
    'Russia': 'RU',
    'Ukraine': 'UA',
    'Belarus': 'BY',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Taiwan': 'TW',
    'New Zealand': 'NZ',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Jordan': 'JO',
    'Lebanon': 'LB',
    'Iraq': 'IQ',
    'Iran': 'IR',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Sri Lanka': 'LK',
    'Nepal': 'NP',
    'Bhutan': 'BT',
    'Maldives': 'MV',
    'Afghanistan': 'AF',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Mongolia': 'MN',
    'North Korea': 'KP',
    'Myanmar': 'MM',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Brunei': 'BN',
    'East Timor': 'TL',
    'Papua New Guinea': 'PG',
    'Fiji': 'FJ',
    'Samoa': 'WS',
    'Tonga': 'TO',
    'Vanuatu': 'VU',
    'Solomon Islands': 'SB',
    'Palau': 'PW',
    'Marshall Islands': 'MH',
    'Micronesia': 'FM',
    'Kiribati': 'KI',
    'Tuvalu': 'TV',
    'Nauru': 'NR',
    'Cook Islands': 'CK',
    'Niue': 'NU',
    'Tokelau': 'TK',
    'American Samoa': 'AS',
    'Guam': 'GU',
    'Northern Mariana Islands': 'MP',
    'Puerto Rico': 'PR',
    'Virgin Islands': 'VI',
    'Bermuda': 'BM',
    'Cayman Islands': 'KY',
    'British Virgin Islands': 'VG',
    'Anguilla': 'AI',
    'Montserrat': 'MS',
    'Saint Kitts and Nevis': 'KN',
    'Antigua and Barbuda': 'AG',
    'Dominica': 'DM',
    'Saint Lucia': 'LC',
    'Saint Vincent and the Grenadines': 'VC',
    'Grenada': 'GD',
    'Barbados': 'BB',
    'Trinidad and Tobago': 'TT',
    'Jamaica': 'JM',
    'Haiti': 'HT',
    'Dominican Republic': 'DO',
    'Cuba': 'CU',
    'Bahamas': 'BS',
    'Belize': 'BZ',
    'Costa Rica': 'CR',
    'El Salvador': 'SV',
    'Guatemala': 'GT',
    'Honduras': 'HN',
    'Nicaragua': 'NI',
    'Panama': 'PA',
    'Guyana': 'GY',
    'Suriname': 'SR',
    'French Guiana': 'GF',
    'Greenland': 'GL',
    'Iceland': 'IS',
    'Faroe Islands': 'FO',
    'Gibraltar': 'GI',
    'Andorra': 'AD',
    'Monaco': 'MC',
    'San Marino': 'SM',
    'Vatican City': 'VA',
    'Liechtenstein': 'LI',
    'Moldova': 'MD',
    'Georgia': 'GE',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ'
};
function convertCountryNameToCode(countryName) {
    const code = COUNTRY_NAME_TO_CODE[countryName];
    if (!code) {
        console.warn(`Unknown country name: ${countryName}. Using as-is.`);
        return countryName; // Fallback to original if not found
    }
    return code;
}
function convertCountryNamesToCodes(countryNames) {
    return countryNames.map(country => convertCountryNameToCode(country));
}
// Default configuration
const DEFAULT_CONFIG = {
    daily_budget_cents: 20000, // ₹200 in paise (smallest currency unit)
    targeting: {
        countries: ['IN'], // India
        age_min: 18,
        age_max: 35,
        platforms: ['facebook']
    },
    adset_name: 'MarketMate Auto AdSet',
    ad_name: 'MarketMate Auto Ad'
};
/**
 * Create a new Facebook campaign function
 */
const createNewCampaignFunction = async (data, context) => {
    var _a;
    try {
        console.log('🚀 createNewCampaignFunction triggered');
        console.log('📦 Data received:', JSON.stringify(data, null, 2));
        // Verify user is authenticated
        if (!context.auth) {
            console.error('❌ User not authenticated');
            throw new Error('User must be authenticated to create campaigns');
        }
        const userId = context.auth.uid;
        const { campaignName, objective, budget, startDate, endDate, country, currency, status = 'ACTIVE' } = data;
        // Validate required parameters
        if (!campaignName || !objective || !budget || !startDate || !endDate || !country || !currency) {
            throw new Error('Missing required campaign parameters');
        }
        console.log('✅ Validation passed, proceeding with campaign creation');
        // Get user credentials from Firestore
        console.log('📋 Loading user credentials from Firestore...');
        const db = admin.firestore();
        // Load Facebook Ads credentials
        const adsCredDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook_ads')
            .get();
        let adsCreds = null;
        if (adsCredDoc.exists) {
            adsCreds = adsCredDoc.data();
        }
        else {
            // Fallback to Facebook credentials if ads credentials don't exist
            console.log('Facebook Ads credentials not found, trying Facebook credentials as fallback');
            const facebookCredDoc = await db
                .collection('users')
                .doc(userId)
                .collection('credentials')
                .doc('facebook')
                .get();
            if (!facebookCredDoc.exists) {
                throw new Error('Facebook credentials not found. Please log in with Facebook first.');
            }
            adsCreds = facebookCredDoc.data();
        }
        const accessToken = adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.accessToken;
        const adAccountId = (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.adAccountId) || (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.pageId); // Use pageId as fallback
        if (!accessToken || !adAccountId) {
            throw new Error('Incomplete Facebook credentials. Please log in with Facebook again.');
        }
        console.log('✅ Credentials loaded successfully');
        console.log('📊 Using ad account:', adAccountId);
        console.log('🔧 Fixed account ID formatting issue - v1.1');
        // Create campaign using Facebook Marketing API
        const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        const campaignResponse = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: campaignName,
                objective: objective,
                status: status,
                special_ad_categories: [],
                access_token: accessToken
            })
        });
        const campaignResult = await campaignResponse.json();
        console.log('📥 Campaign creation response:', JSON.stringify(campaignResult, null, 2));
        if (!campaignResponse.ok) {
            console.error('❌ Campaign creation failed:', campaignResult);
            throw new Error(`Failed to create campaign: ${((_a = campaignResult.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
        }
        const campaignId = campaignResult.id;
        console.log('✅ Campaign created successfully with ID:', campaignId);
        return {
            success: true,
            campaignId,
            adAccountId,
            campaignName,
            objective,
            status,
            currency,
            country
        };
    }
    catch (error) {
        const caughtError = error;
        console.error('🔥 Error in createNewCampaignFunction:', caughtError);
        return {
            success: false,
            error: caughtError.message || 'Failed to create Facebook campaign'
        };
    }
};
exports.createNewCampaignFunction = createNewCampaignFunction;
exports.createAdSetAndAd = (async (data, context) => {
    console.log('🚀 createAdSetAndAd function triggered');
    console.log('📦 Data received:', JSON.stringify(data, null, 2));
    try {
        // Verify user is authenticated
        if (!context.auth) {
            console.error('❌ User not authenticated');
            throw new Error('User must be authenticated to create ads');
        }
        // Validate required parameters
        if (!data.post_id) {
            console.error('❌ Missing post_id');
            throw new Error('post_id is required');
        }
        console.log('✅ Validation passed, proceeding with ad creation');
        // Load user's Facebook Ads credentials from Firestore
        console.log('📋 Loading user credentials from Firestore...');
        const userId = context.auth.uid;
        const db = admin.firestore();
        // Load Facebook Page credentials: users/{userId}/credentials/facebook
        const facebookCredDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook')
            .get();
        if (!facebookCredDoc.exists) {
            throw new Error('Facebook Page credentials not found. Please add them in Credential Vault.');
        }
        const facebookCreds = facebookCredDoc.data();
        // Load Facebook Ads credentials: users/{userId}/credentials/facebook_ads
        const adsCredDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook_ads')
            .get();
        let adsCreds = null;
        if (adsCredDoc.exists) {
            adsCreds = adsCredDoc.data();
        }
        else {
            // Fallback to Facebook credentials if ads credentials don't exist
            console.log('Facebook Ads credentials not found, using Facebook credentials as fallback');
            adsCreds = facebookCreds;
        }
        // Load Instagram credentials (optional): users/{userId}/credentials/instagram
        const instagramCredDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('instagram')
            .get();
        const instagramCreds = instagramCredDoc.exists ? instagramCredDoc.data() : null;
        console.log('✅ Credentials loaded successfully');
        // Build Facebook config from stored credentials
        const FACEBOOK_CONFIG = {
            ACCESS_TOKEN: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.accessToken) || (facebookCreds === null || facebookCreds === void 0 ? void 0 : facebookCreds.accessToken) || '',
            CAMPAIGN_ID: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.campaignId) || '',
            AD_ACCOUNT_ID: (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.adAccountId) || (facebookCreds === null || facebookCreds === void 0 ? void 0 : facebookCreds.adAccountId) || '',
            PAGE_ID: (facebookCreds === null || facebookCreds === void 0 ? void 0 : facebookCreds.pageId) || (adsCreds === null || adsCreds === void 0 ? void 0 : adsCreds.pageId) || '',
            INSTAGRAM_USER_ID: (instagramCreds === null || instagramCreds === void 0 ? void 0 : instagramCreds.instagramUserId) || undefined
        };
        // Validate that we have the required credentials
        if (!FACEBOOK_CONFIG.ACCESS_TOKEN || !FACEBOOK_CONFIG.AD_ACCOUNT_ID) {
            throw new Error('Missing required Facebook credentials. Please log in with Facebook again or add credentials manually.');
        }
        console.log('📊 Using credentials:', {
            adAccountId: FACEBOOK_CONFIG.AD_ACCOUNT_ID,
            campaignId: FACEBOOK_CONFIG.CAMPAIGN_ID,
            pageId: FACEBOOK_CONFIG.PAGE_ID,
            hasInstagram: !!FACEBOOK_CONFIG.INSTAGRAM_USER_ID
        });
        // Step 1: Post to Instagram if image_url and caption are provided
        let instagramPostId;
        // Access token from ads credentials
        const accessToken = FACEBOOK_CONFIG.ACCESS_TOKEN;
        if (data.image_url && data.caption && FACEBOOK_CONFIG.INSTAGRAM_USER_ID) {
            console.log('📸 Attempting Instagram post...');
            const instagramResult = await postToInstagram(accessToken, FACEBOOK_CONFIG.INSTAGRAM_USER_ID, data.image_url, data.caption);
            if (instagramResult.success) {
                instagramPostId = instagramResult.instagram_post_id;
                console.log('✅ Instagram post created:', instagramPostId);
            }
            else {
                console.warn('⚠️ Instagram posting failed, continuing with Facebook ad creation:', instagramResult.error);
            }
        }
        const adAccountId = FACEBOOK_CONFIG.AD_ACCOUNT_ID;
        const pageId = FACEBOOK_CONFIG.PAGE_ID;
        const campaignId = FACEBOOK_CONFIG.CAMPAIGN_ID;
        // Merge with default configuration
        const dailyBudget = data.daily_budget_cents || DEFAULT_CONFIG.daily_budget_cents;
        const targeting = Object.assign(Object.assign({}, DEFAULT_CONFIG.targeting), data.targeting);
        console.log('📊 Configuration:', {
            campaignId,
            dailyBudget,
            targeting,
            postId: data.post_id
        });
        // Step 1: Create Ad Set
        console.log('🎯 Creating Ad Set...');
        const adSetId = await createAdSet(accessToken, adAccountId, campaignId, dailyBudget, targeting);
        console.log('✅ Ad Set created:', adSetId);
        // Step 2: Create Ad using the post as creative
        console.log('🎨 Creating Ad...');
        const adId = await createAd(accessToken, adAccountId, adSetId, data.post_id, pageId);
        console.log('✅ Ad created:', adId);
        const result = {
            success: true,
            campaign_id: campaignId,
            adset_id: adSetId,
            ad_id: adId,
            instagram_post_id: instagramPostId
        };
        console.log('🎉 Ad creation completed successfully:', result);
        return result;
    }
    catch (error) {
        const caughtError = error;
        console.error('🔥 Error in createAdSetAndAd:', caughtError);
        const errorResult = {
            success: false,
            error: caughtError.message || 'Failed to create Facebook ad'
        };
        console.error('❌ Returning error result:', errorResult);
        return errorResult;
    }
});
/**
 * Create a complete Facebook ad campaign using the Meta Marketing API
 */
const createFacebookAdCampaign = async (data, context) => {
    try {
        // Verify user is authenticated
        if (!context.auth) {
            throw new Error('User must be authenticated to create ads');
        }
        const { userId, campaignData } = data;
        if (!userId || !campaignData) {
            throw new Error('Missing required parameters');
        }
        console.log('🚀 Creating Facebook ad campaign:', campaignData.campaignName);
        // Get user credentials - try facebook_ads first, then facebook as fallback
        const db = admin.firestore();
        // First try to get facebook_ads credentials
        let userCredsDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook_ads')
            .get();
        // Always try to get facebook credentials for pageId
        let facebookCredsDoc = await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook')
            .get();
        // If facebook_ads credentials not found, use facebook credentials as fallback
        if (!userCredsDoc.exists) {
            console.log('Facebook Ads credentials not found, using Facebook credentials as fallback...');
            userCredsDoc = facebookCredsDoc;
        }
        if (!userCredsDoc.exists) {
            throw new Error('Facebook credentials not found');
        }
        const credentials = userCredsDoc.data();
        const facebookCredentials = facebookCredsDoc.exists ? facebookCredsDoc.data() : null;
        const accessToken = credentials === null || credentials === void 0 ? void 0 : credentials.accessToken;
        const adAccountId = (credentials === null || credentials === void 0 ? void 0 : credentials.adAccountId) || process.env.FACEBOOK_AD_ACCOUNT_ID;
        const pageId = (credentials === null || credentials === void 0 ? void 0 : credentials.pageId) || (facebookCredentials === null || facebookCredentials === void 0 ? void 0 : facebookCredentials.pageId) || process.env.FACEBOOK_PAGE_ID;
        console.log('🔍 Facebook credentials validation:', {
            hasAccessToken: !!accessToken,
            adAccountId: adAccountId,
            pageId: pageId,
            credentialsKeys: credentials ? Object.keys(credentials) : 'No credentials'
        });
        if (!accessToken || !adAccountId || !pageId) {
            console.error('❌ Missing Facebook credentials:', {
                accessToken: !!accessToken,
                adAccountId: !!adAccountId,
                pageId: !!pageId,
                credentials: credentials
            });
            throw new Error(`Incomplete Facebook credentials: accessToken=${!!accessToken}, adAccountId=${!!adAccountId}, pageId=${!!pageId}`);
        }
        // Step 1: Create campaign
        const campaignId = await createCampaignStep(accessToken, adAccountId, campaignData);
        console.log('✅ Campaign created:', campaignId);
        // Step 2: Create ad set with budget and schedule
        const adSetId = await createAdSetStep(accessToken, adAccountId, campaignId, campaignData);
        console.log('✅ Ad Set created:', adSetId);
        // Step 3: Create ad creative
        const creativeId = await createAdCreativeStep(accessToken, adAccountId, adSetId, pageId, campaignData);
        console.log('✅ Ad Creative created:', creativeId);
        // Step 4: Create ad
        const adId = await createAdStep(accessToken, adAccountId, adSetId, creativeId, campaignData);
        console.log('✅ Ad created:', adId);
        return {
            success: true,
            campaignId,
            adSetId,
            adId
        };
    }
    catch (error) {
        const err = error;
        console.error('❌ Error creating Facebook ad campaign:', err);
        throw new Error(err.message || 'Failed to create Facebook ad campaign');
    }
};
exports.createFacebookAdCampaign = createFacebookAdCampaign;
async function postToInstagram(accessToken, igUserId, imageUrl, caption) {
    var _a, _b;
    try {
        console.log('📸 Creating Instagram media container...');
        // Step 1: Create media container
        const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken
            })
        });
        const mediaResult = await mediaResponse.json();
        console.log('📥 Instagram media creation response:', JSON.stringify(mediaResult, null, 2));
        if (!mediaResponse.ok) {
            console.error('❌ Instagram media creation failed:', mediaResult);
            return {
                success: false,
                error: `Failed to create Instagram media: ${((_a = mediaResult.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`
            };
        }
        const creationId = mediaResult.id;
        console.log('✅ Instagram media container created:', creationId);
        // Step 2: Publish the media
        console.log('📤 Publishing Instagram media...');
        const publishResponse = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
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
        console.log('📥 Instagram publish response:', JSON.stringify(publishResult, null, 2));
        if (!publishResponse.ok) {
            console.error('❌ Instagram publishing failed:', publishResult);
            return {
                success: false,
                error: `Failed to publish Instagram media: ${((_b = publishResult.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'}`
            };
        }
        const instagramPostId = publishResult.id;
        console.log('✅ Instagram post published successfully:', instagramPostId);
        return {
            success: true,
            instagram_post_id: instagramPostId
        };
    }
    catch (error) {
        const caughtError = error;
        console.error('🔥 Error in Instagram posting:', caughtError);
        return {
            success: false,
            error: caughtError.message || 'Failed to post to Instagram'
        };
    }
}
async function createAdSet(accessToken, adAccountId, campaignId, dailyBudget, targeting) {
    var _a;
    console.log('🎯 Creating Ad Set with params:', {
        adAccountId,
        campaignId,
        dailyBudget,
        targeting
    });
    // Calculate start and end times
    const startTime = new Date(Date.now() + 60000); // 1 minute from now
    const endTime = new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now
    console.log('⏰ Ad Set schedule:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
    });
    const adSetData = {
        name: `${DEFAULT_CONFIG.adset_name} ${Date.now()}`,
        campaign_id: campaignId,
        daily_budget: dailyBudget.toString(),
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'POST_ENGAGEMENT',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        status: 'ACTIVE',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        targeting: {
            geo_locations: {
                countries: convertCountryNamesToCodes(targeting.countries || [])
            },
            age_min: targeting.age_min,
            age_max: targeting.age_max,
            publisher_platforms: targeting.platforms,
            facebook_positions: ['feed', 'story'],
            device_platforms: ['mobile', 'desktop']
        },
        access_token: accessToken
    };
    console.log('📤 Sending Ad Set creation request:', JSON.stringify(adSetData, null, 2));
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const response = await fetch(`https://graph.facebook.com/v19.0/${formattedAdAccountId}/adsets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(adSetData)
    });
    const result = await response.json();
    console.log('📥 Ad Set creation response:', JSON.stringify(result, null, 2));
    if (!response.ok) {
        console.error('❌ Ad Set creation failed:', result);
        throw new Error(`Failed to create ad set: ${((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
    }
    console.log('✅ Ad Set created successfully with ID:', result.id);
    return result.id;
}
async function createAd(accessToken, adAccountId, adSetId, postId, pageId) {
    var _a;
    console.log('🎨 Creating Ad with params:', {
        adAccountId,
        adSetId,
        postId,
        pageId
    });
    // Create object_story_id from page and post
    const objectStoryId = `${pageId}_${postId}`;
    console.log('🔗 Object Story ID:', objectStoryId);
    const adData = {
        name: `${DEFAULT_CONFIG.ad_name} ${Date.now()}`,
        adset_id: adSetId,
        creative: {
            object_story_id: objectStoryId
        },
        status: 'ACTIVE',
        access_token: accessToken
    };
    console.log('📤 Sending Ad creation request:', JSON.stringify(adData, null, 2));
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const response = await fetch(`https://graph.facebook.com/v19.0/${formattedAdAccountId}/ads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(adData)
    });
    const result = await response.json();
    console.log('📥 Ad creation response:', JSON.stringify(result, null, 2));
    if (!response.ok) {
        console.error('❌ Ad creation failed:', result);
        throw new Error(`Failed to create ad: ${((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
    }
    console.log('✅ Ad created successfully with ID:', result.id);
    return result.id;
}
async function createCampaignStep(accessToken, adAccountId, campaignData) {
    var _a;
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const response = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/campaigns`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: campaignData.campaignName,
            objective: campaignData.objective,
            status: 'ACTIVE',
            special_ad_categories: [],
            access_token: accessToken
        })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to create campaign');
    }
    return result.id;
}
async function createAdSetStep(accessToken, adAccountId, campaignId, campaignData) {
    var _a;
    const budgetCents = Math.round(campaignData.budget * 100);
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const response = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/adsets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: `${campaignData.campaignName} - Ad Set`,
            campaign_id: campaignId,
            daily_budget: budgetCents,
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'REACH',
            start_time: new Date(campaignData.startDate).toISOString(),
            end_time: new Date(campaignData.endDate).toISOString(),
            status: 'ACTIVE',
            access_token: accessToken
        })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to create ad set');
    }
    return result.id;
}
async function createAdCreativeStep(accessToken, adAccountId, adSetId, pageId, campaignData) {
    var _a, _b, _c, _d, _e, _f, _g;
    console.log('🔍 createAdCreativeStep called with:', {
        accessToken: !!accessToken,
        adAccountId,
        adSetId,
        pageId,
        pageIdType: typeof pageId,
        pageIdValue: pageId,
        hasCampaignData: !!campaignData
    });
    if (!pageId) {
        console.error('❌ Page ID is missing. Available environment variables:', {
            FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID,
            REACT_APP_FACEBOOK_PAGE_ID: process.env.REACT_APP_FACEBOOK_PAGE_ID,
            VITE_REACT_APP_FACEBOOK_PAGE_ID: process.env.VITE_REACT_APP_FACEBOOK_PAGE_ID
        });
        throw new Error('Page ID is required for ad creative creation');
    }
    console.log('✅ Page ID validation passed:', pageId);
    // First, upload the image to Facebook
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const imageUploadResponse = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/adimages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: 'ad_image.jpg',
            url: campaignData.adImage,
            access_token: accessToken
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
        throw new Error(((_a = imageResult.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to upload image');
    }
    // 🔍 DEBUG: Log the extracted image hash
    console.log('🔍 imageResult.images:', imageResult.images);
    console.log('🔍 imageResult.images?.ad_image:', (_b = imageResult.images) === null || _b === void 0 ? void 0 : _b.ad_image);
    console.log('🔍 imageResult.hash:', imageResult.hash);
    // Fix: Facebook returns the hash in images[filename].hash structure
    let imageHash = ((_d = (_c = imageResult.images) === null || _c === void 0 ? void 0 : _c.ad_image) === null || _d === void 0 ? void 0 : _d.hash) || imageResult.hash;
    // If the above doesn't work, try to get hash from the first image in the images object
    if (!imageHash && imageResult.images) {
        const imageKeys = Object.keys(imageResult.images);
        console.log('🔍 Available image keys:', imageKeys);
        if (imageKeys.length > 0) {
            const firstImageKey = imageKeys[0];
            imageHash = (_e = imageResult.images[firstImageKey]) === null || _e === void 0 ? void 0 : _e.hash;
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
    // Create the ad creative
    console.log('🔍 Creating ad creative with parameters:', {
        formattedAdAccountId,
        pageId,
        imageHash,
        adText: ((_f = campaignData.adText) === null || _f === void 0 ? void 0 : _f.substring(0, 50)) + '...',
        link: process.env.WEBSITE_URL || 'https://marketmate-101.web.app'
    });
    const requestBody = {
        name: `Creative for Ad Set ${adSetId}`,
        object_story_spec: {
            page_id: pageId,
            link_data: {
                message: campaignData.adText || 'Check out our amazing product!',
                image_hash: imageHash,
                link: process.env.WEBSITE_URL || 'https://marketmate-101.web.app'
            }
        },
        access_token: accessToken
    };
    console.log('🔍 Final request body for ad creative:', JSON.stringify(requestBody, null, 2));
    console.log('🔍 page_id in request body:', requestBody.object_story_spec.page_id);
    const creativeResponse = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/adcreatives`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    const creativeResult = await creativeResponse.json();
    // 🔍 DEBUG: Log the entire creative creation response
    console.log('🔍 Facebook Ad Creative Response Status:', creativeResponse.status);
    console.log('🔍 Facebook Ad Creative Response Body:', JSON.stringify(creativeResult, null, 2));
    if (!creativeResponse.ok) {
        console.error('❌ Ad creative creation error - Status:', creativeResponse.status);
        console.error('❌ Ad creative creation error - Response:', creativeResult);
        console.error('❌ Ad creative creation error - Request body was:', JSON.stringify(requestBody, null, 2));
        throw new Error(((_g = creativeResult.error) === null || _g === void 0 ? void 0 : _g.message) || 'Failed to create ad creative');
    }
    console.log('✅ Ad Creative created successfully:', creativeResult.id);
    return creativeResult.id;
}
async function createAdStep(accessToken, adAccountId, adSetId, creativeId, campaignData) {
    var _a;
    const formattedAdAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const response = await fetch(`https://graph.facebook.com/v21.0/${formattedAdAccountId}/ads`, {
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
            access_token: accessToken
        })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to create ad');
    }
    return result.id;
}
//# sourceMappingURL=facebookAds.js.map