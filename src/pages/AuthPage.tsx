import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, signUp, user } = useAuth();

  // Get role from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role');
    if (urlRole === 'teacher' || urlRole === 'student') {
      setRole(urlRole);
    }
  }, []);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, displayName, role);
      }

      if (result.error) {
        setError(result.error.message);
      } else if (!isLogin) {
        setError('Please check your email to verify your account before signing in.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[hsl(var(--pictoblox-purple))]">
            {isLogin ? 'Welcome Back!' : `Join as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
          </CardTitle>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to continue your coding journey' : `Create ${role} account to start coding`}
          </p>
          {!isLogin && (
            <Badge 
              variant="outline" 
              className={`mx-auto ${
                role === 'teacher' 
                  ? 'text-orange-600 border-orange-300 bg-orange-50' 
                  : 'text-blue-600 border-blue-300 bg-blue-50'
              }`}
            >
              {role === 'teacher' ? <GraduationCap className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
              {role === 'teacher' ? 'Teacher Account' : 'Student Account'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={role === 'student' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('student')}
                      className={role === 'student' ? 'bg-[hsl(var(--pictoblox-blue))]' : ''}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Student
                    </Button>
                    <Button
                      type="button"
                      variant={role === 'teacher' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRole('teacher')}
                      className={role === 'teacher' ? 'bg-[hsl(var(--pictoblox-orange))]' : ''}
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Teacher
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[hsl(var(--pictoblox-purple))] hover:bg-[hsl(var(--pictoblox-purple-dark))]"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Button
                variant="link"
                className="ml-1 p-0 h-auto text-[hsl(var(--pictoblox-purple))] hover:text-[hsl(var(--pictoblox-purple-dark))]"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                }}
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;