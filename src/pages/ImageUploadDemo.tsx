
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from '@/components/ImageUpload';
import { useImageUpload } from '@/hooks/useImageUpload';

const ImageUploadDemo = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // Example using the component directly
  const handleImageUploaded = (url: string) => {
    setUploadedUrl(url);
    console.log('Image uploaded with URL:', url);
  };
  
  // Example using the hook
  const { imageUrl, isUploading, error, uploadFile } = useImageUpload('question-images');
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Image Upload Examples</h1>
      
      <Tabs defaultValue="component">
        <TabsList className="mb-4">
          <TabsTrigger value="component">Using Component</TabsTrigger>
          <TabsTrigger value="hook">Using Hook</TabsTrigger>
        </TabsList>
        
        <TabsContent value="component">
          <Card>
            <CardHeader>
              <CardTitle>Image Upload Component</CardTitle>
              <CardDescription>
                Full-featured image upload component with preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                label="Upload Image Example"
                existingImageUrl={uploadedUrl || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hook">
          <Card>
            <CardHeader>
              <CardTitle>Custom Upload with Hook</CardTitle>
              <CardDescription>
                Build your own upload UI using the useImageUpload hook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*" 
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100"
                />
                
                {isUploading && <div>Uploading...</div>}
                {error && <div className="text-red-500">Error: {error}</div>}
                
                {imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Uploaded Image:</p>
                    <img 
                      src={imageUrl} 
                      alt="Uploaded with hook" 
                      className="max-w-full h-auto max-h-60 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1 break-all">{imageUrl}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageUploadDemo;
