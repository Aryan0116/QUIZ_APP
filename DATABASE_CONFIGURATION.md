
# DECODE CO-A QUIZEE: Database Configuration Guide

## Overview

This document provides detailed information about the database configuration for the DECODE CO-A QUIZEE application, including table structures, security policies, and initialization scripts.

## Database Engine

The application uses PostgreSQL via Supabase as the database backend, leveraging Supabase's built-in authentication and storage capabilities.

## Schema Structure

### Tables

#### users
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  user_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

#### questions
```sql
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  subject text NOT NULL,
  chapter text NOT NULL,
  co text NOT NULL,
  difficulty_level text NOT NULL,
  image_url text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

#### quizzes
```sql
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  questions jsonb NOT NULL,
  time_limit integer NOT NULL,
  total_marks integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

#### student_results
```sql
CREATE TABLE public.student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_marks integer NOT NULL,
  answers jsonb NOT NULL,
  remarks text,
  feedback text,
  submitted_at timestamp with time zone DEFAULT now()
);
```

## Row Level Security (RLS) Policies

### Question Policies

```sql
-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Teachers can view all questions
CREATE POLICY "Teachers can view all questions" ON public.questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'teacher'));
  
-- Teachers can create questions
CREATE POLICY "Teachers can create questions" ON public.questions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'teacher'));
  
-- Teachers can update their own questions
CREATE POLICY "Teachers can update their own questions" ON public.questions
  FOR UPDATE
  USING (created_by = auth.uid());
  
-- Teachers can delete their own questions
CREATE POLICY "Teachers can delete their own questions" ON public.questions
  FOR DELETE
  USING (created_by = auth.uid());
  
-- Students can view all questions
CREATE POLICY "Students can view all questions" ON public.questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'student'));
```

### Quiz Policies

```sql
-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own quizzes
CREATE POLICY "Teachers can view their own quizzes" ON public.quizzes
  FOR SELECT
  USING (auth.uid() = teacher_id);
  
-- Teachers can create quizzes
CREATE POLICY "Teachers can create quizzes" ON public.quizzes
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);
  
-- Teachers can update their own quizzes
CREATE POLICY "Teachers can update their own quizzes" ON public.quizzes
  FOR UPDATE
  USING (auth.uid() = teacher_id);
  
-- Teachers can delete their own quizzes
CREATE POLICY "Teachers can delete their own quizzes" ON public.quizzes
  FOR DELETE
  USING (auth.uid() = teacher_id);
  
-- Students can view active quizzes
CREATE POLICY "Students can view active quizzes" ON public.quizzes
  FOR SELECT
  USING (active = true);
```

### Student Results Policies

```sql
-- Enable RLS
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

-- Students can view their own results
CREATE POLICY "Students can view their own results" ON public.student_results
  FOR SELECT
  USING (auth.uid() = student_id);
  
-- Students can create results
CREATE POLICY "Students can create results" ON public.student_results
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);
  
-- Students can update their own results
CREATE POLICY "Students can update their own results" ON public.student_results
  FOR UPDATE
  USING (auth.uid() = student_id);
  
-- Teachers can view all results
CREATE POLICY "Teachers can view all results" ON public.student_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_results.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );
  
-- Teachers can update student results
CREATE POLICY "Teachers can update student results" ON public.student_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_results.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );
```

### Users Policies

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);
  
-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
  
-- Public read access to users
CREATE POLICY "Public read access to users" ON public.users
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Storage Configuration

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name) VALUES ('question-images', 'Question Images')
ON CONFLICT DO NOTHING;

-- Set storage bucket public access
UPDATE storage.buckets SET public = true WHERE id = 'question-images';

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');

-- Allow public to read images
CREATE POLICY "Allow public to read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');
```

## Initialization

The database schema is initialized using the script in `database-setup.sql`. This script:

1. Creates all necessary tables
2. Enables Row Level Security for all tables
3. Establishes policies for data access
4. Sets up storage buckets for image uploads

## Indexes and Performance Considerations

For optimal performance, the following indexes are recommended:

1. Index on `questions.created_by` for faster question filtering
2. Index on `quizzes.teacher_id` for faster quiz retrieval
3. Index on `student_results.student_id` and `student_results.quiz_id` for faster result lookups

## Data Migration

When migrating data:

1. Export users first
2. Export questions second
3. Export quizzes third
4. Export student results last

This ensures proper maintenance of referential integrity.
