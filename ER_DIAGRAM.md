
# DECODE CO-A QUIZEE: Entity Relationship Diagram

## Overview

This document provides a comprehensive overview of the database structure for the DECODE CO-A QUIZEE application, illustrating the relationships between different entities in the system.

## Entity Relationship Diagram

```
+---------------+       +----------------+       +---------------+
|    users      |       |   questions    |       |    quizzes    |
+---------------+       +----------------+       +---------------+
| id (PK)       |<------| created_by (FK)|       | id (PK)       |
| email         |       | id (PK)        |       | title         |
| name          |       | text           |<------| questions     |
| user_type     |       | options        |       | teacher_id (FK)
| created_at    |       | correct_answer |       | time_limit    |
+-------+-------+       | subject        |       | total_marks   |
        |               | chapter        |       | active        |
        |               | co             |       | created_at    |
        |               | difficulty_level       +-------+-------+
        |               | image_url      |               |
        |               | created_at     |               |
        |               +----------------+               |
        |                                                |
        |                                                |
        |                                                |
+-------v-------+                                +-------v-------+
| student_results|                               |               |
+---------------+                                |               |
| id (PK)       |                                |               |
| student_id (FK)|<------------------------------+               |
| quiz_id (FK)  |<------------------------------+               |
| score         |
| total_marks   |
| answers       |
| remarks       |
| feedback      |
| submitted_at  |
+---------------+
```

## Entities Description

### users
- **id (uuid, PRIMARY KEY)**: User identifier, linked to Supabase Auth
- **email (text)**: User's email address
- **name (text)**: User's full name
- **user_type (text)**: Either 'teacher' or 'student'
- **created_at (timestamp)**: When the user was created

### questions
- **id (uuid, PRIMARY KEY)**: Question identifier
- **text (text)**: The question text
- **options (jsonb)**: Array of possible answers
- **correct_answer (text)**: The correct answer
- **subject (text)**: Subject category
- **chapter (text)**: Chapter or unit
- **co (text)**: Course objective
- **difficulty_level (text)**: 'easy', 'medium', or 'hard'
- **image_url (text)**: Optional URL to an image
- **created_by (uuid)**: Foreign key to users(id)
- **created_at (timestamp)**: When the question was created

### quizzes
- **id (uuid, PRIMARY KEY)**: Quiz identifier
- **title (text)**: Quiz title
- **teacher_id (uuid)**: Foreign key to users(id), CASCADE DELETE
- **questions (jsonb)**: Array of question references with marks
- **time_limit (integer)**: Time limit in minutes
- **total_marks (integer)**: Total marks for the quiz
- **active (boolean)**: Whether the quiz is active
- **created_at (timestamp)**: When the quiz was created

### student_results
- **id (uuid, PRIMARY KEY)**: Result identifier
- **student_id (uuid)**: Foreign key to users(id), CASCADE DELETE
- **quiz_id (uuid)**: Foreign key to quizzes(id), CASCADE DELETE
- **score (integer)**: Score achieved
- **total_marks (integer)**: Total possible marks
- **answers (jsonb)**: Student's answers with correctness
- **remarks (text)**: Optional teacher remarks
- **feedback (text)**: Optional student feedback
- **submitted_at (timestamp)**: When the quiz was submitted

## Relationships

1. **One-to-Many**: A teacher (user) can create multiple questions
2. **One-to-Many**: A teacher (user) can create multiple quizzes
3. **Many-to-Many**: Quizzes contain multiple questions (implemented via JSONB array)
4. **One-to-Many**: A student (user) can have multiple results
5. **One-to-Many**: A quiz can have multiple student results

## Security

The database implements Row Level Security (RLS) to ensure:

- Teachers can only access their own quizzes
- Students can only access active quizzes
- Students can only view and update their own results
- Teachers can view results for quizzes they created
