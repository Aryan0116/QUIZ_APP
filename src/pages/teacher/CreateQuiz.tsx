
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuizData, Question } from '@/contexts/SupabaseQuizDataContext';
import TeacherNavbar from '@/components/TeacherNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Plus, Trash2, Image as ImageIcon, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { currentUser } = useSupabaseAuth();
  const { questions, addQuiz } = useSupabaseQuizData();
  
  // Quiz form data
  const [quizData, setQuizData] = useState({
    title: '',
    timeLimit: 30,
    totalMarks: 0,
  });
  
  // Selected questions and filters
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>(questions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedCOs, setSelectedCOs] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [showWithImages, setShowWithImages] = useState(false);
  
  // Extract unique values for filters
  const subjects = [...new Set(questions.map(q => q.subject))].filter(Boolean);
  const chapters = [...new Set(questions.map(q => q.chapter))].filter(Boolean);
  const cos = [...new Set(questions.map(q => q.co))].filter(Boolean);
  
  // Apply filters
  useEffect(() => {
    let filtered = questions;
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.chapter?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply subject filter
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(q => q.subject && selectedSubjects.includes(q.subject));
    }
    
    // Apply chapter filter
    if (selectedChapters.length > 0) {
      filtered = filtered.filter(q => q.chapter && selectedChapters.includes(q.chapter));
    }
    
    // Apply CO filter
    if (selectedCOs.length > 0) {
      filtered = filtered.filter(q => q.co && selectedCOs.includes(q.co));
    }
    
    // Apply difficulty filter
    if (selectedDifficulty.length > 0) {
      filtered = filtered.filter(q => selectedDifficulty.includes(q.difficultyLevel));
    }
    
    // Filter by image presence
    if (showWithImages) {
      filtered = filtered.filter(q => q.imageUrl && q.imageUrl.trim() !== '');
    }
    
    setFilteredQuestions(filtered);
  }, [questions, searchQuery, selectedSubjects, selectedChapters, selectedCOs, selectedDifficulty, showWithImages]);
  
  // Handle selecting a question
  const toggleQuestionSelection = (questionId: string) => {
    if (selectedQuestionIds.includes(questionId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== questionId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, questionId]);
    }
  };
  
  // Handle checkbox changes for filters
  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subject]);
    } else {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    }
  };
  
  const handleChapterChange = (chapter: string, checked: boolean) => {
    if (checked) {
      setSelectedChapters([...selectedChapters, chapter]);
    } else {
      setSelectedChapters(selectedChapters.filter(c => c !== chapter));
    }
  };
  
  const handleCOChange = (co: string, checked: boolean) => {
    if (checked) {
      setSelectedCOs([...selectedCOs, co]);
    } else {
      setSelectedCOs(selectedCOs.filter(c => c !== co));
    }
  };
  
  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    if (checked) {
      setSelectedDifficulty([...selectedDifficulty, difficulty]);
    } else {
      setSelectedDifficulty(selectedDifficulty.filter(d => d !== difficulty));
    }
  };
  
  // Handle input changes for quiz data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuizData({ ...quizData, [name]: value });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubjects([]);
    setSelectedChapters([]);
    setSelectedCOs([]);
    setSelectedDifficulty([]);
    setShowWithImages(false);
  };
  
  // Get full question objects for selected IDs
  const selectedQuestions = questions.filter(q => selectedQuestionIds.includes(q.id));
  
  // Create the quiz
  const handleCreateQuiz = () => {
    if (!quizData.title) {
      toast({
        title: "Error",
        description: "Please provide a quiz title",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedQuestionIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a quiz",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate total marks (1 mark per question for simplicity)
    const totalMarks = selectedQuestionIds.length * 1;
    
    // Create the quiz with teacher name
    addQuiz({
      title: quizData.title,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      questions: selectedQuestionIds,
      timeLimit: parseInt(quizData.timeLimit.toString()),
      totalMarks,
      active: true,
    });
    
    toast({
      title: "Success",
      description: "Quiz created successfully",
    });
    
    // Navigate to the dashboard
    navigate('/teacher');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Quiz</h1>
            <p className="mt-1 text-gray-500">
              Create a new quiz by selecting questions from your question bank
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
                <CardDescription>
                  Configure your quiz settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={quizData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a title for your quiz"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    name="timeLimit"
                    type="number"
                    min="1"
                    value={quizData.timeLimit}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Selected Questions</h3>
                  <div className="text-2xl font-bold">{selectedQuestionIds.length}</div>
                  <p className="text-sm text-gray-500">
                    Total marks: {selectedQuestionIds.length} (1 mark per question)
                  </p>
                </div>
                
                {selectedQuestionIds.length > 0 && (
                  <div className="mt-4 max-h-[300px] overflow-y-auto border rounded-md p-3 space-y-2">
                    <h4 className="text-sm font-medium">Selected Questions:</h4>
                    {selectedQuestions.map((q, index) => (
                      <div key={q.id} className="flex items-start gap-2 py-2 border-b last:border-0">
                        <span className="text-xs font-medium bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">{q.text}</p>
                          {q.imageUrl && (
                            <div className="mt-1 flex items-center">
                              <ImageIcon className="h-3 w-3 text-gray-500 mr-1" />
                              <span className="text-xs text-gray-500">Has image</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => toggleQuestionSelection(q.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateQuiz}
                >
                  Create Quiz
                </Button>
              </CardFooter>
            </Card>
            
            {/* Filters */}
            {showFilters && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Filter Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="searchQuery"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-with-images" 
                      checked={showWithImages}
                      onCheckedChange={(checked) => setShowWithImages(!!checked)}
                    />
                    <Label 
                      htmlFor="show-with-images"
                      className="text-sm cursor-pointer"
                    >
                      Show only questions with images
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <div className="space-y-2">
                      {['easy', 'medium', 'hard'].map(difficulty => (
                        <div key={difficulty} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`difficulty-${difficulty}`} 
                            checked={selectedDifficulty.includes(difficulty)}
                            onCheckedChange={(checked) => 
                              handleDifficultyChange(difficulty, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`difficulty-${difficulty}`}
                            className="text-sm cursor-pointer capitalize"
                          >
                            {difficulty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Subjects</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {subjects.map(subject => (
                        <div key={subject} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`subject-${subject}`} 
                            checked={selectedSubjects.includes(subject)}
                            onCheckedChange={(checked) => 
                              handleSubjectChange(subject, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`subject-${subject}`}
                            className="text-sm cursor-pointer"
                          >
                            {subject}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Chapters</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {chapters.map(chapter => (
                        <div key={chapter} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`chapter-${chapter}`} 
                            checked={selectedChapters.includes(chapter)}
                            onCheckedChange={(checked) => 
                              handleChapterChange(chapter, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`chapter-${chapter}`}
                            className="text-sm cursor-pointer"
                          >
                            {chapter}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Course Outcomes</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {cos.map(co => (
                        <div key={co} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`co-${co}`} 
                            checked={selectedCOs.includes(co)}
                            onCheckedChange={(checked) => 
                              handleCOChange(co, !!checked)
                            }
                          />
                          <Label 
                            htmlFor={`co-${co}`}
                            className="text-sm cursor-pointer"
                          >
                            {co}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          {/* Question List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Questions</CardTitle>
                <CardDescription>
                  Select questions to include in your quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredQuestions.map(question => (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          selectedQuestionIds.includes(question.id)
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <Checkbox 
                            id={`question-${question.id}`} 
                            checked={selectedQuestionIds.includes(question.id)}
                            onCheckedChange={() => toggleQuestionSelection(question.id)}
                            className="mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <Label 
                              htmlFor={`question-${question.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {question.text}
                            </Label>
                            
                            {/* Display image if present */}
                            {question.imageUrl && (
                              <div className="mt-2 max-w-xs border rounded-md overflow-hidden bg-gray-50">
                                <img 
                                  src={question.imageUrl} 
                                  alt="Question" 
                                  className="w-full h-auto max-h-[100px] object-contain"
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                              </div>
                            )}
                            
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.subject && (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  {question.subject}
                                </Badge>
                              )}
                              {question.chapter && (
                                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                  {question.chapter}
                                </Badge>
                              )}
                              {question.co && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {question.co}
                                </Badge>
                              )}
                              <Badge 
                                className={`
                                  ${question.difficultyLevel === 'easy' && 'bg-green-100 text-green-800 hover:bg-green-100'}
                                  ${question.difficultyLevel === 'medium' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                                  ${question.difficultyLevel === 'hard' && 'bg-red-100 text-red-800 hover:bg-red-100'}
                                `}
                              >
                                {question.difficultyLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">No questions found matching your filters.</p>
                    <Button 
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
