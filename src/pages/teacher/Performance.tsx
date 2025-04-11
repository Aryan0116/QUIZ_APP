
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import TeacherNavbar from '@/components/TeacherNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BarChart as BarChartIcon, ChevronLeft, FileCheck, Award, Clock, AreaChart, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B8E23', '#483D8B'];

const getPerformanceRemark = (scorePercentage) => {
  if (scorePercentage >= 90) return 'Excellent';
  if (scorePercentage >= 80) return 'Very Good';
  if (scorePercentage >= 70) return 'Good';
  if (scorePercentage >= 60) return 'Satisfactory';
  if (scorePercentage >= 50) return 'Average';
  if (scorePercentage >= 40) return 'Below Average';
  return 'Poor';
};

const Performance = () => {
  const location = useLocation();
  const { quizzes, questions, studentResults, getQuizById, getQuestionById, updateStudentResult } = useSupabaseQuizData();
  
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [selectedStudentResult, setSelectedStudentResult] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const [avgScorePerCO, setAvgScorePerCO] = useState<any[]>([]);
  const [avgScorePerChapter, setAvgScorePerChapter] = useState<any[]>([]);
  const [questionAccuracy, setQuestionAccuracy] = useState<any[]>([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState<any[]>([]);
  const [studentScoreDistribution, setStudentScoreDistribution] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    // Ensure we have data loaded before trying to process it
    if (quizzes.length > 0) {
      setLoading(false);
      
      const quizId = location.state?.quizId || '';
      if (quizId) {
        setSelectedQuizId(quizId);
      }
      
      // Calculate overall leaderboard across all quizzes
      calculateOverallLeaderboard();
    }
  }, [location, quizzes]);

  useEffect(() => {
    if (selectedQuizId) {
      const quiz = getQuizById(selectedQuizId);
      if (quiz) {
        setSelectedQuiz(quiz);
        
        const results = studentResults.filter(r => r.quizId === selectedQuizId);
        setQuizResults(results);
        
        calculateAnalytics(quiz, results);
        calculateLeaderboard(results);
      }
    }
  }, [selectedQuizId, getQuizById, studentResults]);

  const calculateOverallLeaderboard = () => {
    // Create a map to store student stats
    const studentPerformance: Record<string, {
      studentId: string;
      studentName: string;
      totalScore: number;
      totalMarks: number;
      quizzesTaken: number;
      averagePercentage: number;
    }> = {};
    
    // Process all results to build aggregate data
    studentResults.forEach(result => {
      if (!studentPerformance[result.studentId]) {
        studentPerformance[result.studentId] = {
          studentId: result.studentId,
          studentName: result.studentName,
          totalScore: 0,
          totalMarks: 0,
          quizzesTaken: 0,
          averagePercentage: 0
        };
      }
      
      studentPerformance[result.studentId].totalScore += result.score;
      studentPerformance[result.studentId].totalMarks += result.totalMarks;
      studentPerformance[result.studentId].quizzesTaken += 1;
    });
    
    // Calculate averages and sort
    const leaderboardData = Object.values(studentPerformance).map(student => {
      return {
        ...student,
        averagePercentage: (student.totalScore / student.totalMarks) * 100
      };
    });
    
    // Sort by average percentage
    const sortedLeaderboard = leaderboardData.sort((a, b) => b.averagePercentage - a.averagePercentage);
    
    setOverallLeaderboard(sortedLeaderboard);
  };

  const calculateLeaderboard = (results) => {
    if (!results || results.length === 0) {
      setLeaderboard([]);
      return;
    }
    
    // Sort students by score percentage in descending order
    const sortedLeaderboard = [...results].sort((a, b) => {
      const aPercentage = (a.score / a.totalMarks) * 100;
      const bPercentage = (b.score / b.totalMarks) * 100;
      return bPercentage - aPercentage;
    });
    
    // Add a rank field
    const rankedLeaderboard = sortedLeaderboard.map((result, index) => ({
      ...result,
      rank: index + 1,
      percentage: ((result.score / result.totalMarks) * 100).toFixed(1)
    }));
    
    setLeaderboard(rankedLeaderboard);
  };

  const calculateAnalytics = (quiz, results) => {
    if (!quiz || !quiz.questions || results.length === 0) return;
    
    // Map question IDs in the quiz to actual question objects
    const quizQuestions = quiz.questions.map(qId => getQuestionById(qId)).filter(q => q);
    
    // Calculate course outcome data
    const coData = {};
    quizQuestions.forEach(question => {
      if (question && question.co) {
        if (!coData[question.co]) {
          coData[question.co] = { total: 0, correct: 0, count: 0 };
        }
        
        results.forEach(result => {
          const answer = result.answers.find(a => a.questionId === question.id);
          if (answer) {
            coData[question.co].count++;
            if (answer.correct) {
              coData[question.co].correct++;
            }
          }
        });
      }
    });
    
    const coChartData = Object.keys(coData).map(co => ({
      name: co,
      score: coData[co].count > 0 ? (coData[co].correct / coData[co].count * 100).toFixed(1) : 0,
    }));
    
    setAvgScorePerCO(coChartData);
    
    // Calculate chapter data
    const chapterData = {};
    quizQuestions.forEach(question => {
      if (question && question.chapter) {
        if (!chapterData[question.chapter]) {
          chapterData[question.chapter] = { total: 0, correct: 0, count: 0 };
        }
        
        results.forEach(result => {
          const answer = result.answers.find(a => a.questionId === question.id);
          if (answer) {
            chapterData[question.chapter].count++;
            if (answer.correct) {
              chapterData[question.chapter].correct++;
            }
          }
        });
      }
    });
    
    const chapterChartData = Object.keys(chapterData).map(chapter => ({
      name: chapter,
      score: chapterData[chapter].count > 0 ? (chapterData[chapter].correct / chapterData[chapter].count * 100).toFixed(1) : 0,
    }));
    
    setAvgScorePerChapter(chapterChartData);
    
    // Calculate question accuracy
    const questionData = {};
    quizQuestions.forEach(question => {
      if (question) {
        questionData[question.id] = { 
          correct: 0, 
          total: 0, 
          text: question.text ? (question.text.substring(0, 30) + '...') : 'Question' 
        };
        
        results.forEach(result => {
          const answer = result.answers.find(a => a.questionId === question.id);
          if (answer) {
            questionData[question.id].total++;
            if (answer.correct) {
              questionData[question.id].correct++;
            }
          }
        });
      }
    });
    
    const questionChartData = Object.keys(questionData).map(qId => ({
      name: questionData[qId].text,
      accuracy: questionData[qId].total > 0 ? (questionData[qId].correct / questionData[qId].total * 100).toFixed(1) : 0,
    }));
    
    setQuestionAccuracy(questionChartData);
    
    // Calculate difficulty distribution
    const difficultyData = {
      easy: 0,
      medium: 0,
      hard: 0,
    };
    
    quizQuestions.forEach(question => {
      if (question && question.difficultyLevel) {
        difficultyData[question.difficultyLevel]++;
      }
    });
    
    const difficultyChartData = Object.keys(difficultyData).map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: difficultyData[level],
    }));
    
    setDifficultyDistribution(difficultyChartData);
    
    // Calculate score distribution
    const scoreRanges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0,
    };
    
    results.forEach(result => {
      const scorePercentage = (result.score / result.totalMarks) * 100;
      
      if (scorePercentage <= 20) {
        scoreRanges['0-20%']++;
      } else if (scorePercentage <= 40) {
        scoreRanges['21-40%']++;
      } else if (scorePercentage <= 60) {
        scoreRanges['41-60%']++;
      } else if (scorePercentage <= 80) {
        scoreRanges['61-80%']++;
      } else {
        scoreRanges['81-100%']++;
      }
    });
    
    const scoreDistChartData = Object.keys(scoreRanges).map(range => ({
      name: range,
      value: scoreRanges[range],
    }));
    
    setStudentScoreDistribution(scoreDistChartData);
  };

  const handleQuizChange = (quizId: string) => {
    setSelectedQuizId(quizId);
    setSelectedStudentResult(null);
  };

  const handleStudentSelect = (result) => {
    setSelectedStudentResult(result);
    setRemarks(result.remarks || '');
  };

  const handleSaveRemarks = () => {
    if (!selectedStudentResult) return;
    
    updateStudentResult(selectedStudentResult.id, { remarks });
    
    setQuizResults(prevResults => 
      prevResults.map(r => 
        r.id === selectedStudentResult.id ? { ...r, remarks } : r
      )
    );
    
    setSelectedStudentResult({ ...selectedStudentResult, remarks });
    
    toast({
      title: "Success",
      description: "Remarks saved successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TeacherNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link to="/teacher" className="inline-flex items-center text-quiz-primary hover:text-quiz-primary/90 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="mt-1 text-gray-500">
            View detailed performance metrics and insights for your quizzes
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label htmlFor="quizSelect">Select Quiz</Label>
              <Select value={selectedQuizId} onValueChange={handleQuizChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {selectedQuiz ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Quiz Title</CardTitle>
                    <FileCheck className="h-5 w-5 text-quiz-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedQuiz.title}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created by: {selectedQuiz.teacherName}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Attempts</CardTitle>
                    <Award className="h-5 w-5 text-quiz-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{quizResults.length}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Students attempted this quiz
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
                    <BarChartIcon className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {quizResults.length > 0 
                        ? (quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks * 100), 0) / quizResults.length).toFixed(1) + '%'
                        : 'N/A'
                      }
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Overall performance
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Time Limit</CardTitle>
                    <Clock className="h-5 w-5 text-quiz-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedQuiz.timeLimit} min</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Quiz duration
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Outcome Performance</CardTitle>
                    <CardDescription>
                      Average score percentage by course outcome
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {avgScorePerCO.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={avgScorePerCO}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                          <Legend />
                          <Bar dataKey="score" fill="#8884d8" name="Average Score (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Chapter Performance</CardTitle>
                    <CardDescription>
                      Average score percentage by chapter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {avgScorePerChapter.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={avgScorePerChapter}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                          <Legend />
                          <Bar dataKey="score" fill="#82ca9d" name="Average Score (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student List</CardTitle>
                      <CardDescription>
                        Select a student to view detailed performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {quizResults.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {quizResults.map(result => (
                            <div 
                              key={result.id}
                              className={`p-3 rounded-md cursor-pointer transition-colors ${
                                selectedStudentResult?.id === result.id 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-100 border border-gray-200'
                              }`}
                              onClick={() => handleStudentSelect(result)}
                            >
                              <div className="font-medium">{result.studentName}</div>
                              <div className="flex justify-between text-sm mt-1">
                                <span>Score: {result.score}/{result.totalMarks}</span>
                                <span className={`${
                                  (result.score / result.totalMarks) * 100 >= 60 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {((result.score / result.totalMarks) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-gray-500">
                          No student attempts for this quiz
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  {selectedStudentResult ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Student Performance</CardTitle>
                        <CardDescription>
                          Detailed performance for {selectedStudentResult.studentName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-md text-center">
                            <div className="text-sm text-gray-500">Score</div>
                            <div className="text-2xl font-bold mt-1">
                              {selectedStudentResult.score}/{selectedStudentResult.totalMarks}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-md text-center">
                            <div className="text-sm text-gray-500">Percentage</div>
                            <div className="text-2xl font-bold mt-1">
                              {((selectedStudentResult.score / selectedStudentResult.totalMarks) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-md text-center">
                            <div className="text-sm text-gray-500">Performance</div>
                            <div className={`text-2xl font-bold mt-1 ${
                              (selectedStudentResult.score / selectedStudentResult.totalMarks) * 100 >= 70
                                ? 'text-green-600'
                                : (selectedStudentResult.score / selectedStudentResult.totalMarks) * 100 >= 50
                                  ? 'text-amber-500'
                                  : 'text-red-600'
                            }`}>
                              {getPerformanceRemark((selectedStudentResult.score / selectedStudentResult.totalMarks) * 100)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="remarks">Teacher Remarks</Label>
                          <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add remarks about student's performance..."
                            rows={4}
                          />
                          <Button 
                            size="sm"
                            onClick={handleSaveRemarks}
                            className="mt-2"
                          >
                            Save Remarks
                          </Button>
                        </div>
                        
                        {selectedStudentResult.feedback && (
                          <div className="space-y-2 p-4 bg-blue-50 rounded-md">
                            <h3 className="font-medium">Student Feedback:</h3>
                            <p className="text-gray-700">{selectedStudentResult.feedback}</p>
                          </div>
                        )}
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Question Responses</h3>
                          <div className="space-y-4">
                            {selectedStudentResult.answers.map((answer, index) => {
                              const question = getQuestionById(answer.questionId);
                              return question ? (
                                <div 
                                  key={answer.questionId}
                                  className={`p-4 rounded-md border ${
                                    answer.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium">Question {index + 1}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      answer.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {answer.correct ? 'Correct' : 'Incorrect'}
                                    </span>
                                  </div>
                                  <p className="mt-2">{question.text}</p>
                                  {question.imageUrl && (
                                    <div className="mt-2 max-w-xs">
                                      <img 
                                        src={question.imageUrl} 
                                        alt="Question" 
                                        className="rounded-md border"
                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                      />
                                    </div>
                                  )}
                                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {question.options.map((option, idx) => (
                                      <div 
                                        key={idx}
                                        className={`p-2 border rounded-md ${
                                          option === question.correctAnswer
                                            ? 'bg-green-100 border-green-200'
                                            : option === answer.answer && !answer.correct
                                              ? 'bg-red-100 border-red-200'
                                              : ''
                                        }`}
                                      >
                                        <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}:</span>
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">Student answered: </span>
                                    {answer.answer}
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-10 text-center text-gray-500">
                        Select a student to view detailed performance
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Question Accuracy</CardTitle>
                  <CardDescription>
                    Percentage of students who answered each question correctly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questionAccuracy.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={questionAccuracy}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                        <Legend />
                        <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="leaderboard" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Quiz Leaderboard</CardTitle>
                      <CardDescription>
                        Top performing students for {selectedQuiz.title}
                      </CardDescription>
                    </div>
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    {leaderboard.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                            <TableHead className="text-right">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell className="font-medium">
                                {result.rank === 1 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800">
                                    1
                                  </span>
                                ) : result.rank === 2 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">
                                    2
                                  </span>
                                ) : result.rank === 3 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800">
                                    3
                                  </span>
                                ) : (
                                  result.rank
                                )}
                              </TableCell>
                              <TableCell>{result.studentName}</TableCell>
                              <TableCell className="text-right">{result.score}/{result.totalMarks}</TableCell>
                              <TableCell className="text-right">{result.percentage}%</TableCell>
                              <TableCell className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  parseFloat(result.percentage) >= 80 
                                    ? 'bg-green-100 text-green-800' 
                                    : parseFloat(result.percentage) >= 60
                                      ? 'bg-blue-100 text-blue-800'
                                      : parseFloat(result.percentage) >= 40
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                  {getPerformanceRemark(parseFloat(result.percentage))}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        No data available for leaderboard
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Overall Leaderboard</CardTitle>
                      <CardDescription>
                        Top performing students across all quizzes
                      </CardDescription>
                    </div>
                    <Award className="h-5 w-5 text-quiz-secondary" />
                  </CardHeader>
                  <CardContent>
                    {overallLeaderboard.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Quizzes Taken</TableHead>
                            <TableHead className="text-right">Average Score</TableHead>
                            <TableHead className="text-right">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overallLeaderboard.slice(0, 10).map((student, index) => (
                            <TableRow key={student.studentId}>
                              <TableCell className="font-medium">
                                {index === 0 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800">
                                    1
                                  </span>
                                ) : index === 1 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">
                                    2
                                  </span>
                                ) : index === 2 ? (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800">
                                    3
                                  </span>
                                ) : (
                                  index + 1
                                )}
                              </TableCell>
                              <TableCell>{student.studentName}</TableCell>
                              <TableCell className="text-right">{student.quizzesTaken}</TableCell>
                              <TableCell className="text-right">{student.averagePercentage.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  student.averagePercentage >= 80 
                                    ? 'bg-green-100 text-green-800' 
                                    : student.averagePercentage >= 60
                                      ? 'bg-blue-100 text-blue-800'
                                      : student.averagePercentage >= 40
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                  {getPerformanceRemark(student.averagePercentage)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        No data available for overall leaderboard
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="detailed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Question Difficulty Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of questions by difficulty level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {difficultyDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={difficultyDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {difficultyDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Questions']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Student Score Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of students by score range
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentScoreDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={studentScoreDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {studentScoreDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Students']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              <AreaChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Quiz Selected</h3>
              <p className="mb-4">Please select a quiz to view performance analytics</p>
              <div className="max-w-xs mx-auto">
                <Select onValueChange={handleQuizChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map(quiz => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Performance;
