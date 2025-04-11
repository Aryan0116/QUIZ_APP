
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  userType: 'teacher' | 'student';
}

const AuthenticatedLayout = ({ children, userType }: AuthenticatedLayoutProps) => {
  const { currentUser, isLoading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast({
        title: "Not authenticated",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!isLoading && currentUser && currentUser.userType !== userType) {
      toast({
        title: "Access Denied",
        description: `This page is for ${userType}s only. Redirecting to your dashboard.`,
        variant: "destructive",
      });
      navigate(`/${currentUser.userType}`);
      return;
    }
  }, [currentUser, isLoading, navigate, userType]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
};

export default AuthenticatedLayout;
