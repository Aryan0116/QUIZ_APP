
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const AttemptQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const answersRef = useRef({}); // Create a useRef
  const { currentUser } = useSupabaseAuth();
  const { 
    quizzes, 
    questions, 
    studentResults, 
    getQuizById, 
    addStudentResult 
  } = useSupabaseQuizData();
  
  // States
  const [quiz, setQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  
  // Refs to prevent memory leaks
  const timerRef = useRef(null);
  
  // Track performance
  const startTime = useRef(Date.now());
  useEffect(() => {
    startTime.current = Date.now();
    return () => {
      const loadTime = Date.now() - startTime.current;
      // console.log(`⏱️ Quiz component total mounted time: ${loadTime}ms`);
    };
  }, []);
  
  // Check if the student has already attempted this quiz
  const hasAttempted = studentResults.some(
    result => result.quizId === quizId && result.studentId === currentUser?.id
  );
  
  // Load quiz and questions
  useEffect(() => {
    const loadTime = performance.now();
    
    if (quizId) {
      const foundQuiz = getQuizById(quizId);
      
      if (foundQuiz) {
        setQuiz(foundQuiz);
        setTimeLeft(foundQuiz.timeLimit * 60); // Convert minutes to seconds
        
        // Get questions for this quiz
        const questionList = foundQuiz.questions
          .map(qId => questions.find(q => q.id === qId))
          .filter(Boolean);
        
        setQuizQuestions(questionList);
        
        // Initialize answers object
        const initialAnswers = {};
        questionList.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        
        // Initialize image loaded states
        const imageLoadedStates = {};
        const imageErrorStates = {};
        questionList.forEach(q => {
          if (q.imageUrl) {
            imageLoadedStates[q.id] = false;
            imageErrorStates[q.id] = false;
          }
        });
        setImageLoaded(imageLoadedStates);
        setImageErrors(imageErrorStates);
        
        // console.log(`⏱️ Quiz data loaded in ${performance.now() - loadTime}ms`);
      }
    }
  }, [quizId, getQuizById, questions]);
  
  // Preload images when question index changes
  useEffect(() => {
    if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length) {
      const currentQuestion = quizQuestions[currentQuestionIndex];
      
      // Also preload the next question's image if available
      if (currentQuestionIndex + 1 < quizQuestions.length) {
        const nextQuestion = quizQuestions[currentQuestionIndex + 1];
        if (nextQuestion && nextQuestion.imageUrl) {
          const img = document.createElement('img');
          img.src = nextQuestion.imageUrl;
          // console.log(`Preloading image for next question: ${nextQuestion.imageUrl}`);
        }
      }
    }
  }, [currentQuestionIndex, quizQuestions]);
  
  // Timer
  useEffect(() => {
    if (!quiz || hasAttempted) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setIsTimeExpired(true);
          setTimeout(() => {
            handleSubmitQuiz(true);
          }, 10);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, hasAttempted]);
  
  // If the student has already attempted this quiz, redirect to results
  useEffect(() => {
    if (hasAttempted) {
      toast({
        title: "Already Attempted",
        description: "You have already attempted this quiz.",
        variant: "destructive",
      });
      navigate('/student');
    }
  }, [hasAttempted, navigate]);
  
  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    answersRef.current[questionId] = answer; // Update the ref
    setAnswers(prev => ({
        ...prev,
        [questionId]: answer,
    }));
};
  
  // Handle navigation
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Image handling
  const handleImageLoad = (questionId) => {
    // console.log(`Image for question ${questionId} loaded successfully`);
    setImageLoaded(prev => ({
      ...prev,
      [questionId]: true
    }));
    setImageErrors(prev => ({
      ...prev,
      [questionId]: false
    }));
  };
  
  const handleImageError = (questionId) => {
    // console.error(`Failed to load image for question ${questionId}`);
    setImageErrors(prev => ({
      ...prev,
      [questionId]: true
    }));
  };
  
  // Submit quiz
  const handleSubmitQuiz = (isTimeExpiredSubmission = false) => {
    if (!currentUser || !quiz) return;

    const currentAnswers = answersRef.current; // Get the answers from the ref

    const answeredQuestions = Object.entries(currentAnswers).filter(([_, answer]) => answer);

    if (answeredQuestions.length === 0 && !isTimeExpiredSubmission) {
        toast({
            title: "No Answers",
            description: "Please answer at least one question before submitting.",
            variant: "destructive",
        });
        return;
    }

    const answerResults = quizQuestions.map(question => {
        const answer = currentAnswers[question.id] || '';
        const correct = answer === question.correctAnswer;

        return {
            questionId: question.id,
            answer,
            correct,
        };
    });
  
    const score = answerResults.filter(r => r.correct).length;
  
    // Create result record
    addStudentResult({
      studentId: currentUser.id,
      studentName: currentUser.name,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score,
      totalMarks: quiz.totalMarks,
      answers: answerResults,
    });
  
    // Navigate to student dashboard
    toast({
      title: "Quiz Submitted",
      description: `Your score: ${score}/${quiz.totalMarks}`,
    });
  
    navigate('/student');
  };
  
  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!quiz || quizQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading Quiz...</h1>
          <p className="text-gray-500">If this takes too long, the quiz may not exist.</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  const answeredCount = Object.values(answers).filter(a => a).length;
  
  return (
    <div className="min-h-screen bg-gray-50 py-6 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <div className="flex justify-between items-center mt-2">
            <p className="text-gray-500">{quizQuestions.length} questions</p>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className={`font-medium ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Question Card */}
        <Card className="mb-6 transform transition-all duration-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {currentQuestion.text}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2 mt-2">
              {currentQuestion.subject && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-fade-in">
                  {currentQuestion.subject}
                </span>
              )}
              {currentQuestion.chapter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 animate-fade-in delay-75">
                  {currentQuestion.chapter}
                </span>
              )}
              {currentQuestion.difficultyLevel && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize animate-fade-in delay-100
                  ${currentQuestion.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' : 
                    currentQuestion.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {currentQuestion.difficultyLevel}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Display question image if available */}
            {currentQuestion.imageUrl && (
              <div className="mb-4 border rounded-md overflow-hidden bg-gray-50">
                {imageErrors[currentQuestion.id] ? (
                  <div className="flex items-center justify-center h-[200px] bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>An image is attached to this question but couldn't be loaded</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question image"
                    className={`w-full h-auto max-h-[300px] object-contain mx-auto transition-opacity duration-300 ${imageLoaded[currentQuestion.id] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(currentQuestion.id)}
                    onError={() => handleImageError(currentQuestion.id)}
                  />
                )}
              </div>
            )}
            
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-3 mt-4"
            >
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 transition-colors hover:scale-[1.01] cursor-pointer"
                  onClick={() => handleAnswerChange(currentQuestion.id, option)}
                >
                  <RadioGroupItem id={`option-${index}`} value={option} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="hover:shadow-md transition-shadow"
          >
            Previous
          </Button>
          
          <div className="space-x-3">
            {currentQuestionIndex < quizQuestions.length - 1 ? (
              <Button
                onClick={handleNextQuestion}
                className="hover:shadow-md transition-shadow hover:scale-105"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => setIsSubmitDialogOpen(true)}
                className="bg-quiz-secondary hover:bg-quiz-secondary/90 hover:shadow-md transition-shadow hover:scale-105"
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </div>
        
        {/* Question Navigation */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Questions</h3>
          <div className="grid grid-cols-10 gap-2">
            {quizQuestions.map((_, index) => (
              <Button
                key={index}
                variant="outline"
                size="icon"
                className={`w-10 h-10 transition-all duration-200 ${
                  index === currentQuestionIndex 
                    ? 'border-quiz-primary bg-blue-50 scale-110 shadow-sm' 
                    : answers[quizQuestions[index].id]
                      ? 'bg-green-50 border-green-200'
                      : ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Submit Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="animate-fade-in">
            <DialogHeader>
              <DialogTitle>Submit Quiz</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit this quiz? You can't change your answers after submission.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Quiz Summary</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Questions:</span>
                      <span>{quizQuestions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Answered:</span>
                      <span>{answeredCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Unanswered:</span>
                      <span>{quizQuestions.length - answeredCount}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Continue Quiz
              </Button>
              <Button onClick={handleSubmitQuiz} className="hover:scale-105 transition-transform">
                Submit Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Time Expired Dialog */}
        <Dialog open={isTimeExpired}>
          <DialogContent className="animate-fade-in">
            <DialogHeader>
              <DialogTitle>Time Expired</DialogTitle>
              <DialogDescription>
                Your time for this quiz has expired. Your answers have been automatically submitted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => navigate('/student')} className="hover:scale-105 transition-transform">
                Return to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AttemptQuiz;
