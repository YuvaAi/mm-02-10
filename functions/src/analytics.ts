import * as admin from 'firebase-admin';

// Firebase Analytics function to fetch metrics from social platforms
export const fetchAnalyticsData = async (data: any, context: any) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = context.auth.uid;
    const { postId, platform, accessToken } = data;

    if (!postId || !platform || !accessToken) {
      throw new Error('Missing required parameters');
    }

    console.log(`🔍 Fetching ${platform} analytics for post: ${postId}`);

    let metrics;
    switch (platform) {
      case 'facebook':
        metrics = await fetchFacebookMetricsServer(postId, accessToken);
        break;
      case 'instagram':
        metrics = await fetchInstagramMetricsServer(postId, accessToken);
        break;
      case 'linkedin':
        metrics = await fetchLinkedInMetricsServer(postId, accessToken);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Store metrics in Firestore for caching
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('analytics')
      .doc(`${platform}_${postId}`)
      .set({
        ...metrics,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId
      });

    return { success: true, metrics };
  } catch (error) {
    console.error('Analytics function error:', error);
    throw error;
  }
};

// Facebook metrics fetching (server-side)
async function fetchFacebookMetricsServer(postId: string, accessToken: string): Promise<any> {
  try {
    // Get basic post data
    const basicResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=shares,comments.summary(true),likes.summary(true),created_time,message,full_picture,story,type&access_token=${accessToken}`);
    const basicData = await basicResponse.json();

    if (!basicResponse.ok) {
      throw new Error(basicData.error?.message || 'Failed to fetch Facebook post data');
    }

    // Try to get insights
    let insightsData = null;
    try {
      const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views&access_token=${accessToken}`);
      insightsData = await insightsResponse.json();
    } catch (insightsError) {
      console.warn('Facebook insights not available:', insightsError);
    }

    // Extract metrics
    let impressions = 0, reach = 0, clicks = 0;
    if (insightsData && insightsData.data) {
      const getMetric = (name: string) => insightsData.data.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;
      impressions = Number(getMetric('post_impressions')) || 0;
      reach = Number(getMetric('post_impressions_unique')) || 0;
      clicks = Number(getMetric('post_clicks')) || 0;
    }

    const likes = Number(basicData.likes?.summary?.total_count) || 0;
    const comments = Number(basicData.comments?.summary?.total_count) || 0;
    const shares = Number(basicData.shares?.count) || 0;
    const engagement = likes + comments + shares + clicks;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

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
  } catch (error) {
    console.error('Facebook metrics error:', error);
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

// Instagram metrics fetching (server-side)
async function fetchInstagramMetricsServer(mediaId: string, accessToken: string): Promise<any> {
  try {
    // Get media data
    const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}?fields=media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink&access_token=${accessToken}`);
    const mediaData = await mediaResponse.json();

    if (!mediaResponse.ok) {
      throw new Error(mediaData.error?.message || 'Failed to fetch Instagram media data');
    }

    // Try to get insights
    let insightsData = null;
    try {
      const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}/insights?metric=impressions,reach,engagement,likes,comments,saved,shares,video_views,profile_visits,website_clicks&access_token=${accessToken}`);
      insightsData = await insightsResponse.json();
    } catch (insightsError) {
      console.warn('Instagram insights not available:', insightsError);
    }

    const getMetric = (name: string) => insightsData?.data?.find((m: any) => m.name === name)?.values?.[0]?.value ?? 0;
    
    const impressions = Number(getMetric('impressions')) || 0;
    const reach = Number(getMetric('reach')) || 0;
    const likes = Number(getMetric('likes')) || Number(mediaData.like_count) || 0;
    const comments = Number(getMetric('comments')) || Number(mediaData.comments_count) || 0;
    const shares = Number(getMetric('shares')) || 0;
    const saved = Number(getMetric('saved')) || 0;
    const profileVisits = Number(getMetric('profile_visits')) || 0;
    const websiteClicks = Number(getMetric('website_clicks')) || 0;
    
    const engagement = likes + comments + shares + saved + profileVisits;
    const clicks = websiteClicks + profileVisits;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

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
  } catch (error) {
    console.error('Instagram metrics error:', error);
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

// LinkedIn metrics fetching (server-side)
async function fetchLinkedInMetricsServer(postId: string, accessToken: string): Promise<any> {
  try {
    const response = await fetch(`https://api.linkedin.com/v2/socialActions/${postId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.warn('LinkedIn API error:', data.message);
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

    const likes = Number(data.numLikes) || 0;
    const comments = Number(data.numComments) || 0;
    const shares = Number(data.numShares) || 0;
    
    // Estimate impressions and reach (LinkedIn doesn't provide these in basic API)
    const estimatedImpressions = Math.max(likes + comments + shares, 1) * 10;
    const estimatedReach = Math.floor(estimatedImpressions * 0.8);
    
    const engagement = likes + comments + shares;

    return {
      postId,
      platform: 'linkedin',
      impressions: estimatedImpressions,
      reach: estimatedReach,
      engagement,
      likes,
      comments,
      shares,
      clicks: 0,
      ctr: 0,
      createdAt: data.created?.time || '',
      content: data.text?.text || '',
    };
  } catch (error) {
    console.error('LinkedIn metrics error:', error);
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
