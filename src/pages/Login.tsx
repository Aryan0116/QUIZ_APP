// Likely path: @/pages/Login.tsx or @/components/pages/Login.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'; // Adjust path if needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast'; // Corrected import path assumed

const Login = () => {
  const navigate = useNavigate();
  // Ensure useSupabaseAuth provides these values and types
  const { login, currentUser, isLoading: authLoading } = useSupabaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if user is already logged in and auth is not loading
    if (currentUser && !authLoading) {
      console.log('User already logged in, redirecting to dashboard');
      toast({
        title: "Already logged in",
        description: `Redirecting to your ${currentUser.userType || 'user'} dashboard`, // Handle potential undefined userType
        duration: 3000, // Added duration
      });
      // Ensure currentUser.userType is a valid path segment
      navigate(`/${currentUser.userType || 'dashboard'}`); // Provide fallback path
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      toast({
        title: "Logging in",
        description: "Please wait...",
        duration: 2000, // Added duration (shorter for in-progress)
      });

      await login(email, password);
      // Login successful - redirection is handled by the useEffect hook
      // Optionally show a success toast here if desired
      // toast({ title: "Login Successful", description: "Redirecting...", duration: 1500 });

    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'Invalid credentials or network error. Please try again.';
      setError(errorMessage);

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Added duration
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent rendering login form if user is known and auth finished loading
  if (currentUser && !authLoading) {
     return <div>Loading dashboard...</div>; // Or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Replace with your actual logo/title */}
          <h1 className="text-3xl font-bold text-foreground">
            App Name
          </h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-center space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || authLoading} // Disable during auth check too
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Register
                </Link>
              </p>
              {/* Add Forgot Password link if applicable */}
              {/* <p className="text-sm text-center">
                <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </p> */}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;