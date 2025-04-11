
# Supabase Storage Integration Guide

This guide explains how to set up and use Supabase Storage for image uploads in your application.

## Prerequisites

1. A Supabase project (already connected)
2. The `question-images` bucket created in Supabase Storage

## Setup Steps

### 1. Create Storage Bucket

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard/project/gjhculqiipzmnezvbxeq)
2. Navigate to "Storage" in the left sidebar
3. Click "Create bucket"
4. Enter the name `question-images`
5. Choose your bucket type (public or private)
   - For this application, we recommend public bucket as we need to display images

### 2. Configure Storage Permissions

By default, your bucket might be restricted. You need to set up proper Row Level Security (RLS) policies to allow uploads and downloads.

1. Go to "Storage" in the Supabase dashboard
2. Select the `question-images` bucket
3. Click on "Policies" tab
4. Add these policies:

For anonymous uploads (if needed):
```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'question-images');
```

For authenticated uploads:
```sql
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');
```

For public read access:
```sql
-- Allow public downloads
CREATE POLICY "Allow public to read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');
```

## Using the Image Upload Component

The application includes two ways to upload images:

1. **ImageUpload Component**: A fully-featured component with preview and error handling
2. **useImageUpload Hook**: A hook that provides image upload functionality to any component

### Example Using Component

```jsx
import ImageUpload from '@/components/ImageUpload';

function MyComponent() {
  const handleImageUploaded = (url) => {
    console.log('Image URL:', url);
    // Use the URL as needed
  };

  return (
    <ImageUpload 
      onImageUploaded={handleImageUploaded}
      label="Upload question image"
      bucketName="question-images"
    />
  );
}
```

### Example Using Hook

```jsx
import { useImageUpload } from '@/hooks/useImageUpload';

function MyComponent() {
  const { imageUrl, isUploading, error, uploadFile, resetImage } = useImageUpload('question-images');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {isUploading && <p>Uploading...</p>}
      {error && <p>Error: {error}</p>}
      {imageUrl && (
        <div>
          <img src={imageUrl} alt="Uploaded" />
          <p>URL: {imageUrl}</p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

If you encounter issues with image uploads:

1. Check browser console for errors
2. Verify that your Supabase credentials are correct
3. Check that the storage bucket exists and has the correct permissions
4. Ensure that your RLS policies are correctly configured
5. Verify that the file size and type are allowed

## Deployment Considerations

When deploying your application:

1. **Environment Variables**: Make sure your Supabase URL and anon key are configured correctly in production
2. **CORS Configuration**: Ensure that your production domain is allowed in Supabase's CORS settings
3. **File Size Limits**: Consider setting limits on file sizes to prevent abuse
4. **File Types**: Restrict file types to prevent security issues
