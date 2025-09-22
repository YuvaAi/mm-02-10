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
    
    // Enhanced fields to get more comprehensive metrics
    const fields = [
      'insights.metric(post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views)',
      'shares',
      'comments.summary(true)',
      'likes.summary(true)',
      'created_time',
      'message',
      'full_picture',
      'story',
      'type'
    ].join(',');
    
    const response = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`);
    const data = await response.json();
    
    console.log('📊 Facebook analytics response:', data);
    
    if (!response.ok) {
      console.warn('Facebook API error:', data.error?.message);
      throw new Error(data.error?.message || 'Failed to fetch Facebook insights');
    }

    const insights = Array.isArray(data.insights?.data) ? data.insights.data : [];
    const getMetric = (name: string) => insights.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;

    // Extract comprehensive metrics
    const impressions = Number(getMetric('post_impressions')) || 0;
    const reach = Number(getMetric('post_impressions_unique')) || 0;
    const engaged = Number(getMetric('post_engaged_users')) || 0;
    const clicks = Number(getMetric('post_clicks')) || 0;
    const videoViews = Number(getMetric('post_video_views')) || 0;
    
    // Get reaction breakdown
    const reactionsData = getMetric('post_reactions_by_type_total');
    let totalLikes = 0;
    if (reactionsData && typeof reactionsData === 'object') {
      totalLikes = Object.values(reactionsData).reduce((sum: number, count: any) => sum + Number(count), 0);
    }
    
    const likes = Number(data.likes?.summary?.total_count) || totalLikes;
    const comments = Number(data.comments?.summary?.total_count) || 0;
    const shares = Number(data.shares?.count) || 0;
    
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
      ctr
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
      createdAt: data.created_time,
      content: data.message || data.story || '',
      imageUrl: data.full_picture || '',
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
    
    // Then get comprehensive insights
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
    const insightsData = await insightsResponse.json();
    
    console.log('📊 Instagram insights data:', insightsData);
    
    if (!insightsResponse.ok) {
      console.warn('Instagram API error:', insightsData.error?.message);
      throw new Error(insightsData.error?.message || 'Failed to fetch Instagram insights');
    }

    const getMetric = (name: string) => insightsData.data?.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;
    
    // Extract comprehensive metrics
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
      ctr
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
    const credsRef = collection(db, 'users', userId, 'credentials');
    const snap = await getDocs(credsRef);
    const map: Record<string, UserCredentials> = {} as any;
    snap.forEach(docSnap => {
      map[docSnap.id] = { type: docSnap.id, ...(docSnap.data() as any) } as UserCredentials;
    });
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
  
  for (const post of posts) {
    try {
      let metrics: AnalyticsMetrics | null = null;
      
      switch (post.platform) {
        case 'facebook': {
          const token = credentials.facebook?.accessToken;
          if (token && post.postId) {
            metrics = await fetchFacebookMetrics(post.postId, token);
          }
          break;
        }
        
        case 'instagram': {
          const token = credentials.instagram?.accessToken;
          const mediaId = post.postId || post.mediaId;
          if (token && mediaId) {
            metrics = await fetchInstagramMetrics(mediaId, token);
          }
          break;
        }
        
        case 'linkedin': {
          const token = credentials.linkedin?.accessToken;
          if (token && post.postId) {
            metrics = await fetchLinkedInMetrics(post.postId, token);
          }
          break;
        }
      }
      
      if (metrics) {
        results.push(metrics);
      }
    } catch (error) {
      console.error(`Error fetching metrics for ${post.platform} post ${post.postId}:`, error);
    }
  }
  
  return results;
}


