import { useState, useEffect, useRef } from 'react';
import { useQuizData } from '@/contexts/QuizDataContext';
import TeacherNavbar from '@/components/TeacherNavbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Copy, Download, Filter, X, Image as ImageIcon, Search, Plus, ChevronDown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/components/ui/use-toast';
import { useToast } from "@/components/ui/use-toast";
import { getCSVTemplate, parseCSV } from '@/utils/csvImport';
import { cn } from '@/lib/utils';

// Define subject chapter mapping
const SUBJECT_CHAPTERS = {
  "Computer Organization": [
    "Basics of Computers and Von Neumann Architecture",
    "Number Systems ALU Design Multiplication and Division Algorithm IEEE 754 Standard",
    "Instruction Formats and Addressing Modes",
    "Memory Hierarchy: Cache Virtual Memory and CPU-Memory Interfacing",
    "Control Unit Design Pipelining and RISC vs CISC Architectures",
    "I/O Organization: Handshaking Polling Interrupts and DMA"
  ],
  "Computer Architecture": [
    "Fundamentals of Computer Architecture and Performance Evaluation and Optimization",
    "Pipelining",
    "Hierarchical Memory Architecture and Management",
    "Instruction-Level Parallelism and Advanced Processor Architectures",
    "Array and Vector Processors",
    "Multiprocessor and Non-von Neumann Architectures"
  ]
};

