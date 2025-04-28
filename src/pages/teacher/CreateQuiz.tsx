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
import { Filter, Plus, Trash2, Image as ImageIcon, Search, X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  
  // Extract unique values for filters
  const subjects = [...new Set(questions.map(q => q.subject))].filter(Boolean);
  
  // Group chapters by subject
  const chaptersBySubject = questions.reduce((acc, question) => {
    if (question.subject && question.chapter) {
      if (!acc[question.subject]) {
        acc[question.subject] = new Set();
      }
      acc[question.subject].add(question.chapter);
    }
    return acc;
  }, {} as Record<string, Set<string>>);
  
  // All chapters and COs for when no subject is selected
  const allChapters = [...new Set(questions.map(q => q.chapter))].filter(Boolean);
  const cos = [...new Set(questions.map(q => q.co))].filter(Boolean);
  
  // Update available chapters when subjects change
  useEffect(() => {
    if (selectedSubjects.length === 0) {
      setAvailableChapters(allChapters);
    } else {
      const chapters = new Set<string>();
      selectedSubjects.forEach(subject => {
        if (chaptersBySubject[subject]) {
          chaptersBySubject[subject].forEach(chapter => chapters.add(chapter));
        }
      });
      setAvailableChapters(Array.from(chapters));
      
      // Remove selected chapters that are no longer available
      setSelectedChapters(prev => 
        prev.filter(chapter => Array.from(chapters).includes(chapter))
      );
    }
  }, [selectedSubjects]);
  
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
  
  // Calculate filter counts for badges
  const filterCount = 
    (selectedSubjects.length > 0 ? 1 : 0) +
    (selectedChapters.length > 0 ? 1 : 0) +
    (selectedCOs.length > 0 ? 1 : 0) +
    (selectedDifficulty.length > 0 ? 1 : 0) +
    (showWithImages ? 1 : 0);
  
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
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quiz Details */}
          <div className="lg:col-span-4">
            <Card className="mb-6">
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
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateQuiz}
                  disabled={selectedQuestionIds.length === 0 || !quizData.title}
                >
                  Create Quiz
                </Button>
              </CardFooter>
            </Card>
            
            {/* Selected Questions Preview */}
            {selectedQuestionIds.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Selected Questions</CardTitle>
                  <CardDescription>
                    {selectedQuestionIds.length} questions selected
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
                  {selectedQuestions.map((q, index) => (
                    <div key={q.id} className="flex items-start gap-2 py-2 border-b last:border-0">
                      <span className="text-xs font-medium bg-purple-100 text-purple-800 rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{q.text}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.subject && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {q.subject}
                            </Badge>
                          )}
                          {q.difficultyLevel && (
                            <Badge 
                              className={`text-xs px-1 py-0 ${
                                q.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                q.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                'bg-red-100 text-red-800 hover:bg-red-100'
                              }`}
                            >
                              {q.difficultyLevel}
                            </Badge>
                          )}
                          {q.imageUrl && (
                            <Badge variant="outline" className="text-xs px-1 py-0 flex items-center gap-1">
                              <ImageIcon className="h-2 w-2" />
                              <span>Image</span>
                            </Badge>
                          )}
                        </div>
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
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column: Question Browser */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>
                    {filteredQuestions.length} questions available
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {filterCount > 0 && (
                    <Badge className="ml-1 bg-purple-600">{filterCount}</Badge>
                  )}
                </Button>
              </CardHeader>
              
              {/* Filter Section */}
              {showFilters && (
                <div className="px-6 pt-2 pb-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <div>
                      <Label>Difficulty Level</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['easy', 'medium', 'hard'].map(difficulty => (
                          <Badge 
                            key={difficulty}
                            variant={selectedDifficulty.includes(difficulty) ? "default" : "outline"}
                            className={`
                              cursor-pointer
                              ${difficulty === 'easy' && selectedDifficulty.includes(difficulty) ? 'bg-green-600' : ''}
                              ${difficulty === 'medium' && selectedDifficulty.includes(difficulty) ? 'bg-yellow-600' : ''}
                              ${difficulty === 'hard' && selectedDifficulty.includes(difficulty) ? 'bg-red-600' : ''}
                            `}
                            onClick={() => handleDifficultyChange(difficulty, !selectedDifficulty.includes(difficulty))}
                          >
                            {difficulty}
                          </Badge>
                        ))}
                        
                        <Badge 
                          variant={showWithImages ? "default" : "outline"}
                          className="cursor-pointer flex items-center gap-1"
                          onClick={() => setShowWithImages(!showWithImages)}
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>With Images</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Subjects Filter */}
                    <div>
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                          <h3 className="text-sm font-medium">Subjects</h3>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="max-h-40 overflow-y-auto pt-2 space-y-1">
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
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    
                    {/* Chapters Filter */}
                    <div>
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                          <h3 className="text-sm font-medium">Chapters</h3>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="max-h-40 overflow-y-auto pt-2 space-y-1">
                          {availableChapters.length > 0 ? (
                            availableChapters.map(chapter => (
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
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              {selectedSubjects.length > 0 ? 
                                "No chapters available for selected subjects" : 
                                "Select a subject to see related chapters"}
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    
                    {/* Course Outcomes Filter */}
                    <div>
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                          <h3 className="text-sm font-medium">Course Outcomes</h3>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="max-h-40 overflow-y-auto pt-2 space-y-1">
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
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                      disabled={filterCount === 0}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Questions List */}
              <CardContent className="pt-4">
                {filteredQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredQuestions.map(question => (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          selectedQuestionIds.includes(question.id)
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } transition-colors`}
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
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {/* Display image if present */}
                              {question.imageUrl && (
                                <div className="max-w-xs border rounded-md overflow-hidden bg-gray-50">
                                  <img 
                                    src={question.imageUrl} 
                                    alt="Question" 
                                    className="w-full h-auto max-h-20 object-contain"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                  />
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-1">
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