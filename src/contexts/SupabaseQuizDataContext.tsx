import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  subject: string;
  chapter: string;
  co: string; // Course Outcome
  difficultyLevel: 'easy' | 'medium' | 'hard';
  imageUrl?: string; // Optional image URL for the question
}

export interface Quiz {
  id: string;
  title: string;
  teacherId: string;
  teacherName: string;
  questions: string[]; // Array of question IDs
  timeLimit: number; // In minutes
  totalMarks: number;
  active: boolean;
  createdAt: Date;
}

export interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  teacherName?: string;
  score: number;
  totalMarks: number;
  answers: {
    questionId: string;
    answer: string;
    correct: boolean;
  }[];
  submittedAt: Date;
  remarks?: string;
  feedback?: string;
}

interface QuizDataContextType {
  questions: Question[];
  quizzes: Quiz[];
  studentResults: StudentResult[];
  loadingQuestions: boolean;
  loadingQuizzes: boolean;
  loadingResults: boolean;
  addQuestion: (question: Omit<Question, 'id'>) => Promise<string | undefined>;
  addBulkQuestions: (questionsToAdd: Omit<Question, 'id'>[]) => Promise<string[]>;
  updateQuestion: (id: string, question: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateQuiz: (id: string, quiz: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  addStudentResult: (result: Omit<StudentResult, 'id' | 'submittedAt'>) => Promise<string | undefined>;
  updateStudentResult: (id: string, result: Partial<StudentResult>) => Promise<void>;
  getQuizById: (id: string) => Quiz | undefined;
  getQuestionById: (id: string) => Question | undefined;
  getStudentResultById: (id: string) => StudentResult | undefined;
  getStudentResultsByQuizId: (quizId: string) => StudentResult[];
  getStudentResultsByStudentId: (studentId: string) => StudentResult[];
  getQuizzesByTeacherId: (teacherId: string) => Quiz[];
  uploadQuestionImage: (file: File) => Promise<string | undefined>;
}

const SupabaseQuizDataContext = createContext<QuizDataContextType | undefined>(undefined);

export const SupabaseQuizDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const { currentUser } = useSupabaseAuth();

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchQuestions(),
        fetchQuizzes(),
        fetchStudentResults()
      ]);
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*');

      if (error) throw error;

      const formattedQuestions: Question[] = data.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        subject: q.subject,
        chapter: q.chapter,
        co: q.co,
        difficultyLevel: q.difficulty_level,
        imageUrl: q.image_url
      }));
      
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive'
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          users:teacher_id (name)
        `);

      if (error) throw error;

      const formattedQuizzes: Quiz[] = data.map(q => ({
        id: q.id,
        title: q.title,
        teacherId: q.teacher_id,
        teacherName: q.users?.name || 'Unknown Teacher',
        questions: q.questions.map((ques: any) => ques.id),
        timeLimit: q.time_limit,
        totalMarks: q.total_marks,
        active: q.active,
        createdAt: new Date(q.created_at)
      }));
      
      setQuizzes(formattedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes',
        variant: 'destructive'
      });
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchStudentResults = async () => {
    setLoadingResults(true);
    try {
      const { data, error } = await supabase
        .from('student_results')
        .select(`
          *,
          students:student_id (name),
          quizzes:quiz_id (
            title,
            teacher_id,
            teachers:teacher_id (name)
          )
        `);

      if (error) throw error;

      // Get all unique student IDs from results
      const studentIds = [...new Set(data.map(r => r.student_id))];
      
      // Fetch all relevant student names in one query
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', studentIds);
        
      if (usersError) throw usersError;
      
      // Create a map of user IDs to names for quick lookup
      const userNameMap = new Map();
      usersData?.forEach(user => {
        userNameMap.set(user.id, user.name);
      });

      const formattedResults: StudentResult[] = data.map(r => ({
        id: r.id,
        studentId: r.student_id,
        studentName: userNameMap.get(r.student_id) || r.students?.name || 'Unknown Student',
        quizId: r.quiz_id,
        quizTitle: r.quizzes?.title || 'Unknown Quiz',
        teacherName: r.quizzes?.teachers?.name || 'Unknown Teacher',
        score: r.score,
        totalMarks: r.total_marks,
        answers: r.answers,
        submittedAt: new Date(r.submitted_at),
        remarks: r.remarks || '',
        feedback: r.feedback || ''
      }));
      
      setStudentResults(formattedResults);
    } catch (error) {
      console.error('Error fetching student results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student results',
        variant: 'destructive'
      });
    } finally {
      setLoadingResults(false);
    }
  };

  const addQuestion = async (question: Omit<Question, 'id'>): Promise<string | undefined> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to add a question');

      const { data, error } = await supabase
        .from('questions')
        .insert({
          text: question.text,
          options: question.options,
          correct_answer: question.correctAnswer,
          subject: question.subject,
          chapter: question.chapter,
          co: question.co,
          difficulty_level: question.difficultyLevel,
          image_url: question.imageUrl,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      const newQuestion: Question = {
        id: data.id,
        text: data.text,
        options: data.options,
        correctAnswer: data.correct_answer,
        subject: data.subject,
        chapter: data.chapter,
        co: data.co,
        difficultyLevel: data.difficulty_level,
        imageUrl: data.image_url
      };

      setQuestions(prev => [...prev, newQuestion]);
      return data.id;
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: 'Error',
        description: 'Failed to add question',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const addBulkQuestions = async (questionsToAdd: Omit<Question, 'id'>[]): Promise<string[]> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to add questions');

      const questionsToInsert = questionsToAdd.map(q => ({
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer,
        subject: q.subject,
        chapter: q.chapter,
        co: q.co,
        difficulty_level: q.difficultyLevel,
        image_url: q.imageUrl,
        created_by: currentUser.id
      }));

      const { data, error } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();

      if (error) throw error;

      const newQuestions: Question[] = data.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        subject: q.subject,
        chapter: q.chapter,
        co: q.co,
        difficultyLevel: q.difficulty_level,
        imageUrl: q.image_url
      }));

      setQuestions(prev => [...prev, ...newQuestions]);
      return newQuestions.map(q => q.id);
    } catch (error) {
      console.error('Error adding bulk questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to add questions in bulk',
        variant: 'destructive'
      });
      return [];
    }
  };

  const updateQuestion = async (id: string, question: Partial<Question>) => {
    try {
      const updates: any = {};
      if (question.text) updates.text = question.text;
      if (question.options) updates.options = question.options;
      if (question.correctAnswer) updates.correct_answer = question.correctAnswer;
      if (question.subject) updates.subject = question.subject;
      if (question.chapter) updates.chapter = question.chapter;
      if (question.co) updates.co = question.co;
      if (question.difficultyLevel) updates.difficulty_level = question.difficultyLevel;
      if (question.imageUrl !== undefined) updates.image_url = question.imageUrl;

      const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, ...question } : q)
      );
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to update question',
        variant: 'destructive'
      });
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== id));
      
      setQuizzes(prev => 
        prev.map(quiz => ({
          ...quiz,
          questions: quiz.questions.filter(qId => qId !== id),
        }))
      );
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive'
      });
    }
  };

  const addQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<string | undefined> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to add a quiz');

      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          teacher_id: quiz.teacherId,
          questions: quiz.questions.map(id => ({ id, marks: quiz.totalMarks / quiz.questions.length })),
          time_limit: quiz.timeLimit,
          total_marks: quiz.totalMarks,
          active: quiz.active
        })
        .select()
        .single();

      if (error) throw error;

      const newQuiz: Quiz = {
        id: data.id,
        title: data.title,
        teacherId: data.teacher_id,
        teacherName: currentUser.name,
        questions: data.questions.map((q: any) => q.id),
        timeLimit: data.time_limit,
        totalMarks: data.total_marks,
        active: data.active,
        createdAt: new Date(data.created_at)
      };

      setQuizzes(prev => [...prev, newQuiz]);
      return data.id;
    } catch (error) {
      console.error('Error adding quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to add quiz',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const updateQuiz = async (id: string, quiz: Partial<Quiz>) => {
    try {
      const updates: any = {};
      if (quiz.title) updates.title = quiz.title;
      if (quiz.questions) updates.questions = quiz.questions.map(id => ({ 
        id, 
        marks: (quiz.totalMarks || getQuizById(id)?.totalMarks || 0) / quiz.questions.length 
      }));
      if (quiz.timeLimit) updates.time_limit = quiz.timeLimit;
      if (quiz.totalMarks) updates.total_marks = quiz.totalMarks;
      if (quiz.active !== undefined) updates.active = quiz.active;

      const { error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setQuizzes(prev => 
        prev.map(q => q.id === id ? { ...q, ...quiz } : q)
      );
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive'
      });
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      // First check if there are any student results for this quiz
      const { data: resultsData, error: resultsError } = await supabase
        .from('student_results')
        .select('id')
        .eq('quiz_id', id);
        
      if (resultsError) throw resultsError;
      
      // If there are results, delete them first
      if (resultsData && resultsData.length > 0) {
        const resultIds = resultsData.map(r => r.id);
        const { error: deleteResultsError } = await supabase
          .from('student_results')
          .delete()
          .in('id', resultIds);
          
        if (deleteResultsError) throw deleteResultsError;
        
        // Update local state to remove deleted results
        setStudentResults(prev => prev.filter(r => !resultIds.includes(r.id)));
      }
      
      // Then delete the quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuizzes(prev => prev.filter(q => q.id !== id));
      
      toast({
        title: 'Success',
        description: 'Quiz deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quiz: ' + (error as any).message,
        variant: 'destructive'
      });
    }
  };

  const addStudentResult = async (
    result: Omit<StudentResult, 'id' | 'submittedAt'>
  ): Promise<string | undefined> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to submit a result');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', result.studentId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
      }

      const studentName = userData?.name || currentUser.name || 'Unknown Student';

      const { data, error } = await supabase
        .from('student_results')
        .insert({
          student_id: result.studentId,
          quiz_id: result.quizId,
          score: result.score,
          total_marks: result.totalMarks,
          answers: result.answers,
          remarks: result.remarks,
          feedback: result.feedback
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Quiz Submitted',
        description: `Your quiz has been submitted successfully with score ${result.score}/${result.totalMarks}`,
      });

      const newResult: StudentResult = {
        id: data.id,
        studentId: data.student_id,
        studentName: studentName,
        quizId: data.quiz_id,
        quizTitle: result.quizTitle,
        teacherName: result.teacherName,
        score: data.score,
        totalMarks: data.total_marks,
        answers: data.answers,
        submittedAt: new Date(data.submitted_at),
        remarks: data.remarks,
        feedback: data.feedback
      };

      setStudentResults(prev => [...prev, newResult]);
      return data.id;
    } catch (error) {
      console.error('Error adding student result:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz result: ' + (error as any).message,
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const updateStudentResult = async (id: string, result: Partial<StudentResult>) => {
    try {
      const updates: any = {};
      if (result.score !== undefined) updates.score = result.score;
      if (result.remarks !== undefined) updates.remarks = result.remarks;
      if (result.feedback !== undefined) updates.feedback = result.feedback;

      console.log('Updating student result with:', { id, updates });

      const { error } = await supabase
        .from('student_results')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating student result:', error);
        throw error;
      }

      // Show appropriate toast based on what's being updated
      if (result.feedback !== undefined) {
        toast({
          title: 'Feedback Submitted',
          description: 'Your feedback has been sent to the teacher',
        });
      } else if (result.remarks !== undefined) {
        toast({
          title: 'Remarks Updated',
          description: 'Student remarks have been updated successfully',
        });
      }

      // Update local state
      setStudentResults(prev => 
        prev.map(r => r.id === id ? { ...r, ...result } : r)
      );
      
      // Refresh results to ensure we have the latest data
      await fetchStudentResults();
    } catch (error) {
      console.error('Error updating student result:', error);
      toast({
        title: 'Error',
        description: 'Failed to update result: ' + (error as any).message,
        variant: 'destructive'
      });
    }
  };

  const uploadQuestionImage = async (file: File): Promise<string | undefined> => {
    try {
      if (!file) throw new Error('No file selected');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const getQuizById = (id: string) => quizzes.find(q => q.id === id);
  const getQuestionById = (id: string) => questions.find(q => q.id === id);
  const getStudentResultById = (id: string) => studentResults.find(r => r.id === id);
  const getStudentResultsByQuizId = (quizId: string) => studentResults.filter(r => r.quizId === quizId);
  const getStudentResultsByStudentId = (studentId: string) => studentResults.filter(r => r.studentId === studentId);
  const getQuizzesByTeacherId = (teacherId: string) => quizzes.filter(q => q.teacherId === teacherId);

  return (
    <SupabaseQuizDataContext.Provider
      value={{
        questions,
        quizzes,
        studentResults,
        loadingQuestions,
        loadingQuizzes,
        loadingResults,
        addQuestion,
        addBulkQuestions,
        updateQuestion,
        deleteQuestion,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        addStudentResult,
        updateStudentResult,
        getQuizById,
        getQuestionById,
        getStudentResultById,
        getStudentResultsByQuizId,
        getStudentResultsByStudentId,
        getQuizzesByTeacherId,
        uploadQuestionImage
      }}
    >
      {children}
    </SupabaseQuizDataContext.Provider>
  );
};

export const useSupabaseQuizData = () => {
  const context = useContext(SupabaseQuizDataContext);
  if (context === undefined) {
    throw new Error('useSupabaseQuizData must be used within a SupabaseQuizDataProvider');
  }
  return context;
};