const QuestionBank = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion, addBulkQuestions } = useQuizData();
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [co, setCo] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [imageUrl, setImageUrl] = useState('');
  const [isCSVSampleDialogOpen, setIsCSVSampleDialogOpen] = useState(false);
  const [csvContent, setCSVContent] = useState('');
  const [isCSVImportDialogOpen, setIsCSVImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Filter states
  const [filteredQuestions, setFilteredQuestions] = useState<typeof questions>(questions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedCOs, setSelectedCOs] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique values for filters
  const uniqueSubjects = [...new Set(questions.map(q => q.subject))].filter(Boolean);
  const uniqueChapters = [...new Set(questions.map(q => q.chapter))].filter(Boolean);
  const uniqueCOs = [...new Set(questions.map(q => q.co))].filter(Boolean);

  // Get filtered chapters based on selected subjects in filter
  const getFilteredChapters = () => {
    if (selectedSubjects.length === 0) {
      // If no subjects selected, show all chapters
      return uniqueChapters;
    }
    
    // Get chapters for selected subjects
    const chapters = selectedSubjects.flatMap(sub => SUBJECT_CHAPTERS[sub as keyof typeof SUBJECT_CHAPTERS] || []);
    
    // Filter to only include chapters that exist in our questions
    return chapters.filter(chap => uniqueChapters.includes(chap));
  };

  // Apply filters
  useEffect(() => {
    let filtered = questions;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.co?.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, selectedSubjects, selectedChapters, selectedCOs, selectedDifficulty]);

  const handleAddQuestion = () => {
    if (!text || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const options = [optionA, optionB, optionC, optionD];
    if (!options.includes(correctAnswer)) {
      toast({
        title: "Validation Error",
        description: "Correct answer must be one of the options",
        variant: "destructive"
      });
      return;
    }

    addQuestion({
      text,
      options: [optionA, optionB, optionC, optionD],
      correctAnswer,
      subject,
      chapter,
      co,
      difficultyLevel,
      imageUrl: imagePreview || imageUrl,
    });

    // Clear the form
    clearForm();

    toast({
      title: "Success",
      description: "Question added successfully",
    });
  };

  const clearForm = () => {
    setText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('');
    setSubject('');
    setChapter('');
    setCo('');
    setDifficultyLevel('easy');
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid JPEG, JPG, or PNG image",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      // Resize image and convert to base64
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64
          const resizedImage = canvas.toDataURL(file.type);
          setImagePreview(resizedImage);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onCopyCSVTemplate = () => {
    const csvTemplate = getCSVTemplate();
    navigator.clipboard.writeText(csvTemplate);
    toast({
      title: "Copied",
      description: "CSV template copied to clipboard",
    });
  };

  const onDownloadCSVTemplate = () => {
    const csvTemplate = getCSVTemplate();
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCSVFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'text/csv') {
      toast({
        title: "Error",
        description: "Please upload a valid CSV file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCSVContent(content);
    };
    reader.readAsText(file);
  };

  const onImportCSV = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "CSV content is empty",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsedQuestions = parseCSV(csvContent);
      addBulkQuestions(parsedQuestions);
      toast({
        title: "Success",
        description: `${parsedQuestions.length} questions imported successfully`,
      });
      setIsCSVImportDialogOpen(false);
      setCSVContent('');
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import questions. Please check the CSV format.",
        variant: "destructive",
      });
    }
  };

  const onDelete = (questionId: string) => {
    deleteQuestion(questionId);
    toast({
      title: "Success",
      description: "Question deleted successfully",
    });
  };

  const handleFilterToggle = (filter: string, value: string) => {
    switch (filter) {
      case 'subject':
        // When toggling subjects, we need to handle dependent chapters
        const newSelectedSubjects = selectedSubjects.includes(value) 
          ? selectedSubjects.filter(s => s !== value) 
          : [...selectedSubjects, value];
        
        setSelectedSubjects(newSelectedSubjects);
        
        // If a subject is removed, also remove its chapters from selected chapters
        if (selectedSubjects.includes(value) && !newSelectedSubjects.includes(value)) {
          const subjectChapters = SUBJECT_CHAPTERS[value as keyof typeof SUBJECT_CHAPTERS] || [];
          setSelectedChapters(prev => prev.filter(ch => !subjectChapters.includes(ch)));
        }
        break;
        
      case 'chapter':
        setSelectedChapters(prev =>
          prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
        break;
        
      case 'co':
        setSelectedCOs(prev =>
          prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
        break;
        
      case 'difficulty':
        setSelectedDifficulty(prev =>
          prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
        );
        break;
        
      default:
        break;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubjects([]);
    setSelectedChapters([]);
    setSelectedCOs([]);
    setSelectedDifficulty([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-1 text-gray-500">
            Manage your questions by subject, chapter, and CO
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="add">Add Questions</TabsTrigger>
            <TabsTrigger value="view">View Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Question Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Question</CardTitle>
                    <CardDescription>
                      Fill in the details to create a new question
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto pr-6 grid gap-5">
                    <div>
                      <Label htmlFor="text">Question Text</Label>
                      <Textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter the question text"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="optionA">Option A</Label>
                        <Input
                          type="text"
                          id="optionA"
                          value={optionA}
                          onChange={(e) => setOptionA(e.target.value)}
                          placeholder="Enter option A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="optionB">Option B</Label>
                        <Input
                          type="text"
                          id="optionB"
                          value={optionB}
                          onChange={(e) => setOptionB(e.target.value)}
                          placeholder="Enter option B"
                        />
                      </div>
                      <div>
                        <Label htmlFor="optionC">Option C</Label>
                        <Input
                          type="text"
                          id="optionC"
                          value={optionC}
                          onChange={(e) => setOptionC(e.target.value)}
                          placeholder="Enter option C"
                        />
                      </div>
                      <div>
                        <Label htmlFor="optionD">Option D</Label>
                        <Input
                          type="text"
                          id="optionD"
                          value={optionD}
                          onChange={(e) => setOptionD(e.target.value)}
                          placeholder="Enter option D"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="correctAnswer">Correct Answer</Label>
                      <Select
                        value={correctAnswer}
                        onValueChange={setCorrectAnswer}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {optionA && <SelectItem value={optionA}>Option A: {optionA}</SelectItem>}
                          {optionB && <SelectItem value={optionB}>Option B: {optionB}</SelectItem>}
                          {optionC && <SelectItem value={optionC}>Option C: {optionC}</SelectItem>}
                          {optionD && <SelectItem value={optionD}>Option D: {optionD}</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                          value={subject}
                          onValueChange={(value) => {
                            setSubject(value);
                            setChapter(""); // Reset chapter when subject changes
                          }}
                        >
                          <SelectTrigger id="subject">
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Organization">Computer Organization (CO)</SelectItem>
                            <SelectItem value="Computer Architecture">Computer Architecture (CA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="chapter">Chapter</Label>
                        <Select
                          value={chapter}
                          onValueChange={setChapter}
                          disabled={!subject} // Disable if subject not selected
                        >
                          <SelectTrigger id="chapter">
                            <SelectValue placeholder="Select a chapter" />
                          </SelectTrigger>
                          <SelectContent>
                            {subject && SUBJECT_CHAPTERS[subject as keyof typeof SUBJECT_CHAPTERS]?.map((chap) => (
                              <SelectItem key={chap} value={chap}>{chap}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="co">CO (Course Outcome)</Label>
                        <Select
                          value={co}
                          onValueChange={setCo}
                        >
                          <SelectTrigger id="co">
                            <SelectValue placeholder="Select CO" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CO1">CO1</SelectItem>
                            <SelectItem value="CO2">CO2</SelectItem>
                            <SelectItem value="CO3">CO3</SelectItem>
                            <SelectItem value="CO4">CO4</SelectItem>
                            <SelectItem value="CO5">CO5</SelectItem>
                            <SelectItem value="CO6">CO6</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                      <Select value={difficultyLevel} onValueChange={(value) => setDifficultyLevel(value as 'easy' | 'medium' | 'hard')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="image">Question Image (optional)</Label>
                      <div className="mt-1 flex items-center gap-4">
                        <Input
                          type="file"
                          id="image"
                          accept="image/jpeg,image/jpg,image/png"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPEG, JPG, PNG (max 5MB)
                      </p>
                      {imagePreview && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Image Preview:</p>
                          <div className="max-w-[300px] border rounded-md overflow-hidden">
                            <img
                              src={imagePreview}
                              alt="Question preview"
                              className="w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">External Image URL (optional)</Label>
                      <Input
                        type="text"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        disabled={!!imagePreview}
                      />
                      {imagePreview && (
                        <p className="text-xs text-gray-500 mt-1">
                          External URL is disabled while an uploaded image is selected
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={clearForm}>
                      Clear Form
                    </Button>
                    <Button onClick={handleAddQuestion} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* CSV Import */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Import</CardTitle>
                    <CardDescription>
                      Import multiple questions at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog open={isCSVImportDialogOpen} onOpenChange={setIsCSVImportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="secondary">
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Import CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Import Questions from CSV</DialogTitle>
                          <DialogDescription>
                            Upload a CSV file or paste CSV content to import multiple questions at once.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div>
                            <Label htmlFor="csvFile" className="mb-2 block">Upload CSV file</Label>
                            <Input
                              id="csvFile"
                              type="file"
                              accept=".csv"
                              ref={csvFileInputRef}
                              onChange={handleCSVFileUpload}
                            />
                          </div>
                          <div className="text-center text-sm text-gray-500">- OR -</div>
                          <div>
                            <Label htmlFor="csvContent" className="mb-2 block">Paste CSV content</Label>
                            <Textarea
                              id="csvContent"
                              placeholder="Paste your CSV content here..."
                              value={csvContent}
                              onChange={(e) => setCSVContent(e.target.value)}
                              rows={6}
                            />
                          </div>
                        </div>
                        <DialogFooter className="sm:justify-between">
                          <Button type="button" variant="outline" onClick={() => setIsCSVImportDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={onImportCSV}>
                            Import
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <div>
                      <p className="text-sm mb-3">Download or copy our CSV template:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={onCopyCSVTemplate} className="w-full text-xs">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Template
                        </Button>
                        <Button variant="outline" onClick={onDownloadCSVTemplate} className="w-full text-xs">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium mb-2">CSV Format Example:</h4>
                      <div className="text-xs bg-gray-50 p-2 rounded-md max-h-[200px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {getCSVTemplate().split('\n').slice(0, 3).join('\n')}
                        </pre>
                      </div>
                      <Dialog open={isCSVSampleDialogOpen} onOpenChange={setIsCSVSampleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-xs mt-1 p-0 h-auto">
                            View complete template
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>CSV Template</DialogTitle>
                            <DialogDescription>
                              Here is a sample CSV template you can use to import questions.
                            </DialogDescription>
                          </DialogHeader>
                          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded-md max-h-[300px] overflow-y-auto">
                            {getCSVTemplate()}
                          </pre>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button>Close</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="view" className="mt-6">
  <div className="grid grid-cols-1 gap-6">
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Question Library</CardTitle>
            <CardDescription>
              Browse and manage your existing questions
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {(selectedSubjects.length > 0 || selectedChapters.length > 0 ||
                    selectedCOs.length > 0 || selectedDifficulty.length > 0) && (
                    <Badge className="ml-1 px-1.5 py-0 h-5 text-[10px]">
                      {selectedSubjects.length + selectedChapters.length +
                        selectedCOs.length + selectedDifficulty.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium mb-1">Filters</h3>
                  <p className="text-sm text-muted-foreground">
                    Filter questions by attributes
                  </p>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto space-y-5">
                  {/* Subject filter */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Subject</h4>
                    <div className="space-y-2">
                      {uniqueSubjects.map(sub => (
                        <div key={sub} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`subject-${sub}`} 
                            checked={selectedSubjects.includes(sub)}
                            onCheckedChange={() => handleFilterToggle('subject', sub)}
                          />
                          <label
                            htmlFor={`subject-${sub}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {sub}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chapter filter */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Chapter</h4>
                    <div className="space-y-2">
                      {getFilteredChapters().map(chap => (
                        <div key={chap} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`chapter-${chap}`} 
                            checked={selectedChapters.includes(chap)}
                            onCheckedChange={() => handleFilterToggle('chapter', chap)}
                          />
                          <label
                            htmlFor={`chapter-${chap}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {chap}
                          </label>
                        </div>
                      ))}
                      {getFilteredChapters().length === 0 && (
                        <p className="text-sm text-gray-500 italic">
                          {selectedSubjects.length > 0 
                            ? "No chapters available for selected subjects" 
                            : "Select a subject to see its chapters"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CO filter */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Course Outcome (CO)</h4>
                    <div className="space-y-2">
                      {uniqueCOs.map(co => (
                        <div key={co} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`co-${co}`} 
                            checked={selectedCOs.includes(co)}
                            onCheckedChange={() => handleFilterToggle('co', co)}
                          />
                          <label
                            htmlFor={`co-${co}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {co}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty filter */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Difficulty Level</h4>
                    <div className="space-y-2">
                      {['easy', 'medium', 'hard'].map(diff => (
                        <div key={diff} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`difficulty-${diff}`} 
                            checked={selectedDifficulty.includes(diff)}
                            onCheckedChange={() => handleFilterToggle('difficulty', diff)}
                          />
                          <label
                            htmlFor={`difficulty-${diff}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardHeader className="p-0 pb-0">
        {/* Active filters */}
        {(selectedSubjects.length > 0 || selectedChapters.length > 0 || 
          selectedCOs.length > 0 || selectedDifficulty.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-3 px-6 pb-3">
            {selectedSubjects.map(sub => (
              <Badge key={`badge-sub-${sub}`} variant="secondary" className="pl-2 pr-1 py-0 h-6">
                <span className="mr-1">{sub}</span>
                <Button
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterToggle('subject', sub)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedChapters.map(chap => (
              <Badge key={`badge-chap-${chap}`} variant="secondary" className="pl-2 pr-1 py-0 h-6">
                <span className="mr-1">{chap}</span>
                <Button
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterToggle('chapter', chap)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedCOs.map(co => (
              <Badge key={`badge-co-${co}`} variant="secondary" className="pl-2 pr-1 py-0 h-6">
                <span className="mr-1">{co}</span>
                <Button
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterToggle('co', co)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedDifficulty.map(diff => (
              <Badge key={`badge-diff-${diff}`} variant="secondary" className="pl-2 pr-1 py-0 h-6">
                <span className="mr-1 capitalize">{diff}</span>
                <Button
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterToggle('difficulty', diff)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Question list */}
        {filteredQuestions.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredQuestions.map(question => (
              <Card key={question.id} className="border overflow-hidden h-full">
                <div className={cn(
                  "px-4 py-3 border-b",
                  question.difficultyLevel === 'easy' && "bg-green-50 border-green-100",
                  question.difficultyLevel === 'medium' && "bg-yellow-50 border-yellow-100",
                  question.difficultyLevel === 'hard' && "bg-red-50 border-red-100"
                )}>
                  <h3 className="font-medium text-sm line-clamp-2">{question.text}</h3>
                </div>

                <div className="p-4 space-y-3">
                  {/* Question image */}
                  {question.imageUrl && (
                    <div className="border rounded-md overflow-hidden mb-3 bg-gray-50">
                      <img
                        src={question.imageUrl}
                        alt="Question"
                        className="w-full h-auto max-h-[140px] object-contain"
                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                      />
                    </div>
                  )}

                  {/* Question options */}
                  <div className="space-y-1.5 text-sm">
                    {question.options.map((option, index) => (
                      <div
                        key={`${question.id}-option-${index}`}
                        className={cn(
                          "px-2 py-1 rounded",
                          option === question.correctAnswer ? "bg-green-100 border-green-200 text-green-800" : "bg-gray-50"
                        )}
                      >
                        <span className="font-medium mr-1">
                          {String.fromCharCode(65 + index)}:
                        </span>
                        {option}
                        {option === question.correctAnswer && (
                          <span className="ml-1 text-xs italic">(correct)</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Question metadata */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {question.subject && (
                      <Badge variant="outline" className="bg-blue-50 text-xs">
                        {question.subject}
                      </Badge>
                    )}
                    {question.chapter && (
                      <Badge variant="outline" className="bg-purple-50 text-xs">
                        {question.chapter}
                      </Badge>
                    )}
                    {question.co && (
                      <Badge variant="outline" className="bg-cyan-50 text-xs">
                        {question.co}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        question.difficultyLevel === 'easy' && "bg-green-50",
                        question.difficultyLevel === 'medium' && "bg-yellow-50",
                        question.difficultyLevel === 'hard' && "bg-red-50"
                      )}
                    >
                      {question.difficultyLevel}
                    </Badge>
                  </div>
                </div>

                <CardFooter className="flex justify-end border-t p-3 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>
                          Make changes to the question details below.
                        </DialogDescription>
                      </DialogHeader>
                      {/* Edit form would go here */}
                      <DialogFooter>
                        <Button type="button">Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Question</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this question? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFilterOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => onDelete(question.id)} 
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No questions found</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              {questions.length > 0
                ? "No questions match your current filters. Try adjusting your search criteria."
                : "Your question bank is empty. Start by adding questions or importing from a CSV file."}
            </p>
            {questions.length > 0 && (
              <Button onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
            {questions.length === 0 && activeTab === 'view' && (
              <Button onClick={() => setActiveTab('add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add new question
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-sm text-gray-500">
          {filteredQuestions.length} of {questions.length} questions
        </p>
        {/* Pagination could go here */}
      </CardFooter>
    </Card>
  </div>
</TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default QuestionBank;