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
exports.fetchAnalyticsData = void 0;
const admin = __importStar(require("firebase-admin"));
// Firebase Analytics function to fetch metrics from social platforms
const fetchAnalyticsData = async (data, context) => {
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
            .set(Object.assign(Object.assign({}, metrics), { fetchedAt: admin.firestore.FieldValue.serverTimestamp(), userId }));
        return { success: true, metrics };
    }
    catch (error) {
        console.error('Analytics function error:', error);
        throw error;
    }
};
exports.fetchAnalyticsData = fetchAnalyticsData;
// Facebook metrics fetching (server-side)
async function fetchFacebookMetricsServer(postId, accessToken) {
    var _a, _b, _c, _d, _e, _f;
    try {
        // Get basic post data
        const basicResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}?fields=shares,comments.summary(true),likes.summary(true),created_time,message,full_picture,story,type&access_token=${accessToken}`);
        const basicData = await basicResponse.json();
        if (!basicResponse.ok) {
            throw new Error(((_a = basicData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to fetch Facebook post data');
        }
        // Try to get insights
        let insightsData = null;
        try {
            const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views&access_token=${accessToken}`);
            insightsData = await insightsResponse.json();
        }
        catch (insightsError) {
            console.warn('Facebook insights not available:', insightsError);
        }
        // Extract metrics
        let impressions = 0, reach = 0, clicks = 0;
        if (insightsData && insightsData.data) {
            const getMetric = (name) => { var _a, _b, _c, _d; return (_d = (_c = (_b = (_a = insightsData.data.find((m) => m.name === name)) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0; };
            impressions = Number(getMetric('post_impressions')) || 0;
            reach = Number(getMetric('post_impressions_unique')) || 0;
            clicks = Number(getMetric('post_clicks')) || 0;
        }
        const likes = Number((_c = (_b = basicData.likes) === null || _b === void 0 ? void 0 : _b.summary) === null || _c === void 0 ? void 0 : _c.total_count) || 0;
        const comments = Number((_e = (_d = basicData.comments) === null || _d === void 0 ? void 0 : _d.summary) === null || _e === void 0 ? void 0 : _e.total_count) || 0;
        const shares = Number((_f = basicData.shares) === null || _f === void 0 ? void 0 : _f.count) || 0;
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
    }
    catch (error) {
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
async function fetchInstagramMetricsServer(mediaId, accessToken) {
    var _a;
    try {
        // Get media data
        const mediaResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}?fields=media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink&access_token=${accessToken}`);
        const mediaData = await mediaResponse.json();
        if (!mediaResponse.ok) {
            throw new Error(((_a = mediaData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to fetch Instagram media data');
        }
        // Try to get insights
        let insightsData = null;
        try {
            const insightsResponse = await fetch(`https://graph.facebook.com/v21.0/${mediaId}/insights?metric=impressions,reach,engagement,likes,comments,saved,shares,video_views,profile_visits,website_clicks&access_token=${accessToken}`);
            insightsData = await insightsResponse.json();
        }
        catch (insightsError) {
            console.warn('Instagram insights not available:', insightsError);
        }
        const getMetric = (name) => { var _a, _b, _c, _d, _e; return (_e = (_d = (_c = (_b = (_a = insightsData === null || insightsData === void 0 ? void 0 : insightsData.data) === null || _a === void 0 ? void 0 : _a.find((m) => m.name === name)) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : 0; };
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
    }
    catch (error) {
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
async function fetchLinkedInMetricsServer(postId, accessToken) {
    var _a, _b;
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
            createdAt: ((_a = data.created) === null || _a === void 0 ? void 0 : _a.time) || '',
            content: ((_b = data.text) === null || _b === void 0 ? void 0 : _b.text) || '',
        };
    }
    catch (error) {
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
//# sourceMappingURL=analytics.js.map