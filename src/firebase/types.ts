export interface ContentPost {
  id?: string;
  generatedContent: string;
  generatedImageUrl?: string;
  imageDescription?: string;
  category?: string;
  prompt?: string;
  status?: 'draft' | 'published' | 'failed';
  postId?: string;
  platform?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCredentials {
  platform: string;
  accessToken: string;
  pageId?: string;
  expiryDate?: string;
  type: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Instagram specific fields
  instagramUserId?: string;
  // LinkedIn specific fields
  linkedInUserId?: string;
}