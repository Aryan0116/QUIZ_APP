
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const Home = () => {
  const { currentUser, isLoading } = useSupabaseAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
          <span className="text-indigo-600 hover-scale inline-block">Quiz</span>
          <span className="animate-fade-in delay-75">Performance</span>
          <span className="text-emerald-500 hover-scale inline-block animate-fade-in delay-150">Pro</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-slide-in">
          The intelligent platform for creating, managing, and analyzing quizzes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
          ) : currentUser ? (
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 hover-lift transition-all">
              <Link to={`/${currentUser.userType}`}>
                Go to {currentUser.userType === 'teacher' ? 'Teacher' : 'Student'} Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 hover-lift transition-all">
                <Link to="/login?type=teacher">Login as Teacher</Link>
              </Button>
              <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 hover-lift transition-all">
                <Link to="/login?type=student">Login as Student</Link>
              </Button>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md hover-lift transition-all animate-fade-in" style={{ animationDelay: "400ms" }}>
            <h2 className="text-xl font-semibold mb-3 text-indigo-600">For Teachers</h2>
            <p className="text-gray-600 mb-4">Create quizzes, manage question banks, and analyze student performance with our intuitive tools.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover-lift transition-all animate-fade-in" style={{ animationDelay: "500ms" }}>
            <h2 className="text-xl font-semibold mb-3 text-emerald-500">For Students</h2>
            <p className="text-gray-600 mb-4">Take quizzes assigned by your teachers and track your progress over time.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover-lift transition-all animate-fade-in" style={{ animationDelay: "600ms" }}>
            <h2 className="text-xl font-semibold mb-3 text-purple-500">Analytics</h2>
            <p className="text-gray-600 mb-4">Comprehensive analytics to help understand strengths and areas for improvement.</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <p>© 2025 QuizPerformancePro. All rights reserved.</p>
          <p className="mt-2">
            <Link to="/image-upload-demo" className="text-indigo-500 hover:underline hover-scale inline-block">
              Image Upload Demo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
