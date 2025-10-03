import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';
import { AnalyticsMetrics } from '../api/analytics';

// Analytics service using Firebase functions for better reliability
export class AnalyticsService {
  private static fetchAnalyticsFunction = httpsCallable(functions, 'fetchAnalyticsDataFunction');

  // Fetch metrics for a single post using Firebase function
  static async fetchPostMetrics(
    postId: string, 
    platform: string, 
    accessToken: string
  ): Promise<AnalyticsMetrics | null> {
    try {
      console.log(`🔍 Fetching ${platform} metrics for post: ${postId}`);
      
      const result = await this.fetchAnalyticsFunction({
        postId,
        platform,
        accessToken
      });

      if (result.data?.success && result.data?.metrics) {
        console.log(`✅ Successfully fetched ${platform} metrics:`, result.data.metrics);
        return result.data.metrics as AnalyticsMetrics;
      } else {
        console.warn(`⚠️ Failed to fetch ${platform} metrics:`, result.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching ${platform} metrics:`, error);
      return null;
    }
  }

  // Batch fetch metrics for multiple posts
  static async fetchBatchMetrics(
    posts: Array<{ postId: string; platform: string; accessToken: string }>
  ): Promise<AnalyticsMetrics[]> {
    const results: AnalyticsMetrics[] = [];
    
    console.log(`🔄 Batch fetching metrics for ${posts.length} posts`);
    
    // Process posts in parallel with rate limiting
    const batchSize = 3; // Limit concurrent requests
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(post => 
        this.fetchPostMetrics(post.postId, post.platform, post.accessToken)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Filter out null results
      const validResults = batchResults.filter((result): result is AnalyticsMetrics => result !== null);
      results.push(...validResults);
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`📈 Batch fetch complete: ${results.length}/${posts.length} successful`);
    return results;
  }

  // Get cached analytics data from Firestore
  static async getCachedAnalytics(userId: string, platform?: string): Promise<AnalyticsMetrics[]> {
    try {
      const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      
      const analyticsRef = collection(db, 'users', userId, 'analytics');
      let q = query(analyticsRef, orderBy('fetchedAt', 'desc'), limit(100));
      
      if (platform) {
        q = query(analyticsRef, where('platform', '==', platform), orderBy('fetchedAt', 'desc'), limit(50));
      }
      
      const snapshot = await getDocs(q);
      const metrics: AnalyticsMetrics[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        metrics.push(data as AnalyticsMetrics);
      });
      
      console.log(`📊 Retrieved ${metrics.length} cached analytics records`);
      return metrics;
    } catch (error) {
      console.error('Error fetching cached analytics:', error);
      return [];
    }
  }

  // Clear old analytics cache
  static async clearOldAnalytics(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const { collection, getDocs, query, where, deleteDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const analyticsRef = collection(db, 'users', userId, 'analytics');
      const q = query(analyticsRef, where('fetchedAt', '<', Timestamp.fromDate(cutoffDate)));
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`🗑️ Cleared ${snapshot.docs.length} old analytics records`);
    } catch (error) {
      console.error('Error clearing old analytics:', error);
    }
  }
}
