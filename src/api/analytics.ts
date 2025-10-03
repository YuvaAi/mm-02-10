import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { UserCredentials } from '../firebase/types';
import { fetchLinkedInMetrics } from './linkedin';

export type AnalyticsMetrics = {
  postId: string;
  platform: 'facebook' | 'instagram' | 'linkedin';
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  ctr: number; // 0-100 percentage
  createdAt?: string;
  content?: string;
  imageUrl?: string;
};

export type TimeSeriesData = {
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  posts: number;
};

export type PlatformComparison = {
  platform: string;
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  totalPosts: number;
  avgEngagementRate: number;
  avgCTR: number;
};

export type TrendingPost = {
  postId: string;
  platform: string;
  content: string;
  imageUrl?: string;
  impressions: number;
  engagement: number;
  engagementRate: number;
  createdAt: string;
};

// Enhanced Facebook metrics with comprehensive insights
export async function fetchFacebookMetrics(postId: string, accessToken: string): Promise<AnalyticsMetrics> {
  try {
    console.log('🔍 Fetching Facebook metrics for post:', postId);
    console.log('🔑 Using access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    // First, try to get basic post data
    const basicFields = [
      'shares',
      'comments.summary(true)',
      'likes.summary(true)',
      'created_time',
      'message',
      'full_picture',
      'story',
      'type',
      'permalink_url'
    ].join(',');
    
    const basicResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=${encodeURIComponent(basicFields)}&access_token=${accessToken}`);
    const basicData = await basicResponse.json();
    
    console.log('📊 Facebook basic data response:', basicData);
    
    if (!basicResponse.ok) {
      console.warn('Facebook basic API error:', basicData.error?.message);
      throw new Error(basicData.error?.message || 'Failed to fetch Facebook post data');
    }

    // Then try to get insights data (this may fail for some posts)
    let insightsData = null;
    try {
      const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views&access_token=${accessToken}`);
      insightsData = await insightsResponse.json();
      console.log('📊 Facebook insights response:', insightsData);
    } catch (insightsError) {
      console.warn('⚠️ Facebook insights not available for this post:', insightsError);
    }

    // Extract metrics from insights if available
    let impressions = 0, reach = 0, engaged = 0, clicks = 0, videoViews = 0;
    if (insightsData && insightsData.data) {
      const getMetric = (name: string) => insightsData.data.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;
      
      impressions = Number(getMetric('post_impressions')) || 0;
      reach = Number(getMetric('post_impressions_unique')) || 0;
      engaged = Number(getMetric('post_engaged_users')) || 0;
      clicks = Number(getMetric('post_clicks')) || 0;
      videoViews = Number(getMetric('post_video_views')) || 0;
    }

    // Get reaction breakdown
    let totalLikes = 0;
    if (insightsData && insightsData.data) {
      const reactionsData = insightsData.data.find((m: any) => m.name === 'post_reactions_by_type_total')?.values?.[0]?.value;
      if (reactionsData && typeof reactionsData === 'object') {
        totalLikes = Object.values(reactionsData).reduce((sum: number, count: any) => sum + Number(count), 0);
      }
    }
    
    const likes = Number(basicData.likes?.summary?.total_count) || totalLikes;
    const comments = Number(basicData.comments?.summary?.total_count) || 0;
    const shares = Number(basicData.shares?.count) || 0;
    
    // Calculate engagement (likes + comments + shares + clicks)
    const engagement = likes + comments + shares + clicks;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    console.log('✅ Facebook metrics extracted:', {
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      clicks,
      ctr,
      hasInsights: !!insightsData
    });

    return {
      postId,
      platform: 'facebook',
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      clicks,
      ctr,
      createdAt: basicData.created_time,
      content: basicData.message || basicData.story || '',
      imageUrl: basicData.full_picture || '',
    };
  } catch (error: unknown) {
    const e = error as Error;
    console.warn('Facebook metrics error:', e.message);
    return {
      postId,
      platform: 'facebook',
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

// Enhanced Instagram metrics with comprehensive insights
export async function fetchInstagramMetrics(mediaId: string, accessToken: string): Promise<AnalyticsMetrics> {
  try {
    console.log('🔍 Fetching Instagram metrics for media:', mediaId);
    console.log('🔑 Using access token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    // First get the media details with enhanced fields
    const mediaFields = [
      'media_type',
      'media_url',
      'thumbnail_url',
      'caption',
      'timestamp',
      'like_count',
      'comments_count',
      'permalink'
    ].join(',');
    
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}?fields=${mediaFields}&access_token=${accessToken}`);
    const mediaData = await mediaResponse.json();
    
    console.log('📸 Instagram media data:', mediaData);
    
    if (!mediaResponse.ok) {
      console.warn('Instagram media API error:', mediaData.error?.message);
      throw new Error(mediaData.error?.message || 'Failed to fetch Instagram media data');
    }

    // Then try to get comprehensive insights (this may fail for some media)
    let insightsData = null;
    try {
      const insightsMetrics = [
        'impressions',
        'reach',
        'engagement',
        'likes',
        'comments',
        'saved',
        'shares',
        'video_views',
        'profile_visits',
        'website_clicks'
      ].join(',');
      
      const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${insightsMetrics}&access_token=${accessToken}`);
      insightsData = await insightsResponse.json();
      
      console.log('📊 Instagram insights data:', insightsData);
      
      if (!insightsResponse.ok) {
        console.warn('Instagram insights API error:', insightsData.error?.message);
        // Don't throw here, just log and continue with basic data
      }
    } catch (insightsError) {
      console.warn('⚠️ Instagram insights not available for this media:', insightsError);
    }

    const getMetric = (name: string) => insightsData?.data?.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;
    
    // Extract comprehensive metrics (use insights if available, fallback to basic data)
    const impressions = Number(getMetric('impressions')) || 0;
    const reach = Number(getMetric('reach')) || 0;
    const likes = Number(getMetric('likes')) || Number(mediaData.like_count) || 0;
    const comments = Number(getMetric('comments')) || Number(mediaData.comments_count) || 0;
    const shares = Number(getMetric('shares')) || 0;
    const saved = Number(getMetric('saved')) || 0;
    const videoViews = Number(getMetric('video_views')) || 0;
    const profileVisits = Number(getMetric('profile_visits')) || 0;
    const websiteClicks = Number(getMetric('website_clicks')) || 0;
    
    // Calculate engagement (likes + comments + shares + saved + profile visits)
    const engagement = likes + comments + shares + saved + profileVisits;
    const clicks = websiteClicks + profileVisits;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    console.log('✅ Instagram metrics extracted:', {
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      clicks,
      ctr,
      hasInsights: !!insightsData
    });

    return {
      postId: mediaId,
      platform: 'instagram',
      impressions,
      reach,
      engagement,
      likes,
      comments,
      shares,
      clicks,
      ctr,
      createdAt: mediaData.timestamp,
      content: mediaData.caption || '',
      imageUrl: mediaData.media_url || mediaData.thumbnail_url || '',
    };
  } catch (error: unknown) {
    const e = error as Error;
    console.warn('Instagram metrics error:', e.message);
    return {
      postId: mediaId,
      platform: 'instagram',
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

// Get published posts with enhanced data
export async function getPublishedPosts(userId: string) {
  try {
    const postsRef = collection(db, 'users', userId, 'posts');
    const q = query(postsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
}

// Get credentials map
export async function getCredentialsMap(userId: string): Promise<Record<string, UserCredentials>> {
  try {
    console.log('🔑 Fetching credentials for user:', userId);
    const credsRef = collection(db, 'users', userId, 'credentials');
    const snap = await getDocs(credsRef);
    const map: Record<string, UserCredentials> = {} as any;
    
    snap.forEach(docSnap => {
      const data = docSnap.data() as any;
      const platform = data.type || docSnap.id;
      map[platform] = { 
        type: platform, 
        ...data,
        id: docSnap.id 
      } as UserCredentials;
      
      console.log(`🔑 Found ${platform} credentials:`, {
        hasToken: !!data.accessToken,
        tokenLength: data.accessToken?.length || 0,
        pageId: data.pageId || data.linkedInUserId || data.instagramUserId || 'N/A'
      });
    });
    
    console.log('🔑 Total credentials found:', Object.keys(map).length);
    return map;
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return {};
  }
}

// Generate time series data for trends
export function generateTimeSeriesData(metrics: AnalyticsMetrics[]): TimeSeriesData[] {
  const timeMap = new Map<string, TimeSeriesData>();
  
  // Group by date
  metrics.forEach(metric => {
    if (!metric.createdAt) return;
    
    const date = new Date(metric.createdAt).toISOString().split('T')[0];
    const existing = timeMap.get(date) || {
      date,
      impressions: 0,
      reach: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      posts: 0,
    };
    
    existing.impressions += metric.impressions;
    existing.reach += metric.reach;
    existing.engagement += metric.engagement;
    existing.likes += metric.likes;
    existing.comments += metric.comments;
    existing.shares += metric.shares;
    existing.posts += 1;
    
    timeMap.set(date, existing);
  });
  
  // Convert to array and sort by date
  return Array.from(timeMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Generate platform comparison data
export function generatePlatformComparison(metrics: AnalyticsMetrics[]): PlatformComparison[] {
  const platformMap = new Map<string, PlatformComparison>();
  
  metrics.forEach(metric => {
    const existing = platformMap.get(metric.platform) || {
      platform: metric.platform,
      totalImpressions: 0,
      totalReach: 0,
      totalEngagement: 0,
      totalPosts: 0,
      avgEngagementRate: 0,
      avgCTR: 0,
    };
    
    existing.totalImpressions += metric.impressions;
    existing.totalReach += metric.reach;
    existing.totalEngagement += metric.engagement;
    existing.totalPosts += 1;
    
    platformMap.set(metric.platform, existing);
  });
  
  // Calculate averages
  platformMap.forEach((platform, key) => {
    platform.avgEngagementRate = platform.totalReach > 0 
      ? (platform.totalEngagement / platform.totalReach) * 100 
      : 0;
    platform.avgCTR = platform.totalImpressions > 0 
      ? (metrics.filter(m => m.platform === key).reduce((sum, m) => sum + m.clicks, 0) / platform.totalImpressions) * 100 
      : 0;
  });
  
  return Array.from(platformMap.values());
}

// Get trending posts (top performing)
export function getTrendingPosts(metrics: AnalyticsMetrics[]): TrendingPost[] {
  return metrics
    .map(metric => ({
      postId: metric.postId,
      platform: metric.platform,
      content: metric.content || '',
      imageUrl: metric.imageUrl || '',
      impressions: metric.impressions,
      engagement: metric.engagement,
      engagementRate: metric.reach > 0 ? (metric.engagement / metric.reach) * 100 : 0,
      createdAt: metric.createdAt || '',
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);
}

// Get performance spikes (posts with above-average performance)
export function getPerformanceSpikes(metrics: AnalyticsMetrics[]): AnalyticsMetrics[] {
  if (metrics.length === 0) return [];
  
  const avgImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0) / metrics.length;
  const avgEngagement = metrics.reduce((sum, m) => sum + m.engagement, 0) / metrics.length;
  
  return metrics.filter(metric => 
    metric.impressions > avgImpressions * 1.5 || 
    metric.engagement > avgEngagement * 1.5
  );
}

// Get comprehensive analytics for all platforms
export async function fetchAllPlatformMetrics(
  userId: string,
  posts: any[],
  credentials: Record<string, any>
): Promise<AnalyticsMetrics[]> {
  const results: AnalyticsMetrics[] = [];
  
  console.log('🔍 Fetching metrics for', posts.length, 'posts');
  console.log('🔑 Available credentials:', Object.keys(credentials));
  
  for (const post of posts) {
    try {
      console.log(`📊 Processing ${post.platform} post:`, post.postId || post.id);
      let metrics: AnalyticsMetrics | null = null;
      
      switch (post.platform) {
        case 'facebook': {
          const token = credentials.facebook?.accessToken;
          if (token && post.postId) {
            console.log('📘 Fetching Facebook metrics...');
            metrics = await fetchFacebookMetrics(post.postId, token);
          } else {
            console.warn('⚠️ No Facebook token or postId for post:', post.id);
          }
          break;
        }
        
        case 'instagram': {
          const token = credentials.instagram?.accessToken;
          const mediaId = post.postId || post.mediaId;
          if (token && mediaId) {
            console.log('📸 Fetching Instagram metrics...');
            metrics = await fetchInstagramMetrics(mediaId, token);
          } else {
            console.warn('⚠️ No Instagram token or mediaId for post:', post.id);
          }
          break;
        }
        
        case 'linkedin': {
          const token = credentials.linkedin?.accessToken;
          if (token && post.postId) {
            console.log('🔗 Fetching LinkedIn metrics...');
            metrics = await fetchLinkedInMetrics(post.postId, token);
          } else {
            console.warn('⚠️ No LinkedIn token or postId for post:', post.id);
          }
          break;
        }
        
        default:
          console.warn(`⚠️ Unsupported platform: ${post.platform}`);
      }
      
      if (metrics) {
        console.log(`✅ Got metrics for ${post.platform}:`, {
          impressions: metrics.impressions,
          engagement: metrics.engagement,
          likes: metrics.likes
        });
        results.push(metrics);
      } else {
        console.warn(`❌ No metrics retrieved for ${post.platform} post:`, post.id);
      }
    } catch (error) {
      console.error(`❌ Error fetching metrics for ${post.platform} post ${post.postId}:`, error);
    }
  }
  
  console.log(`📈 Total metrics collected: ${results.length}/${posts.length}`);
  return results;
}


