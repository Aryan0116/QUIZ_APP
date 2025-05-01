
# DECODE CO-A QUIZEE: Application Flow and Architecture

## Overview

This document provides a comprehensive overview of the DECODE CO-A QUIZEE application's flow and architecture, illustrating the interactions between components and the overall data flow.

## Application Architecture

```
+---------------------+     +---------------------+
|                     |     |                     |
|  React Frontend     |<--->|  Supabase Backend   |
|  (Component-based)  |     |  (PostgreSQL + APIs)|
|                     |     |                     |
+----------+----------+     +---------+-----------+
           |                          |
           |                          |
+----------v----------+    +----------v----------+
|                     |    |                     |
|  Client-Side State  |    |  Storage Service    |
|  (React Context)    |    |  (Image Handling)   |
|                     |    |                     |
+---------------------+    +---------------------+
```

## Component Flow

### Authentication Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|  Login UI   |---->| Auth Context|---->| Supabase    |---->| Protected   |
|  Component  |     | Provider    |     | Auth Client |     | Routes      |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
```

### Teacher Question Management Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| QuestionBank|---->| Quiz Data   |---->| Supabase    |---->| Database    |
| Component   |     | Context     |     | Client      |     |             |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
       |                                       ^
       |                                       |
       |                   +-------------+     |
       +------------------>| Image       |-----+
                           | Upload      |
                           | Component   |
                           +-------------+
```

### Quiz Creation Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| CreateQuiz  |---->| Quiz Data   |---->| Supabase    |---->| Database    |
| Component   |     | Context     |     | Client      |     |             |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
```

### Student Quiz Taking Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
| AttemptQuiz |---->| Quiz Data   |---->| Supabase    |---->| Database    |
| Component   |     | Context     |     | Client      |     |             |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
```

## Key Functions and Data Flow

### Authentication Functions

1. **registerUser**: 
   - Input: Email, password, name, user type
   - Process: Validates input, creates user in Supabase Auth, creates record in users table
   - Output: User object or error

2. **loginUser**:
   - Input: Email, password
   - Process: Authenticates with Supabase, loads user profile
   - Output: Session object or error

3. **logoutUser**:
   - Process: Terminates session with Supabase, clears local state
   - Output: Success flag or error

### Question Management Functions

1. **fetchQuestions**:
   - Input: Optional filters (subject, chapter, difficulty)
   - Process: Queries database with filters
   - Output: Array of question objects

2. **createQuestion**:
   - Input: Question data (text, options, correct answer, metadata)
   - Process: Validates data, uploads image if present, stores in database
   - Output: New question object or error

3. **updateQuestion**:
   - Input: Question ID, updated data
   - Process: Validates data, updates database record
   - Output: Updated question object or error

4. **deleteQuestion**:
   - Input: Question ID
   - Process: Removes database record, cleans up associated images
   - Output: Success flag or error

### Quiz Management Functions

1. **createQuiz**:
   - Input: Quiz data (title, questions array, time limit, etc.)
   - Process: Validates data, stores in database
   - Output: New quiz object or error

2. **fetchActiveQuizzes**:
   - Input: Optional filters
   - Process: Queries database for active quizzes
   - Output: Array of quiz objects

3. **toggleQuizActive**:
   - Input: Quiz ID, active status
   - Process: Updates quiz active status
   - Output: Updated quiz object or error

### Quiz Taking Functions

1. **startQuizAttempt**:
   - Input: Quiz ID
   - Process: Loads quiz data, initializes timer
   - Output: Quiz with questions for attempt

2. **submitQuizAnswers**:
   - Input: Quiz ID, answers array
   - Process: Calculates score, stores results
   - Output: Result summary or error

3. **fetchStudentResults**:
   - Input: Student ID (or derived from auth)
   - Process: Queries database for student's quiz results
   - Output: Array of result objects

## State Management

The application uses a combination of:

1. **React Context API**: For global state management
   - SupabaseAuthContext: Handles user authentication state
   - SupabaseQuizDataContext: Manages quiz data and operations

2. **React Query**: For server state management
   - Fetching and caching data from Supabase
   - Managing loading, error, and success states

3. **Local Component State**: For UI-specific state
   - Form inputs
   - UI toggles and modals
   - Component-specific loading states

## Performance Optimization Techniques

1. **Query Caching**: Using React Query to minimize redundant network requests
2. **Pagination**: Implementing cursor-based pagination for large data sets
3. **Image Optimization**: Efficient loading and caching of question images
4. **Memoization**: Using React.memo() and useMemo() for expensive operations
5. **Code Splitting**: Lazy loading components for better initial load times

## Error Handling Strategy

1. **Toast Notifications**: User-friendly error messages via toast system
2. **Form Validation**: Client-side validation using React Hook Form and Zod
3. **API Error Handling**: Consistent error handling patterns in API requests
4. **Fallback UI**: Graceful degradation when components fail to load

## Logging and Monitoring

Performance metrics are logged to the console for key operations:
1. Component render times
2. API request durations
3. Quiz submission times
4. Image load performance