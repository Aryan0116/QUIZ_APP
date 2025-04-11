
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Please add them to src/lib/env.ts');
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          user_type: 'teacher' | 'student';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          user_type: 'teacher' | 'student';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          user_type?: 'teacher' | 'student';
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          text: string;
          options: string[];
          correct_answer: string;
          subject: string;
          chapter: string;
          co: string;
          difficulty_level: 'easy' | 'medium' | 'hard';
          image_url?: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          options: string[];
          correct_answer: string;
          subject: string;
          chapter: string;
          co: string;
          difficulty_level: 'easy' | 'medium' | 'hard';
          image_url?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          options?: string[];
          correct_answer?: string;
          subject?: string;
          chapter?: string;
          co?: string;
          difficulty_level?: 'easy' | 'medium' | 'hard';
          image_url?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          title: string;
          teacher_id: string;
          questions: {
            id: string;
            marks: number;
          }[];
          time_limit: number;
          total_marks: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          teacher_id: string;
          questions: {
            id: string;
            marks: number;
          }[];
          time_limit: number;
          total_marks: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          teacher_id?: string;
          questions?: {
            id: string;
            marks: number;
          }[];
          time_limit?: number;
          total_marks?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      student_results: {
        Row: {
          id: string;
          student_id: string;
          quiz_id: string;
          score: number;
          total_marks: number;
          answers: {
            question_id: string;
            answer: string;
            correct: boolean;
          }[];
          remarks?: string;
          feedback?: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          quiz_id: string;
          score: number;
          total_marks: number;
          answers: {
            question_id: string;
            answer: string;
            correct: boolean;
          }[];
          remarks?: string;
          feedback?: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          quiz_id?: string;
          score?: number;
          total_marks?: number;
          answers?: {
            question_id: string;
            answer: string;
            correct: boolean;
          }[];
          remarks?: string;
          feedback?: string;
          submitted_at?: string;
        };
      };
    };
  };
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: Error) => {
  console.error('Supabase error:', error);
  return { error: error.message || 'An unexpected error occurred' };
};

// Auth-related helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return { user: null, error: handleSupabaseError(error) };
  return { user, error: null };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return { profile: null, error: handleSupabaseError(error) };
  return { profile: data, error: null };
};

// Image upload functionality
export const uploadImage = async (file: File, bucketName: string = 'question-images'): Promise<string | undefined> => {
  try {
    if (!file) throw new Error('No file selected');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = fileName;
    
    // Log the upload attempt
    console.log(`Attempting to upload ${fileName} to ${bucketName}`);
    
    // Get session to check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User must be authenticated to upload files');
    }

    const { error: uploadError, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }
    
    console.log('Upload successful, getting public URL');
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error; // Rethrow the error so we can handle it properly
  }
};
