
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { SupabaseQuizDataProvider } from "./contexts/SupabaseQuizDataContext";
import Home from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/teacher/Dashboard";
import QuestionBank from "./pages/teacher/QuestionBank";
import CreateQuiz from "./pages/teacher/CreateQuiz";
import Performance from "./pages/teacher/Performance";
import StudentDashboard from "./pages/student/Dashboard";
import AttemptQuiz from "./pages/student/AttemptQuiz";
import StudentResults from "./pages/student/Results";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ImageUploadDemo from "./pages/ImageUploadDemo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <SupabaseQuizDataProvider>
        <TooltipProvider>
          
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/image-upload-demo" element={<ImageUploadDemo />} />
              
              {/* Teacher Routes - Using ProtectedRoute for proper authentication */}
              <Route 
                path="/teacher" 
                element={
                  <ProtectedRoute userType="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/question-bank" 
                element={
                  <ProtectedRoute userType="teacher">
                    <QuestionBank />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/create-quiz" 
                element={
                  <ProtectedRoute userType="teacher">
                    <CreateQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/performance" 
                element={
                  <ProtectedRoute userType="teacher">
                    <Performance />
                  </ProtectedRoute>
                } 
              />
              
              {/* Student Routes */}
              <Route 
                path="/student" 
                element={
                  <ProtectedRoute userType="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/quiz/:quizId" 
                element={
                  <ProtectedRoute userType="student">
                    <AttemptQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/results" 
                element={
                  <ProtectedRoute userType="student">
                    <StudentResults />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SupabaseQuizDataProvider>
    </SupabaseAuthProvider>
    <Toaster />
  </QueryClientProvider>
);

export default App;
