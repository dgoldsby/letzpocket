import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Logo from './Logo';
import { mailchimpService } from '../services/mailchimp';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // For signup, add to Mailchimp first
      if (!isLogin) {
        const mailchimpResult = await mailchimpService.addUser(
          email,
          firstName || 'User',
          lastName || '',
          undefined,
          undefined,
          'Free Trial'
        );

        if (!mailchimpResult.success) {
          setError('Failed to create account. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // TODO: Integrate with authentication service
      // For now, simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: 'user_' + Date.now(),
        email,
        firstName: firstName || 'John',
        lastName: lastName || 'Doe',
        createdAt: new Date().toISOString()
      };

      // Show success message for signup
      if (!isLogin) {
        setShowSuccess(true);
        setTimeout(() => {
          onAuthSuccess(mockUser);
          handleClose();
        }, 3000); // Show success message for 3 seconds
      } else {
        onAuthSuccess(mockUser);
        handleClose();
      }
    } catch (err) {
      setError(isLogin ? 'Invalid email or password' : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setError('');
    setShowSuccess(false);
    onClose();
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setShowSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Logo size="small" />
          </div>
          {!showSuccess ? (
            <>
              <CardTitle className="text-2xl">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to access your property management dashboard'
                  : 'Join thousands of UK landlords managing their properties smarter'
                }
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Welcome to LetzPocket!
              </CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700">
                Thank you for signing up to LetzPocket - we'll be in touch with news, updates and offers
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-700">
                  <strong>Next steps:</strong> Check your email for confirmation and tips to get started with your property management journey.
                </p>
              </div>
              <Button 
                onClick={handleClose} 
                className="w-full"
                variant="outline"
              >
                Get Started
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" role="form">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-lp-blue-600 hover:text-lp-blue-700 text-sm"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </form>
          )}

          {!showSuccess && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
                <a href="#" className="text-lp-blue-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-lp-blue-600 hover:underline">Privacy Policy</a>.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
