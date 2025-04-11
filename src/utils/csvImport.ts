
import Papa from 'papaparse';
import { Question } from '@/contexts/SupabaseQuizDataContext';

export const getCSVTemplate = () => {
  return `text,options,correct_answer,subject,chapter,co,difficulty_level,image_url
"What is 2+2?","[""2"",""3"",""4"",""5""]","4","Math","Arithmetic","CO1","easy",""
"What is the capital of France?","[""London"",""Paris"",""Berlin"",""Madrid""]","Paris","Geography","Europe","CO2","medium",""`;
};

export const parseCSV = (csvContent: string): Omit<Question, 'id'>[] => {
  try {
    const { data, errors } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      console.error('CSV parsing errors:', errors);
      throw new Error('Error parsing CSV file');
    }

    return data.map((row: any) => {
      // Parse options from string to array
      const options = typeof row.options === 'string' ? 
        JSON.parse(row.options.replace(/'/g, '"')) : 
        [];

      return {
        text: row.text,
        options: options,
        correctAnswer: row.correct_answer,
        subject: row.subject,
        chapter: row.chapter,
        co: row.co,
        difficultyLevel: row.difficulty_level as 'easy' | 'medium' | 'hard',
        imageUrl: row.image_url || undefined,
      };
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
};
