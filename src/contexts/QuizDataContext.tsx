
// Update the import to use SupabaseQuizDataContext instead of QuizDataContext
import { useSupabaseQuizData } from './SupabaseQuizDataContext';

// Export the hook for backward compatibility
export const useQuizData = useSupabaseQuizData;
