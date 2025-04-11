
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'teacher' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { currentUser, isLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
    } else if (!isLoading && userType && currentUser?.userType !== userType) {
      toast({
        title: "Access Denied",
        description: `This page is for ${userType}s only`,
        variant: "destructive",
      });
    }
  }, [currentUser, isLoading, userType]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userType && currentUser.userType !== userType) {
    return <Navigate to={`/${currentUser.userType}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
