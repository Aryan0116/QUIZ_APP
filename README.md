
# Quiz Management System

## Overview

A comprehensive quiz management system for teachers and students built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Secure login and registration for teachers and students
- **Question Bank**: Teachers can create, edit, and manage questions with image support
- **Quiz Creation**: Teachers can create quizzes from their question bank
- **Performance Analytics**: Teachers can view student performance
- **Quiz Taking**: Students can take quizzes and get instant results
- **Feedback System**: Students can provide feedback on quizzes
- **Image Upload**: Support for image uploads in questions using Supabase Storage

## Database Structure

### Tables

#### users
```
id (uuid, PRIMARY KEY): User identifier, linked to Supabase Auth
email (text): User's email address
name (text): User's full name
user_type (text): Either 'teacher' or 'student'
created_at (timestamp): When the user was created
```

#### questions
```
id (uuid, PRIMARY KEY): Question identifier
text (text): The question text
options (jsonb): Array of possible answers
correct_answer (text): The correct answer
subject (text): Subject category
chapter (text): Chapter or unit
co (text): Course objective
difficulty_level (text): 'easy', 'medium', or 'hard'
image_url (text): Optional URL to an image
created_by (uuid): Foreign key to users(id)
created_at (timestamp): When the question was created
```

#### quizzes
```
id (uuid, PRIMARY KEY): Quiz identifier
title (text): Quiz title
teacher_id (uuid): Foreign key to users(id), CASCADE DELETE
questions (jsonb): Array of question references with marks
time_limit (integer): Time limit in minutes
total_marks (integer): Total marks for the quiz
active (boolean): Whether the quiz is active
created_at (timestamp): When the quiz was created
```

#### student_results
```
id (uuid, PRIMARY KEY): Result identifier
student_id (uuid): Foreign key to users(id), CASCADE DELETE
quiz_id (uuid): Foreign key to quizzes(id), CASCADE DELETE
score (integer): Score achieved
total_marks (integer): Total possible marks
answers (jsonb): Student's answers with correctness
remarks (text): Optional teacher remarks
feedback (text): Optional student feedback
submitted_at (timestamp): When the quiz was submitted
```

### Row Level Security (RLS) Policies

The database implements Row Level Security to ensure:

- Teachers can only access their own quizzes
- Students can only access active quizzes
- Students can only view and update their own results
- Teachers can view results for quizzes they created
- Users can view and update their own profile information
- Users can insert their profile during registration
- Public read access is provided for users table

### Storage Bucket Policies

Supabase Storage is configured with these policies for the `question-images` bucket:

- Authenticated users can upload images to the bucket
- Public access is enabled for reading images
- The bucket is set as public for universal accessibility

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: React Query & Context API
- **Form Handling**: React Hook Form
- **Data Processing**: PapaParse for CSV import/export
- **Image Upload**: Supabase Storage integration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase credentials in `src/lib/env.ts`
4. Start the development server: `npm run dev`

## Supabase Setup

This application uses Supabase for:

1. **Authentication**: Email/password authentication with user types
2. **Database**: PostgreSQL database with RLS policies
3. **Storage**: Image storage for quiz questions
4. **Real-time**: Real-time updates for quiz data (optional)

For detailed Supabase setup instructions, see:
- `database-setup.sql`: Complete database schema and RLS policies
- `supabase-storage-guide.md`: Guide for setting up storage buckets

## Key Files

- `src/lib/supabase.ts`: Core Supabase client and helper functions
- `src/components/ImageUpload.tsx`: Reusable image upload component
- `src/hooks/useImageUpload.tsx`: Custom hook for image upload functionality
- `src/pages/teacher/QuestionBank.tsx`: Question management interface
- `src/hooks/use-toast.ts`: Toast notification system
