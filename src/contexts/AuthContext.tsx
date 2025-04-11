
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'teacher' | 'student';
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string, userType: 'teacher' | 'student') => Promise<void>;
  register: (name: string, email: string, password: string, userType: 'teacher' | 'student') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo database for users (would be replaced with a real backend)
const demoUsers: User[] = [
  { id: '1', name: 'Teacher Demo', email: 'teacher@example.com', userType: 'teacher' },
  { id: '2', name: 'Student Demo', email: 'student@example.com', userType: 'student' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('quizUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, userType: 'teacher' | 'student') => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching email and type
      const user = demoUsers.find(u => u.email === email && u.userType === userType);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('quizUser', JSON.stringify(user));
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      if (demoUsers.some(u => u.email === email)) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user (in a real app, this would be saved to a database)
      const newUser: User = {
        id: `${demoUsers.length + 1}`,
        name,
        email,
        userType,
      };
      
      // In a real app, we'd push to the database here
      // demoUsers.push(newUser);
      
      setCurrentUser(newUser);
      localStorage.setItem('quizUser', JSON.stringify(newUser));
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${name}!`,
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('quizUser');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
