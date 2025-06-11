import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData } from '@/contexts/SupabaseQuizDataContext';
import StudentNavbar from '@/components/StudentNavbar';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardCheck, BarChart, Award, Search, Calendar, Tag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const { currentUser } = useSupabaseAuth();
  const navigate = useNavigate();
  const { quizzes, studentResults, getStudentResultsByStudentId } = useSupabaseQuizData();
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [studentQuizResults, setStudentQuizResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Load active quizzes
      const availableQuizzes = quizzes.filter(quiz => quiz.active);
      setActiveQuizzes(availableQuizzes);
      setFilteredQuizzes(availableQuizzes);
      
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

  useEffect(() => {
    const completedQuizIds = studentQuizResults.map(result => result.quizId);
    const pendingQuizzes = activeQuizzes.filter(quiz => !completedQuizIds.includes(quiz.id));
    
    let filtered = pendingQuizzes;
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(quiz => quiz.category === filterCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        quiz.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredQuizzes(filtered);
  }, [activeQuizzes, studentQuizResults, searchTerm, filterCategory]);

  // Calculate performance metrics
  const completedQuizIds = studentQuizResults.map(result => result.quizId);
  const pendingQuizzes = activeQuizzes.filter(quiz => !completedQuizIds.includes(quiz.id));
  
  const averageScore = studentQuizResults.length > 0
    ? (studentQuizResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks * 100), 0) / studentQuizResults.length).toFixed(1)
    : 0;
  
  const bestScore = studentQuizResults.length > 0
    ? Math.max(...studentQuizResults.map(result => (result.score / result.totalMarks * 100))).toFixed(1)
    : 0;

  // Get all unique categories
  const categories = ['all', ...new Set(activeQuizzes.map(quiz => quiz.category).filter(Boolean))];

  return (
    <AuthenticatedLayout userType="student">
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar/>
        <motion.header 
          className="bg-white shadow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="mt-1 text-gray-500">Welcome back, {currentUser?.name}</p>
              </div>
              <Button 
                onClick={() => navigate('/student/results')}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                View Recent Results
              </Button>
            </div>
          </div>
        </motion.header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Performance Summary */}
          <motion.div 
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Available Quizzes</CardTitle>
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingQuizzes.length}</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Completed Quizzes</CardTitle>
                  <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{studentQuizResults.length}</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
                  <BarChart className="h-5 w-5 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{averageScore}%</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Best Score</CardTitle>
                  <Award className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{bestScore}%</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          {/* Available Quizzes with Search and Filter */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Available Quizzes</h2>
              <div className="text-sm text-gray-500">
                {filteredQuizzes.length} of {pendingQuizzes.length} quizzes shown
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              {/* Search and filter controls */}
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    className="pl-10 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      className="pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      {/* {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))} */}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Scrollable quiz container */}
              <div className="relative overflow-hidden">
                <div className="max-h-96 overflow-y-auto pr-2">
                  {filteredQuizzes.length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredQuizzes.map(quiz => (
                        <motion.div 
                          key={quiz.id}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Card className="h-full border-l-4 border-indigo-500 hover:shadow-lg transition-all">
                            <CardHeader>
                              <CardTitle className="flex items-center">
                                {quiz.title}
                                {quiz.difficulty && (
                                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {quiz.difficulty}
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Created by {quiz.teacherName}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between text-sm text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <ClipboardCheck className="h-4 w-4" />
                                  Questions: {quiz.questions.length}
                                </span>
                                <span>Marks: {quiz.totalMarks}</span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Time Limit: {quiz.timeLimit} min</span>
                              </div>
                              {quiz.category && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {quiz.category}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter>
                              <Link to={`/student/quiz/${quiz.id}`} className="w-full">
                                <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all">
                                  Start Quiz
                                </Button>
                              </Link>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">No quizzes match your search criteria.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterCategory('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
                {/* Shadow overlay for scroll indication */}
                <div className="h-8 bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 right-0 pointer-events-none"></div>
              </div>
            </div>
          </motion.div>
          
          {/* Recent Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
            {studentQuizResults.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {studentQuizResults.slice(0, 6).map(result => (
                  <motion.div 
                    key={result.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <CardTitle>{result.quizTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Completed on {new Date(result.submittedAt).toLocaleDateString()}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">
                            Score: {result.score}/{result.totalMarks}
                          </span>
                          <span className={`text-lg font-semibold px-2 py-1 rounded-md ${
                            (result.score / result.totalMarks) >= 0.7 
                              ? 'bg-green-100 text-green-800' 
                              : (result.score / result.totalMarks) >= 0.4 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {((result.score / result.totalMarks) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link to="/student/results" state={{ resultId: result.id }} className="w-full">
                          <Button variant="outline" className="w-full hover:bg-gray-50 transition-colors">
                            View Details
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">You haven't completed any quizzes yet.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </AuthenticatedLayout>
  );
};

export default StudentDashboard;