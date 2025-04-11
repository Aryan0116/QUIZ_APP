
import { useState } from 'react';
import { uploadImage } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Helper function to track performance
const trackPerformance = async (operationName: string, operation: () => Promise<any>) => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    console.log(`⏱️ ${operationName} took ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`⏱️ ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms`);
    throw error;
  }
};

export const useImageUpload = (bucketName: string = 'question-images') => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    setError(null);
    
    try {
      console.log("Hook: Uploading file to", bucketName);
      
      const url = await trackPerformance('uploadImage', async () => {
        return await uploadImage(file, bucketName);
      });
      
      console.log("Hook: Upload successful, URL:", url);
      setImageUrl(url);
      
      toast({
        title: 'Upload successful',
        description: 'Image has been uploaded successfully',
        variant: 'success'
      });
      
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error("Hook upload error:", errorMessage);
      
      // Only show toast if we don't already have one with the same error
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const resetImage = () => {
    setImageUrl(null);
    setError(null);
  };

  return {
    imageUrl,
    isUploading,
    error,
    uploadFile,
    resetImage,
    setImageUrl,
  };
};
