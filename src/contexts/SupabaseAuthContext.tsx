
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  userType: 'teacher' | 'student';
}

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, userType: 'teacher' | 'student') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session && session.user) {
          // Don't fetch profile directly in callback - use setTimeout to avoid deadlocks
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) {
                console.error('Error fetching user data:', error);
                setCurrentUser(null);
                setIsLoading(false);
                return;
              }

              if (data) {
                setCurrentUser({
                  id: data.id,
                  name: data.name,
                  email: data.email,
                  userType: data.user_type as 'teacher' | 'student'
                });
              } else {
                setCurrentUser(null);
              }
            } catch (error) {
              console.error('Error in auth state change handler:', error);
              setCurrentUser(null);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            setCurrentUser(null);
            setIsLoading(false);
            return;
          }

          if (data) {
            setCurrentUser({
              id: data.id,
              name: data.name,
              email: data.email,
              userType: data.user_type as 'teacher' | 'student'
            });
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('Login successful, user:', data.user?.id);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, userType: 'teacher' | 'student') => {
    setIsLoading(true);
    try {
      console.log('Registering new user:', email, userType);
      
      // Step 1: Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      console.log('Auth signup successful, user ID:', authData.user.id);

      // Step 2: Create the user profile in the users table with the explicit ID from auth
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,  // Critical: Use the same ID from auth
        email,
        name,
        user_type: userType
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Only try to delete auth user if registration fails, but don't block on error
        try {
          // Note: auth.admin.deleteUser is not available in client-side code
          // Instead, we'll sign out the user
          await supabase.auth.signOut();
        } catch (cleanupErr) {
          console.error('Failed to clean up after profile creation failure:', cleanupErr);
        }
          
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('User profile created successfully');

      toast({
        title: "Registration successful",
        description: `Welcome, ${name}!`,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
