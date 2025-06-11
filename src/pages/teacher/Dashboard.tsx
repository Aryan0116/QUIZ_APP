import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import TeacherNavbar from '@/components/TeacherNavbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Clock, FileCheck, User, BookOpen, PlusCircle, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const TeacherDashboard = () => {
  const { currentUser } = useSupabaseAuth();
  const { quizzes, studentResults, questions, getQuizzesByTeacherId, deleteQuiz } = useSupabaseQuizData();
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userQuizzes = getQuizzesByTeacherId(currentUser.id);
      setTeacherQuizzes(userQuizzes);
      setFilteredQuizzes(userQuizzes);
      
      if (userQuizzes.length > 0) {
        toast({
          title: "Quizzes Loaded",
          description: `${userQuizzes.length} quizzes found in your account`,
        });
      }
    }
  }, [currentUser, getQuizzesByTeacherId, quizzes]);

  useEffect(() => {
    // Filter quizzes based on search query
    if (searchQuery.trim() === '') {
      setFilteredQuizzes(teacherQuizzes);
    } else {
      const filtered = teacherQuizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuizzes(filtered);
    }
  }, [searchQuery, teacherQuizzes]);

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
    });
    
    setQuizToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <AuthenticatedLayout userType="teacher">
      <div className="min-h-screen bg-gray-50">
        <TeacherNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Welcome back, {currentUser?.name}. Manage your quizzes and view performance analytics.
            </p>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Quizzes</CardTitle>
                  <FileCheck className="h-5 w-5 text-quiz-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teacherQuizzes.length}</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Quizzes</CardTitle>
                  <Clock className="h-5 w-5 text-quiz-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeQuizzes}</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Students</CardTitle>
                  <User className="h-5 w-5 text-quiz-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalStudentsAttempted}</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Score</CardTitle>
                  <BarChart className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{averageScore}%</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          {/* Quizzes Section with Search Box and Scrollable Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Quizzes</h2>
              <Link to="/teacher/create-quiz">
                <Button size="sm" className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  New Quiz
                </Button>
              </Link>
            </div>
            
            <Card className="mb-8 border-2 border-gray-200">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search quizzes by title..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 transition-all focus:ring-2 focus:ring-quiz-primary"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {filteredQuizzes.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                      {filteredQuizzes.map((quiz, index) => (
                        <motion.div
                          key={quiz.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-quiz-primary">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                                  <CardDescription>
                                    Created on {new Date(quiz.createdAt).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                  ${quiz.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {quiz.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                <div className="flex items-center text-gray-500">
                                  <FileCheck className="h-4 w-4 mr-1" />
                                  <span>{quiz.questions.length} Questions</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{quiz.timeLimit} min</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between pt-0">
                              <div className="flex gap-2">
                                {/* <Link to={`/teacher/edit-quiz/${quiz.id}`} className="flex-1">
                                  <Button variant="outline" size="sm">Edit</Button>
                                </Link> */}
                                <Link to="/teacher/performance" state={{ quizId: quiz.id }} className="flex-1">
                                  <Button variant="outline" size="sm">Results</Button>
                                </Link>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-8 w-8"
                                onClick={() => {
                                  setQuizToDelete(quiz);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'No quizzes match your search' : "You haven't created any quizzes yet."}
                    </p>
                    {!searchQuery && (
                      <Link to="/teacher/create-quiz">
                        <Button>Create Your First Quiz</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Link to="/teacher/question-bank" className="block">
                <Card className="hover:shadow-md transition-all duration-300 hover:bg-gray-50 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-quiz-primary bg-opacity-10 rounded-full mb-3">
                      <BookOpen className="h-8 w-8 text-quiz-primary" />
                    </div>
                    <CardTitle className="mb-2">Question Bank</CardTitle>
                    <CardDescription>
                      Manage questions by subject, chapter, and CO
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/teacher/create-quiz" className="block">
                <Card className="hover:shadow-md transition-all duration-300 hover:bg-gray-50 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-quiz-secondary bg-opacity-10 rounded-full mb-3">
                      <PlusCircle className="h-8 w-8 text-quiz-secondary" />
                    </div>
                    <CardTitle className="mb-2">Create Quiz</CardTitle>
                    <CardDescription>
                      Create a new quiz from your question bank
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/teacher/performance" className="block">
                <Card className="hover:shadow-md transition-all duration-300 hover:bg-gray-50 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="p-3 bg-quiz-accent bg-opacity-10 rounded-full mb-3">
                      <BarChart className="h-8 w-8 text-quiz-accent" />
                    </div>
                    <CardTitle className="mb-2">Performance Analytics</CardTitle>
                    <CardDescription>
                      Review student performance and metrics
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>
        </main>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Quiz</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteQuiz}
                className="bg-red-600 hover:bg-red-700"
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