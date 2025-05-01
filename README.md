
# DECODE CO-A QUIZEE

A comprehensive quiz management system for teachers and students built with React, TypeScript, Tailwind CSS, and Supabase.

## Documentation Index

For detailed information about the application, please refer to:

1. [ER Diagram](./ER_DIAGRAM.md) - Database structure and relationships
2. [Data Flow Diagram](./DFD_DIAGRAM.md) - System data flow visualization
3. [Database Configuration](./DATABASE_CONFIGURATION.md) - Database setup and policies
4. [Git Workflow](./GIT_WORKFLOW.md) - Development process and guidelines
5. [Application Flow](./APPLICATION_FLOW.md) - Component interactions and data flow

## Features

- **Authentication**: Secure login and registration for teachers and students
- **Question Bank**: Teachers can create, edit, and manage questions with image support
- **Quiz Creation**: Teachers can create quizzes from their question bank
- **Performance Analytics**: Teachers can view student performance
- **Quiz Taking**: Students can take quizzes and get instant results
- **Feedback System**: Students can provide feedback on quizzes
- **Image Upload**: Support for image uploads in questions using Supabase Storage

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase credentials in `src/lib/env.ts`
4. Start the development server: `npm run dev`

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: React Query & Context API
- **Form Handling**: React Hook Form
- **Data Processing**: PapaParse for CSV import/export
- **Image Upload**: Supabase Storage integration

## Application Structure

```
src/
├── components/         # Reusable UI components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configuration
├── pages/              # Application pages
│   ├── teacher/        # Teacher-specific pages
│   └── student/        # Student-specific pages
├── integrations/       # External service integrations
└── utils/              # Helper functions
```

## Performance Monitoring

The application includes performance monitoring for:

- Component rendering times
- API request durations
- Image loading performance
- Critical user flows

## Contributing

Please see the [Git Workflow](./GIT_WORKFLOW.md) document for guidelines on contributing to the project.
