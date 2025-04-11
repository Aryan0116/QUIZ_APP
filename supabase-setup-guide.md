
# Supabase Manual Setup Guide

This guide provides detailed instructions for setting up Supabase manually for your Quiz Performance Pro application.

## Step 1: Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and sign up for an account.
2. Once logged in, create a new project.
3. Choose a name for your project and set a secure database password.
4. Select a region closest to your target audience.
5. Wait for your project to be created (may take a few minutes).

## Step 2: Database Setup

### Create Tables

Execute the following SQL in the Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  co TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes Table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) NOT NULL,
  questions JSONB NOT NULL,
  time_limit INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Results Table
CREATE TABLE student_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) NOT NULL,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  answers JSONB NOT NULL,
  remarks TEXT,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Set up Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Questions table policies
CREATE POLICY "Anyone can view questions" 
  ON questions FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Teachers can insert questions" 
  ON questions FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'teacher'
  ));

CREATE POLICY "Teachers can update their own questions" 
  ON questions FOR UPDATE 
  TO authenticated 
  USING (created_by = auth.uid())
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'teacher'
  ));

-- Quizzes table policies
CREATE POLICY "Anyone can view active quizzes" 
  ON quizzes FOR SELECT 
  TO authenticated 
  USING (active = true OR teacher_id = auth.uid());

CREATE POLICY "Teachers can insert quizzes" 
  ON quizzes FOR INSERT 
  TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'teacher'
  ));

CREATE POLICY "Teachers can update their own quizzes" 
  ON quizzes FOR UPDATE 
  TO authenticated 
  USING (teacher_id = auth.uid());

-- Student Results table policies
CREATE POLICY "Students can view their own results" 
  ON student_results FOR SELECT 
  TO authenticated 
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_id 
    AND quizzes.teacher_id = auth.uid()
  ));

CREATE POLICY "Students can insert their own results" 
  ON student_results FOR INSERT 
  TO authenticated 
  WITH CHECK (student_id = auth.uid());
```

## Step 3: Set Up Authentication

1. In your Supabase dashboard, go to "Authentication" > "Providers".
2. Enable Email provider (default).
3. Configure any additional providers as needed.
4. Go to "Authentication" > "URL Configuration" and add your application URL.

## Step 4: Get API Keys

1. In your Supabase dashboard, go to "Project Settings" > "API".
2. Copy the "anon" public key and URL.
3. These will be used in your application.

## Step 5: Storage Setup for Images

1. Go to "Storage" in the Supabase dashboard.
2. Create a bucket called "question-images".
3. Set the bucket to "public" (or private with proper access controls if needed).
4. Configure CORS for your domain.

## Step 6: Integration with React Application

### Install Required Packages

```bash
npm install @supabase/supabase-js
```

### Create Supabase Client

Create a file called `supabaseClient.ts` in your project with the following content:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Step 7: Update Application Code

### Update Auth Context

Replace your current AuthContext with Supabase authentication.

### Update Quiz Data Context

Modify your QuizDataContext to use Supabase for data storage and retrieval.

### Image Upload Component

Implement an image upload component that uses Supabase Storage.

### Security Considerations

1. Always use Row Level Security (RLS) policies to protect your data.
2. Never expose your service role key in client-side code.
3. Use server-side functions for sensitive operations.
4. Validate user inputs both client-side and server-side.

## Troubleshooting

### Common Issues and Solutions

1. **Authentication issues**: Make sure your redirect URLs are properly configured.
2. **CORS errors**: Configure CORS settings in Supabase dashboard.
3. **RLS blocking data**: Check your RLS policies and make sure they're correctly applied.
4. **Image upload issues**: Verify bucket permissions and file size limits.

Need more help? Refer to the [Supabase Documentation](https://supabase.com/docs) or join their [Discord community](https://discord.supabase.com).
