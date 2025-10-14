import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Zap, TrendingUp, Copy, CheckCircle, AlertCircle, Send, Image as ImageIcon, DollarSign, MapPin, Calendar, Users, X, Key, Upload, Hash, FileText } from 'lucide-react';
import { generateFacebookAd } from '../api/adGenerator';
import { generateImageDescription, generateImageUrl, publishToFacebookWithImage } from '../api/gemini';
import { createCompleteFacebookAdCampaign, createNewCampaign, getExistingCampaigns, createFacebookAdWithWorkflow } from '../services/facebookAdsService';
import { useAuth } from '../Contexts/AuthContext';
import { getCredential, saveCredential, getCredentials } from '../firebase/firestore';
import MultiPlatformPublisher from './MultiPlatformPublisher';

interface AdResult {
  caption: string;
  hashtags: string[];
  keywords: string[];
  targetingTips: string[];
  imageUrl?: string;
  imageDescription?: string;
}

interface CampaignFormData {
  campaignName: string;
  budget: number;
  budgetType: 'daily' | 'lifetime';
  country: string;
  city: string;
  currency: string;
  objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_LEADS' | 'OUTCOME_SALES';
  startDate: string;
  endDate: string;
  status: 'PAUSED' | 'ACTIVE';
}

interface AdSetFormData {
  adSetName: string;
  dailyBudget: number;
  startDate: string;
  endDate: string;
  targeting: {
    countries: string[];
    ageMin: number;
    ageMax: number;
    interests: string[];
    behaviors: string[];
  };
  optimizationGoal: string;
  billingEvent: string;
  bidStrategy: string;
}

const FacebookAdGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    product: '',
    audience: '',
    offer: '',
    goal: 'Conversions'
  });

  // New state variables for enhanced features
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [maxLength, setMaxLength] = useState(200);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generateOnlyCaption, setGenerateOnlyCaption] = useState(false);
  const [imagePromptOnly, setImagePromptOnly] = useState(false);
  const [generatedHashtags, setGeneratedHashtags] = useState('');
  const [finalPost, setFinalPost] = useState('');
  const [campaignFormData, setCampaignFormData] = useState<CampaignFormData>({
    campaignName: '',
    budget: 50,
    budgetType: 'daily',
    country: '',
    city: '',
    currency: 'USD',
    objective: 'OUTCOME_TRAFFIC',
    startDate: '',
    endDate: '',
    status: 'PAUSED'
  });
  const [adResult, setAdResult] = useState<AdResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [storedPageId, setStoredPageId] = useState('');
  const [storedAccessToken, setStoredAccessToken] = useState('');
  const [publishedPostId, setPublishedPostId] = useState('');
  const [createdCampaignId, setCreatedCampaignId] = useState('');
  const [createdAdId, setCreatedAdId] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignResult, setNewCampaignResult] = useState<{
    campaignId?: string;
    adAccountId?: string;
    campaignName?: string;
    objective?: string;
    status?: string;
    currency?: string;
    country?: string;
  } | null>(null);
  const [existingCampaigns, setExistingCampaigns] = useState<any[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selectedCampaignMode, setSelectedCampaignMode] = useState<'existing' | 'new'>('new');
  const [selectedExistingCampaign, setSelectedExistingCampaign] = useState<string>('');

  // Ad Set creation state
  const [adSetFormData, setAdSetFormData] = useState<AdSetFormData>({
    adSetName: '',
    dailyBudget: 50,
    startDate: '',
    endDate: '',
    targeting: {
      countries: ['United States'], // Use full country name instead of code
      ageMin: 18,
      ageMax: 65,
      interests: [],
      behaviors: []
    },
    optimizationGoal: 'LINK_CLICKS',
    billingEvent: 'IMPRESSIONS',
    bidStrategy: 'LOWEST_COST_WITHOUT_CAP'
  });
  const [isCreatingAdSet, setIsCreatingAdSet] = useState(false);
  const [adSetResult, setAdSetResult] = useState<{
    adSetId?: string;
    adSetName?: string;
    dailyBudget?: number;
    targeting?: any;
  } | null>(null);
  const [showAdSetForm, setShowAdSetForm] = useState(false);

  // Ad creation state
  const [adFormData, setAdFormData] = useState({
    adName: '',
    headline: '',
    description: '',
    callToAction: 'LEARN_MORE',
    landingPageUrl: ''
  });
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [createdAdResult, setCreatedAdResult] = useState<{
    adId?: string;
    adName?: string;
    headline?: string;
    description?: string;
    imageUrl?: string;
  } | null>(null);
  const [showAdForm, setShowAdForm] = useState(false);

  // Credential modal state
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [adsAccessToken, setAdsAccessToken] = useState('');
  const [adsAccountId, setAdsAccountId] = useState('');
  const [adsCampaignId, setAdsCampaignId] = useState('');
  const [isSavingAdsCredentials, setIsSavingAdsCredentials] = useState(false);
  const [adsCredentialMessage, setAdsCredentialMessage] = useState('');

  const adGoals = [
    'Brand Awareness',
    'Traffic/Clicks', 
    'Conversions/Sales',
    'Lead Generation',
    'App Downloads',
    'Engagement',
    'Video Views'
  ];

  const objectives = [
    { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
    { value: 'OUTCOME_LEADS', label: 'Lead Generation' },
    { value: 'OUTCOME_SALES', label: 'Sales' }
  ];

  const optimizationGoals = [
    { value: 'LINK_CLICKS', label: 'Link Clicks' },
    { value: 'REACH', label: 'Reach' },
    { value: 'IMPRESSIONS', label: 'Impressions' },
    { value: 'VIDEO_VIEWS', label: 'Video Views' },
    { value: 'APP_INSTALLS', label: 'App Installs' },
    { value: 'CONVERSIONS', label: 'Conversions' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views' }
  ];

  const billingEvents = [
    { value: 'IMPRESSIONS', label: 'Impressions' },
    { value: 'LINK_CLICKS', label: 'Link Clicks' },
    { value: 'VIDEO_VIEWS', label: 'Video Views' }
  ];

  const bidStrategies = [
    { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Lowest Cost Without Cap' },
    { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Lowest Cost With Bid Cap' },
    { value: 'COST_CAP', label: 'Cost Cap' }
  ];

  const callToActions = [
    { value: 'LEARN_MORE', label: 'Learn More' },
    { value: 'SHOP_NOW', label: 'Shop Now' },
    { value: 'SIGN_UP', label: 'Sign Up' },
    { value: 'CONTACT_US', label: 'Contact Us' },
    { value: 'DOWNLOAD', label: 'Download' },
    { value: 'GET_QUOTE', label: 'Get Quote' },
    { value: 'APPLY_NOW', label: 'Apply Now' },
    { value: 'BOOK_NOW', label: 'Book Now' }
  ];

  // Helper functions for enhanced features
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedMedia(prev => [...prev, ...fileArray]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const generateHashtags = async (content: string) => {
    try {
      // This would call your AI service to generate relevant hashtags
      const hashtagPrompt = `Generate 5-10 relevant hashtags for this content: ${content}`;
      // For now, we'll use a simple hashtag generation
      const commonHashtags = ['#socialmedia', '#content', '#marketing', '#digital', '#business'];
      return commonHashtags.join(' ');
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return '';
    }
  };

  const truncateToWordCount = (text: string, wordCount: number) => {
    const words = text.split(' ');
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  const createFinalPost = (content: string, hashtags: string) => {
    if (imagePromptOnly) {
      return content; // Only return the content without hashtags
    }
    
    let finalContent = content;
    
    // Apply word count limit
    finalContent = truncateToWordCount(content, maxLength);
    
    // Add hashtags if enabled
    if (includeHashtags && hashtags) {
      finalContent = `${finalContent}\n\n${hashtags}`;
    }
    
    return finalContent;
  };



  const countriesWithCurrencies = [
    { country: 'United States', currency: 'USD', symbol: '$' },
    { country: 'United Kingdom', currency: 'GBP', symbol: '£' },
    { country: 'European Union', currency: 'EUR', symbol: '€' },
    { country: 'Canada', currency: 'CAD', symbol: 'C$' },
    { country: 'Australia', currency: 'AUD', symbol: 'A$' },
    { country: 'Japan', currency: 'JPY', symbol: '¥' },
    { country: 'India', currency: 'INR', symbol: '₹' },
    { country: 'Brazil', currency: 'BRL', symbol: 'R$' },
    { country: 'Mexico', currency: 'MXN', symbol: 'MX$' },
    { country: 'South Korea', currency: 'KRW', symbol: '₩' },
    { country: 'Singapore', currency: 'SGD', symbol: 'S$' },
    { country: 'Switzerland', currency: 'CHF', symbol: 'CHF' },
    { country: 'Norway', currency: 'NOK', symbol: 'kr' },
    { country: 'Sweden', currency: 'SEK', symbol: 'kr' },
    { country: 'Denmark', currency: 'DKK', symbol: 'kr' },
    { country: 'New Zealand', currency: 'NZD', symbol: 'NZ$' },
    { country: 'South Africa', currency: 'ZAR', symbol: 'R' },
    { country: 'Turkey', currency: 'TRY', symbol: '₺' },
    { country: 'Russia', currency: 'RUB', symbol: '₽' },
    { country: 'China', currency: 'CNY', symbol: '¥' },
    { country: 'Hong Kong', currency: 'HKD', symbol: 'HK$' },
    { country: 'Taiwan', currency: 'TWD', symbol: 'NT$' },
    { country: 'Thailand', currency: 'THB', symbol: '฿' },
    { country: 'Malaysia', currency: 'MYR', symbol: 'RM' },
    { country: 'Indonesia', currency: 'IDR', symbol: 'Rp' },
    { country: 'Philippines', currency: 'PHP', symbol: '₱' },
    { country: 'Vietnam', currency: 'VND', symbol: '₫' },
    { country: 'Israel', currency: 'ILS', symbol: '₪' },
    { country: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س' },
    { country: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ' },
    { country: 'Egypt', currency: 'EGP', symbol: 'E£' },
    { country: 'Nigeria', currency: 'NGN', symbol: '₦' },
    { country: 'Kenya', currency: 'KES', symbol: 'KSh' },
    { country: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
    { country: 'Morocco', currency: 'MAD', symbol: 'MAD' },
    { country: 'Tunisia', currency: 'TND', symbol: 'TND' },
    { country: 'Algeria', currency: 'DZD', symbol: 'DZD' },
    { country: 'Libya', currency: 'LYD', symbol: 'LYD' },
    { country: 'Sudan', currency: 'SDG', symbol: 'SDG' },
    { country: 'Ethiopia', currency: 'ETB', symbol: 'ETB' },
    { country: 'Tanzania', currency: 'TZS', symbol: 'TSh' },
    { country: 'Uganda', currency: 'UGX', symbol: 'USh' },
    { country: 'Rwanda', currency: 'RWF', symbol: 'RWF' },
    { country: 'Burundi', currency: 'BIF', symbol: 'BIF' },
    { country: 'Somalia', currency: 'SOS', symbol: 'SOS' },
    { country: 'Djibouti', currency: 'DJF', symbol: 'DJF' },
    { country: 'Eritrea', currency: 'ERN', symbol: 'ERN' },
    { country: 'South Sudan', currency: 'SSP', symbol: 'SSP' },
    { country: 'Central African Republic', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Cameroon', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Chad', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Gabon', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Equatorial Guinea', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Republic of the Congo', currency: 'XAF', symbol: 'FCFA' },
    { country: 'Senegal', currency: 'XOF', symbol: 'CFA' },
    { country: 'Mali', currency: 'XOF', symbol: 'CFA' },
    { country: 'Burkina Faso', currency: 'XOF', symbol: 'CFA' },
    { country: 'Niger', currency: 'XOF', symbol: 'CFA' },
    { country: 'Togo', currency: 'XOF', symbol: 'CFA' },
    { country: 'Benin', currency: 'XOF', symbol: 'CFA' },
    { country: 'Guinea-Bissau', currency: 'XOF', symbol: 'CFA' },
    { country: 'Côte d\'Ivoire', currency: 'XOF', symbol: 'CFA' },
    { country: 'Guinea', currency: 'GNF', symbol: 'GNF' },
    { country: 'Sierra Leone', currency: 'SLL', symbol: 'SLL' },
    { country: 'Liberia', currency: 'LRD', symbol: 'LRD' },
    { country: 'The Gambia', currency: 'GMD', symbol: 'GMD' },
    { country: 'Cape Verde', currency: 'CVE', symbol: 'CVE' },
    { country: 'Mauritania', currency: 'MRU', symbol: 'MRU' },
    { country: 'Mauritius', currency: 'MUR', symbol: 'MUR' },
    { country: 'Seychelles', currency: 'SCR', symbol: 'SCR' },
    { country: 'Comoros', currency: 'KMF', symbol: 'KMF' },
    { country: 'Madagascar', currency: 'MGA', symbol: 'MGA' },
    { country: 'Malawi', currency: 'MWK', symbol: 'MWK' },
    { country: 'Zambia', currency: 'ZMW', symbol: 'ZMW' },
    { country: 'Zimbabwe', currency: 'ZWL', symbol: 'ZWL' },
    { country: 'Botswana', currency: 'BWP', symbol: 'P' },
    { country: 'Namibia', currency: 'NAD', symbol: 'N$' },
    { country: 'Lesotho', currency: 'LSL', symbol: 'LSL' },
    { country: 'Eswatini', currency: 'SZL', symbol: 'SZL' },
    { country: 'Mozambique', currency: 'MZN', symbol: 'MT' },
    { country: 'Angola', currency: 'AOA', symbol: 'AOA' },
    { country: 'São Tomé and Príncipe', currency: 'STN', symbol: 'STN' }
  ];

  const loadCredentials = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const { success, data } = await getCredential(currentUser.uid, 'facebook');
      if (success && data) {
        setStoredPageId(data.pageId || '');
        setStoredAccessToken(data.accessToken || '');
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }, [currentUser]);

  const getCurrencySymbol = (currencyCode: string) => {
    const countryData = countriesWithCurrencies.find(c => c.currency === currencyCode);
    return countryData?.symbol || currencyCode;
  };

  const getCurrentCurrencySymbol = () => {
    return getCurrencySymbol(campaignFormData.currency);
  };

  React.useEffect(() => {
    loadCredentials();
  }, [currentUser, loadCredentials]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleCampaignInputChange = (field: keyof CampaignFormData, value: any) => {
    setCampaignFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdSetInputChange = (field: keyof AdSetFormData, value: any) => {
    setAdSetFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdInputChange = (field: keyof typeof adFormData, value: any) => {
    setAdFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTargetingChange = (field: keyof AdSetFormData['targeting'], value: any) => {
    setAdSetFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        [field]: value
      }
    }));
  };

  const handleOpenCredentialModal = async () => {
    if (newCampaignResult) {
      setAdsAccountId(newCampaignResult.adAccountId || '');
      setAdsCampaignId(newCampaignResult.campaignId || '');
      
      // Try to get the access token from session storage first
      const sessionToken = sessionStorage.getItem('facebook_access_token');
      if (sessionToken) {
        setAdsAccessToken(sessionToken);
      } else {
        // If not in session storage, try to get from saved credentials
        try {
          if (currentUser) {
            const result = await getCredentials(currentUser.uid);
            const credentials = result.data || [];
            const facebookCred = credentials.find(cred => cred.type === 'facebook');
            if (facebookCred) {
              setAdsAccessToken(facebookCred.accessToken || '');
            }
          }
        } catch (error) {
          console.error('Error loading Facebook credentials:', error);
        }
      }
      
      setShowCredentialModal(true);
    }
  };

  const handleSaveAdsCredentials = async () => {
    if (!currentUser) {
      setAdsCredentialMessage('❌ User not authenticated');
      return;
    }

    if (!adsAccessToken.trim() || !adsAccountId.trim()) {
      setAdsCredentialMessage('❌ Please enter Access Token and Ad Account ID');
      return;
    }

    setIsSavingAdsCredentials(true);
    setAdsCredentialMessage('');

    try {
      // Try to get pageId from regular Facebook credentials
      let pageId: string | undefined;
      try {
        const { getCredentials } = await import('../firebase/firestore');
        const credentialsResult = await getCredentials(currentUser.uid);
        if (credentialsResult.success && credentialsResult.data) {
          const facebookCred = credentialsResult.data.find(cred => cred.type === 'facebook');
          if (facebookCred && facebookCred.pageId) {
            pageId = facebookCred.pageId;
            console.log('🔍 Found pageId from Facebook credentials:', pageId);
          }
        }
      } catch (error) {
        console.log('Could not retrieve pageId from Facebook credentials:', error);
      }

      const payload = {
        type: 'facebook_ads',
        accessToken: adsAccessToken.trim(),
        adAccountId: adsAccountId.trim(),
        pageId: pageId, // Include pageId if available
        campaignId: adsCampaignId.trim() || undefined,
        createdAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
      };
      
      const result = await saveCredential(currentUser.uid, payload);
      if (result.success) {
        setAdsCredentialMessage('✅ Facebook Ads credentials saved successfully!');
        setTimeout(() => {
          setShowCredentialModal(false);
          setAdsCredentialMessage('');
        }, 2000);
      } else {
        setAdsCredentialMessage(`❌ Failed to save: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      const err = error as Error;
      setAdsCredentialMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSavingAdsCredentials(false);
    }
  };

  const handleCreateAdSet = async () => {
    if (!currentUser) {
      setError('User not authenticated.');
      return;
    }

    if (!newCampaignResult?.campaignId) {
      setError('Please create or select a campaign first.');
      return;
    }

    if (!adSetFormData.adSetName.trim()) {
      setError('Ad Set name is required.');
      return;
    }

    if (!adSetFormData.startDate || !adSetFormData.endDate) {
      setError('Start date and end date are required.');
      return;
    }

    if (!adSetFormData.dailyBudget || adSetFormData.dailyBudget <= 0) {
      setError('Daily budget must be greater than 0.');
      return;
    }

    if (!adSetFormData.targeting.countries || adSetFormData.targeting.countries.length === 0) {
      setError('At least one country must be selected.');
      return;
    }

    if (!adSetFormData.targeting.ageMin || !adSetFormData.targeting.ageMax) {
      setError('Age range is required.');
      return;
    }

    if (adSetFormData.targeting.ageMin < 13 || adSetFormData.targeting.ageMax > 65) {
      setError('Age range must be between 13 and 65.');
      return;
    }

    setIsCreatingAdSet(true);
    setError('');
    setSuccessMessage('');

    try {
      const { createNewAdSet } = await import('../services/facebookAdsService');
      
      // Prepare the ad set data with proper validation
      const adSetData = {
        campaignId: newCampaignResult.campaignId,
        adSetName: adSetFormData.adSetName.trim(),
        dailyBudget: Math.max(0.01, adSetFormData.dailyBudget), // Ensure minimum budget
        startDate: adSetFormData.startDate,
        endDate: adSetFormData.endDate,
        targeting: {
          countries: adSetFormData.targeting.countries.filter(c => c.trim() !== ''),
          ageMin: Math.max(13, Math.min(65, adSetFormData.targeting.ageMin)),
          ageMax: Math.max(13, Math.min(65, adSetFormData.targeting.ageMax)),
          interests: adSetFormData.targeting.interests || [],
          behaviors: adSetFormData.targeting.behaviors || []
        },
        optimizationGoal: adSetFormData.optimizationGoal,
        billingEvent: adSetFormData.billingEvent,
        bidStrategy: adSetFormData.bidStrategy
      };

      console.log('📦 Ad Set data being sent:', JSON.stringify(adSetData, null, 2));
      
      const result = await createNewAdSet(currentUser.uid, newCampaignResult.campaignId, adSetData);

      if (result.success) {
        setAdSetResult({
          adSetId: result.adSetId,
          adSetName: result.adSetName,
          dailyBudget: result.dailyBudget,
          targeting: result.targeting
        });
        setSuccessMessage(`Ad Set "${result.adSetName}" created successfully!`);
        setShowAdSetForm(false);
      } else {
        setError(result.error || 'Failed to create ad set');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to create ad set');
    } finally {
      setIsCreatingAdSet(false);
    }
  };

  const handleCreateAd = async () => {
    if (!currentUser) {
      setError('User not authenticated.');
      return;
    }

    if (!adSetResult?.adSetId) {
      setError('No Ad Set selected. Please create an Ad Set first.');
      return;
    }

    if (!adFormData.adName.trim()) {
      setError('Ad name is required.');
      return;
    }

    if (!adFormData.headline.trim()) {
      setError('Headline is required.');
      return;
    }

    if (!adFormData.description.trim()) {
      setError('Description is required.');
      return;
    }

    if (!adResult?.imageUrl) {
      setError('No image generated. Please generate content first to create an ad.');
      return;
    }

    setIsCreatingAd(true);
    setError('');
    setSuccessMessage('');

    try {
      // Determine the image source - prioritize uploaded media over generated images
      let imageSource = adResult.imageUrl;
      if (uploadedMedia.length > 0) {
        const firstMedia = uploadedMedia[0];
        if (firstMedia.type.startsWith('image/')) {
          imageSource = firstMedia; // Pass the File object directly
        }
      }
      
      const adData = {
        campaignId: selectedExistingCampaign || newCampaignResult?.campaignId || '',
        adSetId: adSetResult.adSetId,
        adName: adFormData.adName,
        headline: adFormData.headline,
        description: adFormData.description,
        imageUrl: imageSource, // Use uploaded file or generated image
        callToAction: adFormData.callToAction,
        landingPageUrl: adFormData.landingPageUrl
      };

      const result = await createFacebookAdWithWorkflow(currentUser.uid, adData);

      if (result.success) {
        setCreatedAdResult({
          adId: result.adId,
          adName: adFormData.adName,
          headline: adFormData.headline,
          description: adFormData.description,
          imageUrl: adResult.imageUrl // Use generated image
        });
        setSuccessMessage(`Ad created successfully! Ad ID: ${result.adId}`);
        setShowAdForm(false);
        // Reset form
        setAdFormData({
          adName: '',
          headline: '',
          description: '',
          callToAction: 'LEARN_MORE',
          landingPageUrl: ''
        });
      } else {
        setError(result.error || 'Failed to create ad');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Failed to create ad');
    } finally {
      setIsCreatingAd(false);
    }
  };

  const fetchExistingCampaigns = async () => {
    if (!currentUser) return;
    
    setIsLoadingCampaigns(true);
    try {
      const result = await getExistingCampaigns(currentUser.uid);
      if (result.success && result.campaigns) {
        setExistingCampaigns(result.campaigns);
      } else {
        console.error('Failed to fetch campaigns:', result.error);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleCampaignModeChange = (mode: 'existing' | 'new') => {
    setSelectedCampaignMode(mode);
    if (mode === 'existing') {
      fetchExistingCampaigns();
    }
  };

  const handleExistingCampaignSelect = (campaignId: string) => {
    setSelectedExistingCampaign(campaignId);
    const selectedCampaign = existingCampaigns.find(campaign => campaign.id === campaignId);
    if (selectedCampaign) {
      setCampaignFormData(prev => ({
        ...prev,
        campaignName: selectedCampaign.name
      }));
    }
  };

  const validateCampaignForm = (): boolean => {
    if (!campaignFormData.campaignName.trim()) {
      setError('Campaign name is required');
      return false;
    }
    if (campaignFormData.budget <= 0) {
      setError('Budget must be greater than 0');
      return false;
    }
    if (!campaignFormData.country.trim()) {
      setError('Country is required');
      return false;
    }
    if (!campaignFormData.currency) {
      setError('Currency is required');
      return false;
    }
    if (!campaignFormData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!campaignFormData.endDate) {
      setError('End date is required');
      return false;
    }
    if (new Date(campaignFormData.startDate) >= new Date(campaignFormData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const validateAdForm = (): boolean => {
    if (!adFormData.adName.trim()) {
      setError('Ad name is required');
      return false;
    }
    if (!adFormData.headline.trim()) {
      setError('Headline is required');
      return false;
    }
    if (!adFormData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!adFormData.imageUrl.trim()) {
      setError('Image URL is required');
      return false;
    }
    if (adFormData.description.length > 125) {
      setError('Description must be 125 characters or less');
      return false;
    }
    if (adFormData.headline.length > 40) {
      setError('Headline must be 40 characters or less');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!formData.product.trim() || !formData.audience.trim()) {
      setError('Please fill in at least the product/service and target audience fields');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccessMessage('');
    setAdResult(null);
    setPublishedPostId('');
    setCreatedCampaignId('');
    setCreatedAdId('');

    try {
      // Generate ad content
      const result = await generateFacebookAd(formData);
      
      // Generate hashtags if enabled
      if (includeHashtags && !imagePromptOnly) {
        const hashtags = await generateHashtags(result.caption);
        setGeneratedHashtags(hashtags);
      }
      
      // Create final post with enhanced features
      const finalPostContent = createFinalPost(result.caption, generatedHashtags);
      setFinalPost(finalPostContent);
      
      // Generate image description and URL (only if not image prompt only and no uploaded media)
      let imageUrl = '';
      let imageDescription = '';
      
      if (!imagePromptOnly && uploadedMedia.length === 0) {
        imageDescription = await generateImageDescription(formData.product, 'Business & Marketing');
        imageUrl = await generateImageUrl(imageDescription);
      }
      
      // If uploaded media exists, use the first image/video for preview
      if (uploadedMedia.length > 0) {
        const firstMedia = uploadedMedia[0];
        if (firstMedia.type.startsWith('image/')) {
          imageUrl = URL.createObjectURL(firstMedia);
        }
      }
      
      setAdResult({
        ...result,
        imageUrl,
        imageDescription
      });
      setSuccessMessage('Facebook ad generated successfully!');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to generate Facebook ad');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePublishAd = async () => {
    if (!adResult?.caption || !adResult?.imageUrl) {
      setError('No ad content to publish. Please generate an ad first.');
      return;
    }

    if (!storedPageId || !storedAccessToken) {
      setError('No Facebook credentials found. Please add them in the Credential Vault first.');
      return;
    }

    setIsPublishing(true);
    setError('');
    setSuccessMessage('');

    try {
      // Combine caption with hashtags for posting
      const fullCaption = `${adResult.caption}\n\n${adResult.hashtags.join(' ')}`;
      
      const result = await publishToFacebookWithImage(
        fullCaption,
        adResult.imageUrl,
        storedPageId,
        storedAccessToken
      );
      
      if (result.success) {
        setPublishedPostId(result.postId || '');
        setSuccessMessage(`Ad published successfully to Facebook! Post ID: ${result.postId}`);
      } else {
        setError(result.error || 'Failed to publish ad to Facebook');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to publish ad');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateNewCampaign = async () => {
    if (!currentUser) {
      setError('User not authenticated.');
      return;
    }

    if (selectedCampaignMode === 'existing') {
      if (!selectedExistingCampaign) {
        setError('Please select an existing campaign.');
        return;
      }
      
      // For existing campaigns, we'll use the selected campaign ID
      const selectedCampaign = existingCampaigns.find(campaign => campaign.id === selectedExistingCampaign);
      if (selectedCampaign) {
        setNewCampaignResult({
          campaignId: selectedCampaign.id,
          adAccountId: '', // We'll need to get this from the campaign data
          campaignName: selectedCampaign.name,
          objective: selectedCampaign.objective,
          status: selectedCampaign.status,
          currency: campaignFormData.currency,
          country: campaignFormData.country
        });
        setSuccessMessage(`Using existing campaign "${selectedCampaign.name}"`);
        setIsCreatingCampaign(false);
        return;
      }
    } else {
      // Create new campaign
      if (!campaignFormData.campaignName.trim()) {
        setError('Campaign name is required.');
        return;
      }

      if (!campaignFormData.objective) {
        setError('Campaign objective is required.');
        return;
      }

      if (!campaignFormData.country.trim()) {
        setError('Country is required.');
        return;
      }

      if (!campaignFormData.currency) {
        setError('Currency is required.');
        return;
      }
    }

    setIsCreatingCampaign(true);
    setError('');
    setSuccessMessage('');
    setNewCampaignResult(null);

    try {
      if (selectedCampaignMode === 'new') {
        // Debug: Log the status being sent
        console.log('🔍 DEBUG: Campaign status being sent:', campaignFormData.status);
        console.log('🔍 DEBUG: Full campaign form data:', campaignFormData);
        
        const result = await createNewCampaign(currentUser.uid, {
          campaignName: campaignFormData.campaignName,
          objective: campaignFormData.objective,
          budget: campaignFormData.budget,
          budgetType: campaignFormData.budgetType,
          startDate: campaignFormData.startDate,
          endDate: campaignFormData.endDate,
          country: campaignFormData.country,
          currency: campaignFormData.currency,
          status: campaignFormData.status
        });

        if (result.success) {
          setNewCampaignResult({
            campaignId: result.campaignId,
            adAccountId: result.adAccountId,
            campaignName: result.campaignName,
            objective: result.objective,
            status: result.status,
            currency: result.currency,
            country: result.country
          });
          const statusText = result.status === 'ACTIVE' ? 'created and activated' : 'created (paused for review)';
          setSuccessMessage(`Campaign "${result.campaignName}" ${statusText}!`);
        } else {
          setError(result.error || 'Failed to create campaign');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to create campaign');
    } finally {
      setIsCreatingCampaign(false);
    }
  };





        










  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-bg-alt dark:bg-gray-800 shadow-sm border-b border-border-turquoise dark:border-gray-700 shadow-turquoise sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-text-secondary dark:text-gray-300 hover:text-text dark:hover:text-gray-100 transition-all duration-250 mr-6 hover:bg-bg-secondary dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center mr-3 shadow-turquoise hover:shadow-turquoise-strong transition-all duration-250 hover:scale-110">
                <Target className="w-5 h-5 text-primary-contrast" />
              </div>
              <h1 className="text-xl font-bold text-text dark:text-gray-100 text-glow">Facebook Ad Generator</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-in-top">
          <h2 className="text-3xl font-bold text-text dark:text-gray-100 mb-2 text-glow">Create High-Converting Facebook Ads</h2>
          <p className="text-text-secondary dark:text-gray-300">Generate optimized ad copy, hashtags, and create Facebook ad campaigns with targeting.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border bg-bg-alt dark:bg-gray-800 border-error dark:border-red-500 shadow-error">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <p className="text-sm font-medium text-error">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg border bg-bg-alt dark:bg-gray-800 border-success dark:border-green-500 shadow-success">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <p className="text-sm font-medium text-success">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Content Generation Form */}
            <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-md shadow-turquoise border border-border-turquoise dark:border-gray-600 p-6 hover:shadow-turquoise-strong transition-all duration-250 animate-slide-in-left">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center shadow-turquoise hover:shadow-turquoise-strong transition-all duration-250 hover:scale-110">
                  <Zap className="w-5 h-5 text-primary-contrast" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text dark:text-gray-100 text-glow">Content Generation</h3>
                  <p className="text-text-secondary dark:text-gray-300 text-sm">Generate ad creative</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                    Product/Service *
                  </label>
                  <textarea
                    id="product"
                    value={formData.product}
                    onChange={(e) => handleInputChange('product', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Describe your product or service"
                  />
                </div>

                <div>
                  <label htmlFor="audience" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                    Target Audience *
                  </label>
                  <textarea
                    id="audience"
                    value={formData.audience}
                    onChange={(e) => handleInputChange('audience', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Describe your target audience"
                  />
                </div>

                <div>
                  <label htmlFor="offer" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                    Special Offer/CTA
                  </label>
                  <input
                    id="offer"
                    type="text"
                    value={formData.offer}
                    onChange={(e) => handleInputChange('offer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., '20% off first order'"
                  />
                </div>

                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                    Campaign Goal
                  </label>
                  <select
                    id="goal"
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {adGoals.map((goal) => (
                      <option key={goal} value={goal}>{goal}</option>
                    ))}
                  </select>
                </div>

                {/* Enhanced Features Section */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-text dark:text-gray-300">Advanced Options</h4>
                  
                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      Upload Media (Images/Videos)
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 flex items-center space-x-2 transition-colors">
                        <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Choose Files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {uploadedMedia.length} file(s) selected
                      </span>
                    </div>
                    {uploadedMedia.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {uploadedMedia.map((file, index) => (
                          <div key={index} className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center space-x-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeMedia(index)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Max Length */}
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      Max Content Length (Words)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={maxLength}
                        onChange={(e) => setMaxLength(Number(e.target.value))}
                        className="flex-1"
                        aria-label="Content length slider"
                        title="Adjust maximum content length"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">{maxLength} words</span>
                    </div>
                  </div>

                  {/* Toggle Buttons */}
                  <div className="flex flex-wrap gap-4">
                    {/* Include Hashtags Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHashtags}
                        onChange={(e) => setIncludeHashtags(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-text dark:text-gray-300">Include Hashtags</span>
                    </label>

                    {/* Image Prompt Only Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imagePromptOnly}
                        onChange={(e) => setImagePromptOnly(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-text dark:text-gray-300">Image Prompt Only</span>
                    </label>

                    {/* Generate Only Caption Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateOnlyCaption}
                        onChange={(e) => setGenerateOnlyCaption(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-text dark:text-gray-300">Generate Only Caption</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Generate Ad Creative</span>
                    </>
                  )}
                </button>
              </div>
            </div>

                         {/* Campaign Form */}
             {adResult && (
               <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                 <div className="flex items-center space-x-3 mb-6">
                   <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                     <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-text dark:text-gray-100">Facebook Ad Campaign</h3>
                     <p className="text-text-secondary dark:text-gray-300 text-sm">Create a paid advertising campaign</p>
                   </div>
                 </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      Campaign Selection *
                    </label>
                    
                    {/* Campaign Mode Selection */}
                    <div className="flex space-x-4 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={selectedCampaignMode === 'new'}
                          onChange={() => handleCampaignModeChange('new')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-text dark:text-gray-300">Create New Campaign</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={selectedCampaignMode === 'existing'}
                          onChange={() => handleCampaignModeChange('existing')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-text dark:text-gray-300">Select Existing Campaign</span>
                      </label>
                    </div>

                    {/* Campaign Name Input/Selection */}
                    {selectedCampaignMode === 'new' ? (
                      <div>
                        <label htmlFor="campaignName" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                          New Campaign Name *
                        </label>
                        <input
                          id="campaignName"
                          type="text"
                          value={campaignFormData.campaignName}
                          onChange={(e) => handleCampaignInputChange('campaignName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="My Facebook Ad Campaign"
                        />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="existingCampaign" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                          Select Existing Campaign *
                        </label>
                        {isLoadingCampaigns ? (
                          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">Loading campaigns...</span>
                          </div>
                        ) : existingCampaigns.length > 0 ? (
                          <select
                            id="existingCampaign"
                            value={selectedExistingCampaign}
                            onChange={(e) => handleExistingCampaignSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">Select a campaign</option>
                            {existingCampaigns.map((campaign) => (
                              <option key={campaign.id} value={campaign.id}>
                                {campaign.name} ({campaign.status})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">No campaigns found. Please create a new campaign.</span>
                          </div>
                        )}
                        
                        {/* Display selected campaign info */}
                        {selectedExistingCampaign && (
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Selected Campaign:</strong> {campaignFormData.campaignName}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                              Campaign ID: {selectedExistingCampaign}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                        Budget *
                      </label>
                      <input
                        id="budget"
                        type="number"
                        min="1"
                        value={campaignFormData.budget}
                        onChange={(e) => handleCampaignInputChange('budget', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label htmlFor="budgetType" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                        Budget Type
                      </label>
                      <select
                        id="budgetType"
                        value={campaignFormData.budgetType}
                        onChange={(e) => handleCampaignInputChange('budgetType', e.target.value as 'daily' | 'lifetime')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="daily">Daily</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                        Country *
                      </label>
                      <input
                        id="country"
                        type="text"
                        value={campaignFormData.country}
                        onChange={(e) => handleCampaignInputChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="United States"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={campaignFormData.city}
                        onChange={(e) => handleCampaignInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="New York"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="objective" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      Objective *
                    </label>
                    <select
                      id="objective"
                      value={campaignFormData.objective}
                      onChange={(e) => handleCampaignInputChange('objective', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {objectives.map((obj) => (
                        <option key={obj.value} value={obj.value}>{obj.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date *
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        value={campaignFormData.startDate}
                        onChange={(e) => handleCampaignInputChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date *
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        value={campaignFormData.endDate}
                        onChange={(e) => handleCampaignInputChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateAd}
                    disabled={isCreatingAd}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCreatingAd ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Ad...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Create Ad Campaign</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* New Campaign Creation Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create New Campaign</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Create a new Facebook campaign and get Ad Account ID & Campaign ID</p>
                </div>
              </div>

                             <div className="space-y-4">
                 <div>
                   <label htmlFor="newCampaignName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Campaign Name *
                   </label>
                   <input
                     id="newCampaignName"
                     type="text"
                     value={campaignFormData.campaignName}
                     onChange={(e) => handleCampaignInputChange('campaignName', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                     placeholder="My New Facebook Campaign"
                   />
                 </div>

                 <div>
                   <label htmlFor="newObjective" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Campaign Objective *
                   </label>
                   <select
                     id="newObjective"
                     value={campaignFormData.objective}
                     onChange={(e) => handleCampaignInputChange('objective', e.target.value as any)}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                   >
                     {objectives.map((obj) => (
                       <option key={obj.value} value={obj.value}>{obj.label}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label htmlFor="newCountry" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                     Country *
                   </label>
                   <select
                     id="newCountry"
                     value={campaignFormData.country}
                     onChange={(e) => {
                       const selectedCountry = e.target.value;
                       const countryData = countriesWithCurrencies.find(c => c.country === selectedCountry);
                       handleCampaignInputChange('country', selectedCountry);
                       if (countryData) {
                         handleCampaignInputChange('currency', countryData.currency);
                       }
                     }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                   >
                     <option value="">Select a country</option>
                     {countriesWithCurrencies.map((country) => (
                       <option key={`${country.country}-${country.currency}`} value={country.country}>
                         {country.country} ({country.currency})
                       </option>
                     ))}
                   </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label htmlFor="newBudget" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                       Budget ({campaignFormData.currency})
                     </label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                         {getCurrentCurrencySymbol()}
                       </span>
                       <input
                         id="newBudget"
                         type="number"
                         value={campaignFormData.budget || ''}
                         onChange={(e) => {
                           const value = e.target.value === '' ? 0 : Number(e.target.value);
                           handleCampaignInputChange('budget', isNaN(value) ? 0 : value);
                         }}
                         className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                         placeholder="50"
                         min="1"
                       />
                     </div>
                   </div>
                   <div>
                     <label htmlFor="newBudgetType" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                       Budget Type
                     </label>
                     <select
                       id="newBudgetType"
                       value={campaignFormData.budgetType}
                       onChange={(e) => handleCampaignInputChange('budgetType', e.target.value as any)}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                     >
                       <option value="daily">Daily</option>
                       <option value="lifetime">Lifetime</option>
                     </select>
                   </div>
                 </div>

                 {/* Campaign Status Toggle */}
                 <div>
                   <label className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                     Campaign Status
                   </label>
                   <div className="flex space-x-4">
                     <label className="flex items-center space-x-2 cursor-pointer">
                       <input
                         type="radio"
                         checked={campaignFormData.status === 'PAUSED'}
                         onChange={() => handleCampaignInputChange('status', 'PAUSED')}
                         className="text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-text dark:text-gray-300">PAUSED (Safe - Review before starting)</span>
                     </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                       <input
                         type="radio"
                         checked={campaignFormData.status === 'ACTIVE'}
                         onChange={() => handleCampaignInputChange('status', 'ACTIVE')}
                         className="text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm text-text dark:text-gray-300">ACTIVE (Start immediately)</span>
                     </label>
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     PAUSED is recommended for safety. You can activate the campaign later in Facebook Ads Manager.
                   </p>
                 </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newStartDate" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      id="newStartDate"
                      type="date"
                      value={campaignFormData.startDate}
                      onChange={(e) => handleCampaignInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="newEndDate" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      id="newEndDate"
                      type="date"
                      value={campaignFormData.endDate}
                      onChange={(e) => handleCampaignInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateNewCampaign}
                  disabled={isCreatingCampaign}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isCreatingCampaign ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>{selectedCampaignMode === 'new' ? 'Create New Campaign' : 'Use Selected Campaign'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Campaign Creation Results */}
              {newCampaignResult && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      {selectedCampaignMode === 'new' 
                        ? (newCampaignResult.status === 'ACTIVE' 
                            ? 'Campaign Created and Activated!' 
                            : 'Campaign Created Successfully!')
                        : 'Campaign Selected Successfully!'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300 font-medium">Campaign Name:</span>
                      <span className="text-green-800 dark:text-green-200">{newCampaignResult.campaignName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300 font-medium">Campaign ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-800 dark:text-green-200 font-mono">{newCampaignResult.campaignId}</span>
                        <button
                          onClick={() => copyToClipboard(newCampaignResult.campaignId || '', 'campaignId')}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          {copiedField === 'campaignId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300 font-medium">Ad Account ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-800 dark:text-green-200 font-mono">{newCampaignResult.adAccountId}</span>
                        <button
                          onClick={() => copyToClipboard(newCampaignResult.adAccountId || '', 'adAccountId')}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          {copiedField === 'adAccountId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300 font-medium">Objective:</span>
                      <span className="text-green-800 dark:text-green-200">{newCampaignResult.objective}</span>
                    </div>
                                         <div className="flex justify-between">
                       <span className="text-green-700 dark:text-green-300 font-medium">Status:</span>
                       <span className="text-green-800 dark:text-green-200">{newCampaignResult.status}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-green-700 dark:text-green-300 font-medium">Country:</span>
                       <span className="text-green-800 dark:text-green-200">{newCampaignResult.country}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-green-700 dark:text-green-300 font-medium">Currency:</span>
                       <span className="text-green-800 dark:text-green-200">{newCampaignResult.currency} ({getCurrencySymbol(newCampaignResult.currency || '')})</span>
                     </div>
                  </div>
                  
                  {/* Save Credentials Button */}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <button
                      onClick={handleOpenCredentialModal}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      <Key className="w-4 h-4" />
                      <span>Save Credentials</span>
                    </button>
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Save your Ad Account ID and Campaign ID to the Credential Vault for future use
                    </p>
                  </div>
                </div>
              )}

              {/* Ad Set Creation Section */}
              {newCampaignResult && !adSetResult && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Next Step: Create Ad Set</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!showAdSetForm) {
                          // Reset form data to defaults when opening
                          setAdSetFormData({
                            adSetName: '',
                            dailyBudget: 50,
                            startDate: '',
                            endDate: '',
                            targeting: {
                              countries: ['United States'],
                              ageMin: 18,
                              ageMax: 65,
                              interests: [],
                              behaviors: []
                            },
                            optimizationGoal: 'LINK_CLICKS',
                            billingEvent: 'IMPRESSIONS',
                            bidStrategy: 'LOWEST_COST_WITHOUT_CAP'
                          });
                        }
                        setShowAdSetForm(!showAdSetForm);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showAdSetForm ? 'Hide Form' : 'Create Ad Set'}
                    </button>
                  </div>
                  
                  <p className="text-blue-700 text-sm mb-4">
                    Your campaign is ready! Now create an Ad Set to define your audience, budget, and targeting.
                  </p>

                  {showAdSetForm && (
                    <div className="space-y-4">
                      {/* Ad Set Name */}
                      <div>
                        <label htmlFor="adSetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ad Set Name
                        </label>
                        <input
                          id="adSetName"
                          type="text"
                          value={adSetFormData.adSetName}
                          onChange={(e) => handleAdSetInputChange('adSetName', e.target.value)}
                          placeholder="e.g., Young Professionals 25-35"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      {/* Daily Budget */}
                      <div>
                        <label htmlFor="adSetBudget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Daily Budget ({getCurrencySymbol(newCampaignResult.currency || 'USD')})
                        </label>
                        <input
                          id="adSetBudget"
                          type="number"
                          min="1"
                          step="0.01"
                          value={adSetFormData.dailyBudget || 0}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleAdSetInputChange('dailyBudget', isNaN(value) ? 0 : value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="adSetStartDate" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                            Start Date
                          </label>
                          <input
                            id="adSetStartDate"
                            type="date"
                            value={adSetFormData.startDate}
                            onChange={(e) => handleAdSetInputChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="adSetEndDate" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                            End Date
                          </label>
                          <input
                            id="adSetEndDate"
                            type="date"
                            value={adSetFormData.endDate}
                            onChange={(e) => handleAdSetInputChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      {/* Targeting */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-text dark:text-gray-300">Targeting</h4>
                        
                        {/* Countries */}
                        <div>
                          <label htmlFor="adSetCountries" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                            Countries
                          </label>
                          <select
                            id="adSetCountries"
                            value={adSetFormData.targeting.countries[0] || ''}
                            onChange={(e) => handleTargetingChange('countries', [e.target.value])}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="">Select a country</option>
                            {countriesWithCurrencies.map(country => (
                              <option key={`${country.country}-${country.currency}`} value={country.country}>
                                {country.country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Age Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="adSetAgeMin" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                              Minimum Age
                            </label>
                            <input
                              id="adSetAgeMin"
                              type="number"
                              min="13"
                              max="65"
                              value={adSetFormData.targeting.ageMin || 18}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 18 : parseInt(e.target.value);
                                handleTargetingChange('ageMin', isNaN(value) ? 18 : value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label htmlFor="adSetAgeMax" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                              Maximum Age
                            </label>
                            <input
                              id="adSetAgeMax"
                              type="number"
                              min="13"
                              max="65"
                              value={adSetFormData.targeting.ageMax || 65}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 65 : parseInt(e.target.value);
                                handleTargetingChange('ageMax', isNaN(value) ? 65 : value);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>

                        {/* Optimization Goal */}
                        <div>
                          <label htmlFor="adSetOptimization" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                            Optimization Goal
                          </label>
                          <select
                            id="adSetOptimization"
                            value={adSetFormData.optimizationGoal}
                            onChange={(e) => handleAdSetInputChange('optimizationGoal', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            {optimizationGoals.map(goal => (
                              <option key={goal.value} value={goal.value}>
                                {goal.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Billing Event */}
                        <div>
                          <label htmlFor="adSetBilling" className="block text-sm font-medium text-text dark:text-gray-300 mb-2">
                            Billing Event
                          </label>
                          <select
                            id="adSetBilling"
                            value={adSetFormData.billingEvent}
                            onChange={(e) => handleAdSetInputChange('billingEvent', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            {billingEvents.map(event => (
                              <option key={event.value} value={event.value}>
                                {event.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Create Ad Set Button */}
                      <button
                        onClick={handleCreateAdSet}
                        disabled={isCreatingAdSet}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isCreatingAdSet ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Creating Ad Set...</span>
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4" />
                            <span>Create Ad Set</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ad Set Creation Results */}
              {adSetResult && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-800 dark:text-blue-200 font-medium">Ad Set Created Successfully!</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Ad Set Name:</span>
                      <span className="text-blue-800 dark:text-blue-200">{adSetResult.adSetName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Ad Set ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-800 dark:text-blue-200 font-mono">{adSetResult.adSetId}</span>
                        <button
                          onClick={() => copyToClipboard(adSetResult.adSetId || '', 'adSetId')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {copiedField === 'adSetId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Daily Budget:</span>
                      <span className="text-blue-800 dark:text-blue-200">{getCurrencySymbol(newCampaignResult?.currency || 'USD')}{adSetResult.dailyBudget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Age Range:</span>
                      <span className="text-blue-800 dark:text-blue-200">{adSetResult.targeting?.age_min} - {adSetResult.targeting?.age_max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Countries:</span>
                      <span className="text-blue-800 dark:text-blue-200">{adSetResult.targeting?.geo_locations?.countries?.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>Next Step:</strong> Create ads within this Ad Set to start your campaign. 
                      You can create multiple ads to test different creatives and messages.
                    </p>
                  </div>

                  {/* Create Ad Section */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAdForm(!showAdForm)}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      <span>{showAdForm ? 'Hide Create Ad Form' : 'Create Ad'}</span>
                    </button>

                    {showAdForm && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Ad</h4>
                        
                        <div className="space-y-4">
                          {/* Ad Name */}
                          <div>
                            <label htmlFor="adName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Ad Name *
                            </label>
                            <input
                              id="adName"
                              type="text"
                              value={adFormData.adName}
                              onChange={(e) => handleAdInputChange('adName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="My Facebook Ad"
                            />
                          </div>

                          {/* Headline */}
                          <div>
                            <label htmlFor="adHeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Headline * (Max 40 characters)
                            </label>
                            <input
                              id="adHeadline"
                              type="text"
                              maxLength={40}
                              value={adFormData.headline}
                              onChange={(e) => handleAdInputChange('headline', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="Compelling headline for your ad"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                              {adFormData.headline.length}/40
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label htmlFor="adDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Description * (Max 125 characters)
                            </label>
                            <textarea
                              id="adDescription"
                              maxLength={125}
                              rows={3}
                              value={adFormData.description}
                              onChange={(e) => handleAdInputChange('description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="Detailed description of your product or service"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                              {adFormData.description.length}/125
                            </div>
                          </div>

                          {/* Generated Image Preview */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Ad Image *
                            </label>
                            {adResult?.imageUrl ? (
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={adResult.imageUrl}
                                    alt="Generated ad image"
                                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                  />
                                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Auto-filled from generated content
                                  </div>
                                </div>
                                <p className="text-xs text-green-600 font-medium">
                                  ✅ Using the image generated in step 1
                                </p>
                              </div>
                            ) : (
                              <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <div className="text-sm font-medium">No image generated yet</div>
                                  <div className="text-xs">Please generate content first to create an ad</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Call to Action */}
                          <div>
                            <label htmlFor="adCallToAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Call to Action
                            </label>
                            <select
                              id="adCallToAction"
                              value={adFormData.callToAction}
                              onChange={(e) => handleAdInputChange('callToAction', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              {callToActions.map(action => (
                                <option key={action.value} value={action.value}>
                                  {action.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Landing Page URL */}
                          <div>
                            <label htmlFor="adLandingPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Landing Page URL
                            </label>
                            <input
                              id="adLandingPage"
                              type="url"
                              value={adFormData.landingPageUrl}
                              onChange={(e) => handleAdInputChange('landingPageUrl', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="https://example.com/landing-page"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Where users will go when they click your ad
                            </p>
                          </div>

                          {/* Create Ad Button */}
                          <button
                            onClick={handleCreateAd}
                            disabled={isCreatingAd}
                            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {isCreatingAd ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Creating Ad...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Create Ad</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Facebook Connection Status */}
            {storedPageId ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Facebook Connected</span>
                </div>
                <p className="text-green-700 text-sm mt-1">Ready to create ads and campaigns</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-medium">Facebook Not Connected</span>
                </div>
                <p className="text-amber-700 text-sm mt-1">Add credentials in Credential Vault</p>
              </div>
            )}

            {/* Ad Creation Results */}
            {createdAdResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Ad Created Successfully!</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">Ad Name:</span>
                    <span className="text-green-800">{createdAdResult.adName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">Ad ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-800 font-mono">{createdAdResult.adId}</span>
                      <button
                        onClick={() => copyToClipboard(createdAdResult.adId || '', 'adId')}
                        className="text-green-600 hover:text-green-700"
                      >
                        {copiedField === 'adId' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">Headline:</span>
                    <span className="text-green-800">{createdAdResult.headline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">Description:</span>
                    <span className="text-green-800">{createdAdResult.description}</span>
                  </div>
                  {createdAdResult.imageUrl && (
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">Image:</span>
                      <span className="text-green-800 text-xs truncate max-w-32">{createdAdResult.imageUrl}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>🎉 Congratulations!</strong> Your ad has been created and is now running in your Ad Set. 
                    You can view and manage it in Facebook Ads Manager.
                  </p>
                </div>

                {/* Generate Ads Button - Final Step */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSuccessMessage('✅ Ad generation workflow completed successfully! Your ad is now live and running.');
                      // Reset the entire workflow
                      setAdResult(null);
                      setNewCampaignResult(null);
                      setAdSetResult(null);
                      setCreatedAdResult(null);
                      setShowAdForm(false);
                      setShowAdSetForm(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Complete Workflow - Generate Ads</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This completes the 4-step workflow: Generate Content → Campaign → Ad Set → Ad Creation
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {adResult && (
              <>
                {/* Ad Image */}
                {adResult.imageUrl && (
                  <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                    <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-4">Generated Ad Image</h3>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <img 
                        src={adResult.imageUrl} 
                        alt="Generated Ad Image" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600';
                        }}
                      />
                    </div>
                    {adResult.imageDescription && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Image: {adResult.imageDescription}</p>
                    )}
                  </div>
                )}

                {/* Ad Caption */}
                <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text dark:text-gray-100">Ad Caption</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.caption, 'caption')}
                      className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {copiedField === 'caption' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'caption' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{adResult.caption}</p>
                  </div>
                </div>

                {/* Enhanced Features Preview */}
                {(uploadedMedia.length > 0 || generatedHashtags || finalPost) && (
                  <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                    <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-4">Enhanced Features Preview</h3>
                    
                    <div className="space-y-4">
                      {/* Uploaded Media Preview */}
                      {uploadedMedia.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-text dark:text-gray-300 mb-2">Uploaded Media</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {uploadedMedia.map((file, index) => (
                              <div key={index} className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                                <div className="aspect-square bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {file.type.startsWith('image/') ? '📷' : '🎥'} {file.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generated Hashtags Preview */}
                      {generatedHashtags && includeHashtags && !imagePromptOnly && (
                        <div>
                          <h4 className="text-md font-medium text-text dark:text-gray-300 mb-2">Generated Hashtags</h4>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                              {generatedHashtags}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Final Post Preview */}
                      {finalPost && (
                        <div>
                          <h4 className="text-md font-medium text-text dark:text-gray-300 mb-2">Final Post (with enhancements)</h4>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                              {finalPost}
                            </p>
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                              Word count: {finalPost.split(' ').length} words
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text dark:text-gray-100">Hashtags</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.hashtags.join(' '), 'hashtags')}
                      className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {copiedField === 'hashtags' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'hashtags' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {adResult.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text dark:text-gray-100">Targeting Keywords</h3>
                    <button
                      onClick={() => copyToClipboard(adResult.keywords.join(', '), 'keywords')}
                      className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {copiedField === 'keywords' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedField === 'keywords' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {adResult.keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3"
                      >
                        <span className="text-green-800 dark:text-green-200 font-medium">{keyword}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Platform Publishing */}
                <MultiPlatformPublisher
                  content={adResult.caption}
                  imageUrl={adResult.imageUrl}
                  onPublishSuccess={(platform, postId) => {
                    console.log(`Successfully published to ${platform} with post ID: ${postId}`);
                    setSuccessMessage(`Content published to ${platform} successfully!`);
                  }}
                  onPublishError={(platform, error) => {
                    console.error(`Error publishing to ${platform}:`, error);
                    setError(`Failed to publish to ${platform}: ${error}`);
                  }}
                />

                {/* Success Messages */}
                {publishedPostId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-800 dark:text-blue-200 font-medium">Content Published to Facebook Page!</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">Post ID: {publishedPostId}</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">This is a regular page post, not an ad campaign.</p>
                  </div>
                )}

                {createdCampaignId && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-800 dark:text-green-200 font-medium">Facebook Ad Campaign Created Successfully!</span>
                    </div>
                    <p className="text-green-700 dark:text-green-300 text-sm">Campaign ID: {createdCampaignId}</p>
                    {createdAdId && <p className="text-green-700 dark:text-green-300 text-sm">Ad ID: {createdAdId}</p>}
                    <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 text-sm font-medium">🎯 Your ad campaign is ready!</p>
                      <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                        • Campaign is created in PAUSED status for safety<br/>
                        • Go to Facebook Ads Manager to review and activate<br/>
                        • You can adjust targeting, budget, and scheduling there
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="bg-bg-alt dark:bg-gray-800 rounded-xl shadow-sm border border-border-purple dark:border-gray-600 p-6">
                  <div className="space-y-4">
                    {/* Create Ad Campaign Button */}
                    {adResult && !createdCampaignId && (
                      <button
                        onClick={handleCreateAd}
                        disabled={isCreatingAd}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isCreatingAd ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Creating Ad Campaign...</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5" />
                            <span>Create Facebook Ad Campaign</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Publish to Page Button */}
                    {!publishedPostId && storedPageId && (
                      <div className="border-t pt-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 text-center">OR publish as a regular page post:</p>
                        <button
                          onClick={handlePublishAd}
                          disabled={isPublishing}
                          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isPublishing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Publishing to Page...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              <span>Publish as Page Post</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optimization Tips */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">Optimization Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {adResult.targetingTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-purple-800 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {!adResult && !isGenerating && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-8 text-center transition-colors duration-300">
                <div className="flex justify-center space-x-4 mb-4">
                  <Target className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Ready to Generate Your Ad</h3>
                <p className="text-gray-600 dark:text-gray-300">Fill in the campaign details and click generate to create your optimized Facebook ad with image.</p>
              </div>
            )}
          </div>
        </div>

                 {/* Information Section */}
         <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl p-6 mt-8 transition-colors duration-300">
           <div className="flex items-start space-x-3">
             <div className="w-8 h-8 bg-blue-100 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
               <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">ℹ️</span>
             </div>
             <div>
               <h4 className="text-blue-900 dark:text-gray-100 font-semibold mb-3">Understanding the Difference:</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-gray-600 transition-colors duration-300">
                   <h5 className="font-semibold text-green-700 dark:text-green-400 mb-2">🎯 Facebook Ad Campaign</h5>
                   <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                     <li>• Paid advertising with targeting</li>
                     <li>• Reaches new audiences</li>
                     <li>• Controlled budget and scheduling</li>
                     <li>• Appears in news feeds as sponsored content</li>
                     <li>• Requires Facebook Ads Manager access</li>
                   </ul>
                 </div>
                 <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-gray-600 transition-colors duration-300">
                   <h5 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">📝 Page Post</h5>
                   <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                     <li>• Free organic content</li>
                     <li>• Reaches your existing followers</li>
                     <li>• No targeting or budget control</li>
                     <li>• Appears in your page's timeline</li>
                     <li>• Good for community engagement</li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>
         </div>

         {/* Best Practices */}
         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-6">
           <div className="flex items-start space-x-3">
             <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
             <div>
               <h4 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Facebook Ad Best Practices:</h4>
               <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                 <li>Keep your headline under 25 characters for mobile optimization</li>
                 <li>Use high-quality, eye-catching visuals that stop the scroll</li>
                 <li>Include a clear, compelling call-to-action (CTA)</li>
                 <li>Test multiple ad variations to find what works best</li>
                 <li>Use Facebook Pixel for better conversion tracking</li>
                 <li>Target lookalike audiences based on your best customers</li>
               </ul>
             </div>
           </div>
         </div>

        {/* Credential Modal */}
        {showCredentialModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Save Facebook Ads Credentials</h3>
                </div>
                <button
                  onClick={() => setShowCredentialModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Save your Facebook Ads credentials to the Credential Vault for future use. 
                  This will allow you to create Ad Sets and Ads without re-entering your credentials.
                </p>
                
                {adsAccessToken && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">Access Token Auto-Populated</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Your Facebook access token has been automatically loaded from your session.
                    </p>
                  </div>
                )}

                {/* Access Token */}
                <div>
                  <label htmlFor="adsAccessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Facebook Ads Access Token *
                  </label>
                  <input
                    id="adsAccessToken"
                    type="password"
                    value={adsAccessToken}
                    onChange={(e) => setAdsAccessToken(e.target.value)}
                    placeholder="Enter your Facebook Ads access token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get this from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Facebook Graph API Explorer</a>
                  </p>
                </div>

                {/* Ad Account ID */}
                <div>
                  <label htmlFor="adsAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Account ID *
                  </label>
                  <input
                    id="adsAccountId"
                    type="text"
                    value={adsAccountId}
                    onChange={(e) => setAdsAccountId(e.target.value)}
                    placeholder="Enter your Ad Account ID (numbers only)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter only the numbers (e.g., 123456789 for act_123456789)
                  </p>
                </div>

                {/* Campaign ID */}
                <div>
                  <label htmlFor="adsCampaignId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign ID
                  </label>
                  <input
                    id="adsCampaignId"
                    type="text"
                    value={adsCampaignId}
                    onChange={(e) => setAdsCampaignId(e.target.value)}
                    placeholder="Enter your Campaign ID (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: Save a specific campaign ID for quick access
                  </p>
                </div>

                {/* Message */}
                {adsCredentialMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    adsCredentialMessage.includes('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {adsCredentialMessage}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCredentialModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAdsCredentials}
                    disabled={isSavingAdsCredentials}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingAdsCredentials ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacebookAdGenerator;