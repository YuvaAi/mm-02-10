import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { 
  getPublishedPosts, 
  getCredentialsMap, 
  fetchFacebookMetrics, 
  fetchInstagramMetrics, 
  fetchAllPlatformMetrics,
  AnalyticsMetrics,
  generateTimeSeriesData,
  generatePlatformComparison,
  getTrendingPosts,
  getPerformanceSpikes,
  TimeSeriesData,
  PlatformComparison,
  TrendingPost
} from '../api/analytics';
import { AnalyticsService } from '../services/analyticsService';
import GlassPanel from './GlassPanel';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  MousePointer, 
  BarChart3, 
  Zap,
  Target,
  Calendar,
  Award,
  TrendingDown,
  Activity
} from 'lucide-react';

const AnalyticsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const run = async () => {
      if (!currentUser) {
        console.log('🔍 Analytics: No current user');
        return;
      }
      
      console.log('🔍 Analytics: Starting data fetch for user:', currentUser.uid);
      setLoading(true);
      setError(null);
      
      try {
        // First, try to get cached analytics data
        console.log('🔍 Analytics: Checking for cached analytics data...');
        const cachedMetrics = await AnalyticsService.getCachedAnalytics(currentUser.uid);
        
        if (cachedMetrics.length > 0) {
          console.log('🔍 Analytics: Found cached metrics:', cachedMetrics.length);
          setMetrics(cachedMetrics);
          setDebugInfo({
            postsCount: cachedMetrics.length,
            credentialsCount: 0,
            posts: cachedMetrics.slice(0, 3),
            credentials: [],
            source: 'cache'
          });
        }

        // Fetch published posts and credentials
        console.log('🔍 Analytics: Fetching published posts and credentials...');
        const [posts, creds] = await Promise.all([
          getPublishedPosts(currentUser.uid),
          getCredentialsMap(currentUser.uid),
        ]);

        console.log('🔍 Analytics: Published posts found:', posts.length);
        console.log('🔍 Analytics: Credentials found:', Object.keys(creds));

        // Store debug info
        setDebugInfo({
          postsCount: posts.length,
          credentialsCount: Object.keys(creds).length,
          posts: posts.slice(0, 3), // First 3 posts for debugging
          credentials: Object.keys(creds),
          source: cachedMetrics.length > 0 ? 'cache' : 'live'
        });

        if (posts.length === 0) {
          console.log('🔍 Analytics: No published posts found');
          if (cachedMetrics.length === 0) {
            setMetrics([]);
          }
          setLoading(false);
          return;
        }

        // Process all posts to get metrics using the enhanced function
        console.log('🔍 Analytics: Processing posts for live metrics...');
        const results = await fetchAllPlatformMetrics(currentUser.uid, posts, creds);
        console.log('🔍 Analytics: Final metrics results:', results.length, 'valid metrics');
        console.log('🔍 Analytics: Sample metrics:', results.slice(0, 2));
        
        // Use live data if we got results, otherwise keep cached data
        if (results.length > 0) {
          setMetrics(results);
          console.log('🔍 Analytics: Using live metrics data');
        } else if (cachedMetrics.length > 0) {
          console.log('🔍 Analytics: Using cached metrics data');
        } else {
          console.log('🔍 Analytics: No metrics data available');
        }
        
        // Clean up old cached data
        await AnalyticsService.clearOldAnalytics(currentUser.uid, 30);
        
      } catch (e: unknown) {
        const err = e as Error;
        console.error('🔍 Analytics: Main error:', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentUser]);

  // Enhanced data processing with error handling
  const timeSeriesData = useMemo(() => {
    try {
      const result = generateTimeSeriesData(metrics);
      console.log('🔍 Analytics: Time series data generated:', result.length, 'entries');
      return result;
    } catch (error) {
      console.error('🔍 Analytics: Error generating time series data:', error);
      return [];
    }
  }, [metrics]);

  const platformComparison = useMemo(() => {
    try {
      const result = generatePlatformComparison(metrics);
      console.log('🔍 Analytics: Platform comparison generated:', result);
      return result;
    } catch (error) {
      console.error('🔍 Analytics: Error generating platform comparison:', error);
      return [];
    }
  }, [metrics]);

  const trendingPosts = useMemo(() => {
    try {
      const result = getTrendingPosts(metrics);
      console.log('🔍 Analytics: Trending posts generated:', result.length);
      return result;
    } catch (error) {
      console.error('🔍 Analytics: Error generating trending posts:', error);
      return [];
    }
  }, [metrics]);

  const performanceSpikes = useMemo(() => {
    try {
      const result = getPerformanceSpikes(metrics);
      console.log('🔍 Analytics: Performance spikes generated:', result.length);
      return result;
    } catch (error) {
      console.error('🔍 Analytics: Error generating performance spikes:', error);
      return [];
    }
  }, [metrics]);

  // Filter data by time range
  const filteredTimeSeriesData = useMemo(() => {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filtered = timeSeriesData.filter(item => new Date(item.date) >= cutoffDate);
      console.log('🔍 Analytics: Filtered time series data:', filtered.length, 'entries');
      return filtered;
    } catch (error) {
      console.error('🔍 Analytics: Error filtering time series data:', error);
      return timeSeriesData;
    }
  }, [timeSeriesData, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" data-color={entry.color}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Refresh analytics data
  const handleRefresh = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Refreshing analytics data...');
      
      // Fetch fresh data
      const [posts, creds] = await Promise.all([
        getPublishedPosts(currentUser.uid),
        getCredentialsMap(currentUser.uid),
      ]);
      
      if (posts.length === 0) {
        setMetrics([]);
        setLoading(false);
        return;
      }
      
      const results = await fetchAllPlatformMetrics(currentUser.uid, posts, creds);
      setMetrics(results);
      
      console.log('✅ Analytics data refreshed:', results.length, 'metrics');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      setError('Failed to refresh analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Debug panel for development
  const DebugPanel = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-yellow-800">🔍 Debug Information</h4>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-3 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      <div className="text-sm text-yellow-700 space-y-1">
        <p>Data source: <span className="font-medium">{debugInfo.source || 'unknown'}</span></p>
        <p>Posts found: {debugInfo.postsCount || 0}</p>
        <p>Credentials found: {debugInfo.credentialsCount || 0}</p>
        <p>Metrics processed: {metrics.length}</p>
        <p>Time series entries: {timeSeriesData.length}</p>
        <p>Platform comparisons: {platformComparison.length}</p>
        <p>Trending posts: {trendingPosts.length}</p>
        <p>Performance spikes: {performanceSpikes.length}</p>
        
        {metrics.length > 0 && (
          <div className="mt-2">
            <p className="font-medium">Total Metrics:</p>
            <p>• Total Impressions: {metrics.reduce((sum, m) => sum + m.impressions, 0).toLocaleString()}</p>
            <p>• Total Reach: {metrics.reduce((sum, m) => sum + m.reach, 0).toLocaleString()}</p>
            <p>• Total Engagement: {metrics.reduce((sum, m) => sum + m.engagement, 0).toLocaleString()}</p>
          </div>
        )}
        
        {debugInfo.posts && debugInfo.posts.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">Sample Posts</summary>
            <pre className="text-xs mt-1 bg-yellow-100 p-2 rounded max-h-32 overflow-auto">
              {JSON.stringify(debugInfo.posts, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sign in to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-600">{error}</p>
          <DebugPanel />
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No analytics yet. Publish a post to see insights.</p>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-main animate-gradient min-h-screen">
      {/* Debug Panel */}
      <DebugPanel />

      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text text-glow">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                timeRange === range
                  ? 'bg-gradient-button text-primary-contrast shadow-purple'
                  : 'bg-bg-alt text-text-secondary hover:bg-bg-secondary border border-border hover:shadow-purple'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassPanel variant="purple" className="animate-slide-in-left">
          <div className="glass-panel-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Total Impressions</p>
              <p className="text-3xl font-bold">
                {metrics.reduce((sum, m) => sum + m.impressions, 0).toLocaleString()}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {filteredTimeSeriesData.length > 1 && (
                  <span className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{((filteredTimeSeriesData[filteredTimeSeriesData.length - 1]?.impressions || 0) / 
                       (filteredTimeSeriesData[0]?.impressions || 1) * 100 - 100).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            <Eye className="w-10 h-10 text-blue-200" />
          </div>
          </div>
        </GlassPanel>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Reach</p>
              <p className="text-3xl font-bold">
                {metrics.reduce((sum, m) => sum + m.reach, 0).toLocaleString()}
              </p>
              <p className="text-green-200 text-xs mt-1">
                {filteredTimeSeriesData.length > 1 && (
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    +{((filteredTimeSeriesData[filteredTimeSeriesData.length - 1]?.reach || 0) / 
                       (filteredTimeSeriesData[0]?.reach || 1) * 100 - 100).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Engagement</p>
              <p className="text-3xl font-bold">
                {metrics.reduce((sum, m) => sum + m.engagement, 0).toLocaleString()}
              </p>
              <p className="text-purple-200 text-xs mt-1">
                {filteredTimeSeriesData.length > 1 && (
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    +{((filteredTimeSeriesData[filteredTimeSeriesData.length - 1]?.engagement || 0) / 
                       (filteredTimeSeriesData[0]?.engagement || 1) * 100 - 100).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            <Heart className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Avg Engagement Rate</p>
              <p className="text-3xl font-bold">
                {(metrics.reduce((sum, m) => sum + (m.reach > 0 ? (m.engagement / m.reach) * 100 : 0), 0) / metrics.length).toFixed(1)}%
              </p>
              <p className="text-orange-200 text-xs mt-1">
                <span className="flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  {metrics.length} posts analyzed
                </span>
              </p>
            </div>
            <Target className="w-10 h-10 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Performance Trends with Spikes */}
      {filteredTimeSeriesData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-indigo-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Performance Trends & Spikes</h3>
            </div>
            {performanceSpikes.length > 0 && (
              <div className="flex items-center text-green-600">
                <Zap className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{performanceSpikes.length} performance spikes detected</span>
              </div>
            )}
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredTimeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fill="url(#impressionsGradient)" strokeWidth={3} name="Impressions" />
                <Area type="monotone" dataKey="reach" stroke="#10b981" fill="url(#reachGradient)" strokeWidth={3} name="Reach" />
                <Line type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', strokeWidth: 3, r: 6 }} name="Engagement" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Platform Performance Comparison */}
      {platformComparison.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Platform Performance</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="impressionsBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="reachBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="engagementBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="platform" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="totalImpressions" fill="url(#impressionsBar)" radius={[4, 4, 0, 0]} name="Impressions" />
                  <Bar dataKey="totalReach" fill="url(#reachBar)" radius={[4, 4, 0, 0]} name="Reach" />
                  <Bar dataKey="totalEngagement" fill="url(#engagementBar)" radius={[4, 4, 0, 0]} name="Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-purple-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Engagement Rate by Platform</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                 <Pie
                   data={platformComparison.map((entry, index) => ({
                     name: entry.platform,
                     value: entry.avgEngagementRate,
                     fill: COLORS[index % COLORS.length]
                   }))}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={120}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {platformComparison.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
                 <Legend />
               </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Trending Posts */}
      {trendingPosts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Top Performing Posts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPosts.map((post, index) => (
              <div key={post.postId} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase">{post.platform}</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span className="text-xs font-medium">#{index + 1}</span>
                  </div>
                </div>
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {post.content || 'No content available'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{post.impressions.toLocaleString()}</p>
                    <p className="text-gray-500">Impressions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{post.engagementRate.toFixed(1)}%</p>
                    <p className="text-gray-500">Engagement</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Funnel */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Activity className="w-6 h-6 text-indigo-500 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Engagement Funnel</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={[
                  {
                    name: 'Impressions',
                    value: metrics.reduce((sum, m) => sum + m.impressions, 0),
                    fill: '#3b82f6'
                  },
                  {
                    name: 'Reach',
                    value: metrics.reduce((sum, m) => sum + m.reach, 0),
                    fill: '#10b981'
                  },
                  {
                    name: 'Engagement',
                    value: metrics.reduce((sum, m) => sum + m.engagement, 0),
                    fill: '#8b5cf6'
                  },
                  {
                    name: 'Likes',
                    value: metrics.reduce((sum, m) => sum + m.likes, 0),
                    fill: '#ef4444'
                  },
                  {
                    name: 'Comments',
                    value: metrics.reduce((sum, m) => sum + m.comments, 0),
                    fill: '#f59e0b'
                  }
                ]}
                isAnimationActive
              />
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;


