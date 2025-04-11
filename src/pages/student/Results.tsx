
import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

// Helper function to get performance remark based on score percentage
const getPerformanceRemark = (scorePercentage) => {
  if (scorePercentage >= 90) return 'Excellent';
  if (scorePercentage >= 80) return 'Very Good';
  if (scorePercentage >= 70) return 'Good';
  if (scorePercentage >= 60) return 'Satisfactory';
  if (scorePercentage >= 50) return 'Average';
  if (scorePercentage >= 40) return 'Below Average';
  return 'Poor';
};

const StudentResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSupabaseAuth();
  const { studentResults, questions, getStudentResultById, updateStudentResult } = useSupabaseQuizData();
  
  const [result, setResult] = useState(null);
  const [resultQuestions, setResultQuestions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    // If resultId is provided in location state, use it
    if (location.state?.resultId) {
      const foundResult = getStudentResultById(location.state.resultId);
      if (foundResult) {
        setResult(foundResult);
        setFeedback(foundResult.feedback || '');
      }
    } 
    // Otherwise, just show the most recent result
    else if (currentUser) {
      const userResults = studentResults.filter(
        result => result.studentId === currentUser.id
      );
      
      if (userResults.length > 0) {
        // Sort by date and get the most recent
        const sorted = [...userResults].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setResult(sorted[0]);
        setFeedback(sorted[0].feedback || '');
      }
    }
  }, [location.state, currentUser, studentResults, getStudentResultById]);
  
  // Prepare questions with answers
  useEffect(() => {
    if (result) {
      const questionsWithAnswers = result.answers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question) {
          return {
            ...question,
            userAnswer: answer.answer,
            isCorrect: answer.correct,
          };
        }
        return null;
      }).filter(Boolean);
      
      setResultQuestions(questionsWithAnswers);
    }
  }, [result, questions]);
  
  // Calculate statistics
  const totalQuestions = resultQuestions.length;
  const correctAnswers = resultQuestions.filter(q => q.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  const handleSaveFeedback = async () => {
    if (!result) return;
    
    try {
      await updateStudentResult(result.id, { feedback });
      setResult({ ...result, feedback });
      
      toast({
        title: "Success",
        description: "Your feedback has been submitted to the teacher",
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Results Found</h1>
          <p className="text-gray-500 mb-4">You haven't completed any quizzes yet.</p>
          <Link to="/student">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Link to="/student">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
          </div>
          <p className="mt-1 text-gray-500">
            Submitted on {new Date(result.submittedAt).toLocaleString()}
          </p>
        </div>
        
        {/* Result Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{result.quizTitle}</CardTitle>
                <CardDescription>
                  Created by: {result.teacherName || 'Teacher'}
                </CardDescription>
              </div>
              <Badge 
                className={
                  scorePercentage >= 70 
                    ? 'bg-green-500' 
                    : scorePercentage >= 40 
                      ? 'bg-amber-500' 
                      : 'bg-red-500'
                }
              >
                {result.score}/{result.totalMarks}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score</span>
                <span className="font-medium">{scorePercentage.toFixed(1)}%</span>
              </div>
              <Progress 
                value={scorePercentage} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{totalQuestions}</div>
                    <p className="text-sm text-gray-500">Total Questions</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{correctAnswers}</div>
                    <p className="text-sm text-gray-500">Correct Answers</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{incorrectAnswers}</div>
                    <p className="text-sm text-gray-500">Incorrect Answers</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Performance</div>
                <div className={`text-xl font-semibold ${
                  scorePercentage >= 70 ? 'text-green-600' : 
                  scorePercentage >= 50 ? 'text-amber-500' : 'text-red-600'
                }`}>
                  {getPerformanceRemark(scorePercentage)}
                </div>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{result.feedback ? 'Edit Feedback' : 'Leave Feedback'}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Feedback to Teacher</DialogTitle>
                    <DialogDescription>
                      Share your thoughts about this quiz with your teacher.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write your feedback here..."
                    rows={5}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveFeedback}>
                      Submit Feedback
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {result.remarks && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Teacher Remarks:</h3>
                <p className="text-gray-600 p-3 bg-blue-50 rounded-md">{result.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed Answers */}
        <h2 className="text-xl font-semibold mb-4">Question Review</h2>
        <div className="space-y-6">
          {resultQuestions.map((question, index) => (
            <Card key={question.id} className={question.isCorrect ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className={question.isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                <div className="flex justify-between">
                  <CardTitle className="text-base font-medium">
                    Question {index + 1}
                  </CardTitle>
                  <div>
                    {question.isCorrect ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <CardDescription className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {question.subject}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {question.chapter}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {question.co}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="mb-4">{question.text}</p>
                
                {question.imageUrl && (
                  <div className="mb-4 max-w-xs">
                    <img 
                      src={question.imageUrl} 
                      alt="Question" 
                      className="rounded-md border" 
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border ${
                        option === question.correctAnswer
                          ? 'bg-green-50 border-green-200'
                          : option === question.userAnswer && !question.isCorrect
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                          option === question.correctAnswer
                            ? 'bg-green-500 text-white'
                            : option === question.userAnswer && !question.isCorrect
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span>{option}</span>
                        
                        {option === question.userAnswer && (
                          <div className="ml-3 text-sm text-gray-500">
                            Your answer
                          </div>
                        )}
                        
                        {option === question.correctAnswer && option !== question.userAnswer && (
                          <div className="ml-3 text-sm text-green-600">
                            Correct answer
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/student">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentResults;
