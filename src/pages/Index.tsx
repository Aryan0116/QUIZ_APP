import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Heart, LogOut, User, Menu, ExternalLink } from "lucide-react";

const Home = () => {
  const { currentUser, isLoading } = useSupabaseAuth();
  const [heartBeat, setHeartBeat] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Heart animation effect
  useEffect(() => {
    const heartInterval = setInterval(() => {
      setHeartBeat(prev => !prev);
    }, 1000);
    
    return () => clearInterval(heartInterval);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="w-full bg-white shadow-md py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/favicon.png" 
              alt="DECODE CO-A Logo" 
              className="w-10 h-10 animate-spin"
              style={{ animationDuration: '10s' }}
            />
            <span className="font-bold text-xl text-indigo-600">DECODE CO-A QUIZEE</span>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={toggleMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Desktop link */}
          <a 
            href="https://aryan0116.github.io/DECODE-CO-A/" 
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <ExternalLink className="h-4 w-4" />
            DECODE CO-A
          </a>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <a 
              href="https://aryan0116.github.io/DECODE-CO-A/" 
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ExternalLink className="h-4 w-4" />
              DECODE CO-A
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full text-center">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/favicon.png" 
              alt="DECODE CO-A Logo" 
              className="w-24 h-24 animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="text-indigo-600 hover-scale inline-block">DECODE</span>
            <span className="animate-fade-in delay-75"> CO-A </span>
            <span className="text-emerald-500 hover-scale inline-block animate-fade-in delay-150">QUIZEE</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 animate-slide-in">
            The intelligent platform for creating, managing, and analyzing quizzes, Powered by DECODE CO-A
          </p>

          {/* New Community Message with Gradient */}
          <div className="mb-8 py-4 px-6 rounded-lg shadow-md animate-fade-in bg-gradient-to-r from-indigo-100 via-purple-100 to-emerald-100">
            <p className="text-lg md:text-xl font-medium bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent">
              THIS IS A COMMUNITY QUIZEE APP TO HELP PRACTICE, COMPETE AND GROW
            </p>
          </div>
          
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
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-indigo-900 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="flex items-center justify-center gap-2 text-lg">
            Made with 
            <Heart 
              className={`text-red-500 ${heartBeat ? 'scale-125' : 'scale-100'}`} 
              fill="currentColor" 
              size={20}
            /> 
            by DECODE CO-A TEAM
          </p>
          <p className="mt-2 text-indigo-200">© 2025 DECODE CO-A. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;