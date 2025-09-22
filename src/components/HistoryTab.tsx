import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Share2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Facebook,
  Instagram,
  Linkedin,
  Download,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import GlassPanel from './GlassPanel';

interface PostHistory {
  id: string;
  content: string;
  imageUrl?: string;
  imageDescription?: string;
  category: string;
  prompt: string;
  status: 'published' | 'draft';
  platform?: string;
  postId?: string;
  createdAt: any;
  updatedAt?: any;
  publishedAt?: any;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
}

const HistoryTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<PostHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'facebook' | 'instagram' | 'linkedin'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'platform'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPosts();
  }, [currentUser]);

  const loadPosts = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all posts (both published and drafts)
      const postsRef = collection(db, 'users', currentUser.uid, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const postsData: PostHistory[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content || '',
          imageUrl: data.imageUrl || '',
          imageDescription: data.imageDescription || '',
          category: data.category || 'General',
          prompt: data.prompt || '',
          status: data.status || 'draft',
          platform: data.platform || '',
          postId: data.postId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          publishedAt: data.publishedAt,
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0,
          impressions: data.impressions || 0,
        };
      });

      setPosts(postsData);
      console.log('📋 History: Loaded', postsData.length, 'posts');
    } catch (err) {
      console.error('📋 History: Error loading posts:', err);
      setError('Failed to load post history');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.prompt.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

      // Platform filter
      const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });

    // Sort posts
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() - 
                      new Date(a.createdAt?.toDate?.() || a.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'platform':
          comparison = (a.platform || '').localeCompare(b.platform || '');
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [posts, searchTerm, statusFilter, platformFilter, sortBy, sortOrder]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-purple-600" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      default:
        return <Share2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-alt text-success border border-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-alt text-warning border border-warning">
        <Clock className="w-3 h-3 mr-1" />
        Draft
      </span>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sign in to view post history.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <span className="text-gray-600">Loading post history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-main animate-gradient min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text text-glow">Post History</h2>
          <p className="text-text-secondary mt-1">
            {filteredAndSortedPosts.length} of {posts.length} posts
          </p>
        </div>
        <button
          onClick={loadPosts}
          className="px-4 py-2 bg-gradient-button text-primary-contrast rounded-lg hover:bg-gradient-reverse transition-all duration-250 shadow-purple hover:shadow-purple-strong"
        >
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Filter by platform"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setSortBy(sort as any);
              setSortOrder(order as any);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            aria-label="Sort posts"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="status-asc">Status A-Z</option>
            <option value="platform-asc">Platform A-Z</option>
          </select>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600">
            {posts.length === 0 
              ? "You haven't created any posts yet. Start by generating some content!"
              : "No posts match your current filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Post Image */}
              {post.imageUrl && (
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(post.content)}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                      title="Copy content"
                    >
                      <Copy className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => downloadImage(post.imageUrl!, `post-${post.id}.jpg`)}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                      title="Download image"
                    >
                      <Download className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Post Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {post.platform && getPlatformIcon(post.platform)}
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {post.platform || 'General'}
                    </span>
                  </div>
                  {getStatusBadge(post.status)}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <p className="text-gray-900 text-sm line-clamp-3 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(post.createdAt)}
                  </div>
                </div>

                {/* Category and Prompt */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 mr-2">Category:</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  {post.prompt && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Prompt:</span>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {post.prompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Analytics (for published posts) */}
                {post.status === 'published' && (post.likes || post.comments || post.shares || post.impressions) && (
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {post.impressions && (
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{post.impressions.toLocaleString()}</p>
                          <p className="text-gray-500">Impressions</p>
                        </div>
                      )}
                      {post.likes && (
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{post.likes.toLocaleString()}</p>
                          <p className="text-gray-500">Likes</p>
                        </div>
                      )}
                      {post.comments && (
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{post.comments.toLocaleString()}</p>
                          <p className="text-gray-500">Comments</p>
                        </div>
                      )}
                      {post.shares && (
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{post.shares.toLocaleString()}</p>
                          <p className="text-gray-500">Shares</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(post.content)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Copy Content
                      </button>
                      {post.imageUrl && (
                        <button
                          onClick={() => downloadImage(post.imageUrl!, `post-${post.id}.jpg`)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Download Image
                        </button>
                      )}
                    </div>
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600"
                      aria-label="More options"
                      title="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
