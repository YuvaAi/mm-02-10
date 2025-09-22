// Image processing utilities for Instagram compatibility
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';

// Convert file to JPG format for Instagram compatibility
export async function convertToJPG(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx?.drawImage(img, 0, 0);
      
      // Convert to JPG with high quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const jpgFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(jpgFile);
          } else {
            reject(new Error('Failed to convert image to JPG'));
          }
        },
        'image/jpeg',
        0.95 // High quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Upload file to Firebase Storage and get public URL
export async function uploadToFirebaseStorage(file: File, userId: string): Promise<string> {
  try {
    console.log('📤 Uploading file to Firebase Storage:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: userId
    });

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `instagram-uploads/${userId}/${timestamp}-${file.name}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ File uploaded to Firebase Storage:', snapshot.metadata.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Firebase Storage download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Failed to upload file to Firebase Storage:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Process file for Instagram: convert to JPG and upload to Firebase
export async function processFileForInstagram(file: File, userId: string): Promise<string> {
  try {
    console.log('🔄 Processing file for Instagram:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Check file size (Instagram limit is 8MB)
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('File too large for Instagram. Maximum size is 8MB.');
    }

    // Check if file is already a supported format
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
    let processedFile = file;

    if (!supportedTypes.includes(file.type)) {
      console.log('🔄 Converting file to JPG for Instagram compatibility...');
      processedFile = await convertToJPG(file);
    }

    // Upload to Firebase Storage
    const publicUrl = await uploadToFirebaseStorage(processedFile, userId);
    
    console.log('✅ File processed successfully for Instagram:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Failed to process file for Instagram:', error);
    throw error;
  }
}

// Validate file for Instagram requirements
export function validateInstagramFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
  const supportedVideoTypes = ['video/mp4'];
  const allSupportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

  if (!allSupportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Instagram supports JPG, PNG, HEIC, WEBP images and MP4 videos.`
    };
  }

  // Check file size (8MB limit)
  if (file.size > 8 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File too large for Instagram. Maximum size is 8MB.'
    };
  }

  return { valid: true };
}
