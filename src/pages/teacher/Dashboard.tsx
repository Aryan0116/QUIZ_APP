import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import TeacherNavbar from '@/components/TeacherNavbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Clock, FileCheck, User, BookOpen, PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const TeacherDashboard = () => {
  const { currentUser } = useSupabaseAuth();
  const { quizzes, studentResults, questions, getQuizzesByTeacherId, deleteQuiz } = useSupabaseQuizData();
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userQuizzes = getQuizzesByTeacherId(currentUser.id);
      setTeacherQuizzes(userQuizzes);
      
      if (userQuizzes.length > 0) {
        toast({
          title: "Quizzes Loaded",
          description: `${userQuizzes.length} quizzes found in your account`,
          duration: 2000,
        });
      }
    }
  }, [currentUser, getQuizzesByTeacherId, quizzes]);

  const activeQuizzes = teacherQuizzes.filter(quiz => quiz.active).length;
  const totalStudentsAttempted = new Set(studentResults.map(result => result.studentId)).size;
  const averageScore = studentResults.length > 0 
    ? (studentResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks * 100), 0) / studentResults.length).toFixed(1) 
    : 0;

  const handleDeleteQuiz = () => {
    if (!quizToDelete) return;
    
    deleteQuiz(quizToDelete.id);
    
    toast({
      title: "Quiz Deleted",
      description: `"${quizToDelete.title}" has been permanently deleted`,
      duration: 2000,
    });
    
    setQuizToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  return (
    <AuthenticatedLayout userType="teacher">
      <div className="min-h-screen bg-gray-50">
        <TeacherNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Welcome back, {currentUser?.name}. Manage your quizzes and view performance analytics.
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Quizzes</CardTitle>
                <FileCheck className="h-5 w-5 text-quiz-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{teacherQuizzes.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Quizzes</CardTitle>
                <Clock className="h-5 w-5 text-quiz-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeQuizzes}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Students</CardTitle>
                <User className="h-5 w-5 text-quiz-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalStudentsAttempted}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Avg. Score</CardTitle>
                <BarChart className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{averageScore}%</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Quizzes */}
          <h2 className="text-xl font-semibold mb-4">Recent Quizzes</h2>
          {teacherQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {teacherQuizzes.slice(0, 6).map(quiz => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      Created on {new Date(quiz.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Questions: {quiz.questions.length}</span>
                      <span>Marks: {quiz.totalMarks}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Time Limit: {quiz.timeLimit} min</span>
                      <span className={`font-medium ${quiz.active ? 'text-green-600' : 'text-red-600'}`}>
                        {quiz.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link to="/teacher/performance" state={{ quizId: quiz.id }} className="flex-1 mr-2">
                      <Button variant="outline" className="w-full">View Results</Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setQuizToDelete(quiz);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-10 text-center">
                <p className="text-gray-500 mb-4">You haven't created any quizzes yet.</p>
                <Link to="/teacher/create-quiz">
                  <Button>Create Your First Quiz</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          {/* Quick Actions */}
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Link to="/teacher/question-bank">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <BookOpen className="h-10 w-10 text-quiz-primary mb-3" />
                  <CardTitle className="mb-2">Question Bank</CardTitle>
                  <CardDescription>
                    Manage questions by subject, chapter, and CO
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/teacher/create-quiz">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <PlusCircle className="h-10 w-10 text-quiz-secondary mb-3" />
                  <CardTitle className="mb-2">Create Quiz</CardTitle>
                  <CardDescription>
                    Create a new quiz from your question bank
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/teacher/performance">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <BarChart className="h-10 w-10 text-quiz-accent mb-3" />
                  <CardTitle className="mb-2">Performance Analytics</CardTitle>
                  <CardDescription>
                    Review student performance and metrics
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </main>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Quiz</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteQuiz}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
};

export default TeacherDashboard;
