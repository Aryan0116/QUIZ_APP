
-- Create tables
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  user_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

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

-- Enable Row Level Security for all tables
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes
CREATE POLICY "Teachers can view their own quizzes" ON public.quizzes
  FOR SELECT
  USING (auth.uid() = teacher_id);
  
CREATE POLICY "Teachers can create quizzes" ON public.quizzes
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);
  
CREATE POLICY "Teachers can update their own quizzes" ON public.quizzes
  FOR UPDATE
  USING (auth.uid() = teacher_id);
  
CREATE POLICY "Teachers can delete their own quizzes" ON public.quizzes
  FOR DELETE
  USING (auth.uid() = teacher_id);
  
CREATE POLICY "Students can view active quizzes" ON public.quizzes
  FOR SELECT
  USING (active = true);

-- Create policies for student_results
CREATE POLICY "Students can view their own results" ON public.student_results
  FOR SELECT
  USING (auth.uid() = student_id);
  
CREATE POLICY "Students can create results" ON public.student_results
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);
  
CREATE POLICY "Students can update their own results" ON public.student_results
  FOR UPDATE
  USING (auth.uid() = student_id);
  
CREATE POLICY "Teachers can view all results" ON public.student_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_results.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );
  
CREATE POLICY "Teachers can update student results" ON public.student_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = student_results.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );

-- Create policies for questions
CREATE POLICY "Teachers can view all questions" ON public.questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'teacher'));
  
CREATE POLICY "Teachers can create questions" ON public.questions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'teacher'));
  
CREATE POLICY "Teachers can update their own questions" ON public.questions
  FOR UPDATE
  USING (created_by = auth.uid());
  
CREATE POLICY "Teachers can delete their own questions" ON public.questions
  FOR DELETE
  USING (created_by = auth.uid());
  
CREATE POLICY "Students can view all questions" ON public.questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.user_type = 'student'));

-- Create policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);
  
CREATE POLICY "Public read access to users" ON public.users
  FOR SELECT
  USING (true);

-- Critical fix: Add an insert policy for users to allow profile creation during registration
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create storage buckets (if needed)
-- IMPORTANT: Run this in the SQL Editor in Supabase
INSERT INTO storage.buckets (id, name) VALUES ('question-images', 'Question Images')
ON CONFLICT DO NOTHING;

-- Set storage bucket public access
UPDATE storage.buckets SET public = true WHERE id = 'question-images';

-- Create a policy to allow authenticated users to upload to the question-images bucket
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');

-- Create a policy to allow public access to read images
CREATE POLICY "Allow public to read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');
