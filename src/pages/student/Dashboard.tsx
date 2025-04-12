
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import StudentNavbar from '@/components/StudentNavbar';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardCheck, BarChart, Award } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const StudentDashboard = () => {
  const { currentUser } = useSupabaseAuth();
  const navigate = useNavigate();
  const { quizzes, studentResults, getStudentResultsByStudentId } = useSupabaseQuizData();
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [studentQuizResults, setStudentQuizResults] = useState([]);

  useEffect(() => {
    if (currentUser) {
      // Load active quizzes
      const availableQuizzes = quizzes.filter(quiz => quiz.active);
      setActiveQuizzes(availableQuizzes);
      
      // Load student results
      const results = getStudentResultsByStudentId(currentUser.id);
      setStudentQuizResults(results);
      
      // Show toast notifications
      if (availableQuizzes.length > 0) {
        toast({
          title: "Available Quizzes",
          description: `${availableQuizzes.length} quizzes are available for you to take`,
        });
      }
      
      if (results.length > 0) {
        toast({
          title: "Results Loaded",
          description: `You have completed ${results.length} quizzes`,
        });
      }
    }
  }, [currentUser, quizzes, studentResults, getStudentResultsByStudentId]);

  const completedQuizIds = studentQuizResults.map(result => result.quizId);
  const pendingQuizzes = activeQuizzes.filter(quiz => !completedQuizIds.includes(quiz.id));
  
  // Calculate performance metrics
  const averageScore = studentQuizResults.length > 0
    ? (studentQuizResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks * 100), 0) / studentQuizResults.length).toFixed(1)
    : 0;
  
  const bestScore = studentQuizResults.length > 0
    ? Math.max(...studentQuizResults.map(result => (result.score / result.totalMarks * 100))).toFixed(1)
    : 0;

  return (
    <AuthenticatedLayout userType="student">
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar/>
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="mt-1 text-gray-500">Welcome back, {currentUser?.name}</p>
              </div>
              <Button onClick={() => navigate('/student/results')}>
                View Recent Results
              </Button>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Available Quizzes</CardTitle>
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingQuizzes.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completed Quizzes</CardTitle>
                <ClipboardCheck className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{studentQuizResults.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
                <BarChart className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageScore}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Best Score</CardTitle>
                <Award className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bestScore}%</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Available Quizzes */}
          <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>
          {pendingQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {pendingQuizzes.map(quiz => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      Created by {quiz.teacherName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Questions: {quiz.questions.length}</span>
                      <span>Marks: {quiz.totalMarks}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>Time Limit: {quiz.timeLimit} min</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to={`/student/quiz/${quiz.id}`} className="w-full">
                      <Button className="w-full">
                        Start Quiz
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-10 text-center">
                <p className="text-gray-500">No quizzes available at the moment.</p>
              </CardContent>
            </Card>
          )}
          
          {/* Recent Results */}
          <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
          {studentQuizResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {studentQuizResults.slice(0, 6).map(result => (
                <Card key={result.id}>
                  <CardHeader>
                    <CardTitle>{result.quizTitle}</CardTitle>
                    <CardDescription>
                      Completed on {new Date(result.submittedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Score: {result.score}/{result.totalMarks}
                      </span>
                      <span className={`text-lg font-semibold ${
                        (result.score / result.totalMarks) >= 0.7 
                          ? 'text-green-600' 
                          : (result.score / result.totalMarks) >= 0.4 
                            ? 'text-amber-600' 
                            : 'text-red-600'
                      }`}>
                        {((result.score / result.totalMarks) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to="/student/results" state={{ resultId: result.id }} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-gray-500">You haven't completed any quizzes yet.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AuthenticatedLayout>
  );
};

export default StudentDashboard;
