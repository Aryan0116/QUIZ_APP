
import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadImage } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  existingImageUrl?: string;
  label?: string;
  bucketName?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  existingImageUrl,
  label = 'Upload Image',
  bucketName = 'question-images'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or GIF image',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    // First check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to upload images',
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload the file
    setIsUploading(true);
    try {
      // console.log("Starting image upload...");
      const imageUrl = await uploadImage(file, bucketName);
      // console.log("Upload result:", imageUrl);
      
      if (imageUrl) {
        onImageUploaded(imageUrl);
        toast({
          title: 'Upload successful',
          description: 'Image has been uploaded successfully'
        });
      } else {
        throw new Error('Failed to get image URL');
      }
    } catch (error) {
      // console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
      // Reset preview on error
      if (preview && !existingImageUrl) {
        URL.revokeObjectURL(preview);
        setPreview(existingImageUrl || null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    if (preview && preview !== existingImageUrl) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUploaded('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image-upload">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="image-upload"
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1"
          />
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Supported formats: JPEG, PNG, GIF (max 5MB)
        </p>
      </div>
      
      {isUploading && (
        <div className="flex items-center justify-center p-4 border rounded-md bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-sm">Uploading...</span>
          </div>
        </div>
      )}
      
      {preview && (
        <div className="border rounded-md overflow-hidden bg-muted/20">
          <div className="aspect-video relative">
            <img
              src={preview}
              alt="Preview"
              className="object-contain w-full h-full"
              onError={(e) => {
                // console.error("Image display error");
                (e.target as HTMLImageElement).style.display = 'none';
                toast({
                  title: 'Error displaying image',
                  description: 'The image could not be displayed',
                  variant: 'destructive'
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
