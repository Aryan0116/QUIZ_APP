import React, { useEffect, useState } from 'react';
import { Clock, Code, ZapIcon } from 'lucide-react';

interface LoaderProps {
  duration?: number;
  onLoadComplete?: () => void;
}

const Loader: React.FC<LoaderProps> = ({
  duration = 2500,
  onLoadComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);
  
  const loadingTexts = [
    "Initializing quiz data...",
    "Preparing challenge modules...",
    "Loading brain teasers..."
  ];

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      // Calculate exact percentage completion with precision
      const calculatedProgress = (elapsed / duration) * 100;
      // For progress bar display, ensure it doesn't exceed 100%
      const newProgress = Math.min(100, calculatedProgress);
      
      // Round the progress value for display consistency
      setProgress(Math.round(newProgress));
      
      // Update loading phase based on progress
      if (newProgress < 33) {
        setLoadingPhase(0);
      } else if (newProgress < 66) {
        setLoadingPhase(1);
      } else {
        setLoadingPhase(2);
      }
      
      if (now < endTime) {
        requestAnimationFrame(updateProgress);
      } else {
        // Ensure we set progress to exactly 100% at the end
        setProgress(100);
        
        // Add a small delay to ensure the user sees 100% before completion
        setTimeout(() => {
          if (onLoadComplete) {
            onLoadComplete();
          }
        }, 400); // 400ms delay to see the completed progress
      }
    };
    
    requestAnimationFrame(updateProgress);
    
    return () => {
      // Cleanup if needed
    };
  }, [duration, onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-tr from-blue-900 via-indigo-800 to-violet-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 h-40 w-40 animate-pulse rounded-full bg-blue-400"></div>
        <div className="absolute top-3/4 right-1/4 h-32 w-32 animate-pulse rounded-full bg-violet-400"></div>
        <div className="absolute bottom-1/4 right-1/3 h-24 w-24 animate-pulse rounded-full bg-indigo-400"></div>
      </div>
      
      {/* Main loader container */}
      <div className="relative flex flex-col items-center justify-center px-4 py-8 backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 shadow-2xl max-w-md mx-4">
        {/* Logo and spinner */}
        <div className="relative flex h-32 w-32 items-center justify-center mb-6">
          <div className="absolute h-32 w-32 animate-spin rounded-full border-4 border-t-indigo-300 border-r-transparent border-b-indigo-100 border-l-transparent"></div>
          <div className="absolute h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-400 shadow-lg flex items-center justify-center">
            <ZapIcon size={32} className="text-white" />
          </div>
        </div>
        
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-blue-300">DECODE</span>
            <span> CO-A </span>
            <span className="text-emerald-300">QUIZEE</span>
          </h1>
          <p className="text-indigo-200 mt-2 text-sm">Challenge and Test your knowledge</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-900 bg-opacity-50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-300 transition-all duration-100 ease-out"
              style={{ width: `${Math.round(progress)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-center text-sm font-medium text-indigo-100">
            {loadingTexts[loadingPhase]}
          </div>
        </div>
        
        {/* Loading indicators */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex flex-col items-center">
            <Code className={`${progress > 30 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 30 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Modules</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-px w-8 ${progress > 60 ? 'bg-emerald-300' : 'bg-indigo-300/40'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <Clock className={`${progress > 60 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 60 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Questions</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`h-px w-8 ${progress > 90 ? 'bg-emerald-300' : 'bg-indigo-300/40'}`}></div>
          </div>
          <div className="flex flex-col items-center">
            <ZapIcon className={`${progress > 90 ? 'text-emerald-300' : 'text-indigo-300/40'} mb-2`} size={20} />
            <span className={`text-xs ${progress > 90 ? 'text-emerald-300' : 'text-indigo-300/40'}`}>Ready</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-indigo-200/60 mt-8">
        {progress}% Complete
      </div>
    </div>
  );
};

export default Loader;