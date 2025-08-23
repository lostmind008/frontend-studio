#!/usr/bin/env typescript
/**
 * File: /frontend/src/pages/Auth.tsx
 * Project: Veo 3 Video Generator - Complete Frontend Redesign
 * Purpose: Split-screen authentication page with enhanced features
 * Dependencies: react-hook-form, zustand auth store, lucide icons
 * Created: 2025-08-15 - Claude vs V0.dev Comparison Build
 * 
 * FEATURES IMPLEMENTED:
 * - Split-screen layout: neural animation left, auth form right
 * - Enhanced password strength indicator
 * - Remember me functionality
 * - Social login placeholders
 * - Smooth transitions between login/register
 * - Enhanced error handling with field-specific errors
 * - Auto-redirect after successful authentication
 * - Integration with persistent auth store
 * 
 * DESIGN APPROACH:
 * - Modern, professional appearance
 * - Neural network aesthetic maintained
 * - Mobile-responsive design
 * - Accessibility compliant
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { RegisterData } from '../services/api';
import { 
  User, 
  Lock, 
  Mail, 
  Loader, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Shield,
  Sparkles,
  ArrowRight,
  Github,
  Chrome
} from 'lucide-react';
import { NeuralBackground } from '../components/effects/NeuralBackground';

// Password strength checker
const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  Object.values(checks).forEach(check => check && score++);
  
  if (score < 2) return { score, label: 'Weak', color: 'text-red-400', checks };
  if (score < 4) return { score, label: 'Medium', color: 'text-yellow-400', checks };
  return { score, label: 'Strong', color: 'text-green-400', checks };
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const { login, register: registerUser, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<RegisterData>();
  const password = watch('password');
  const passwordStrength = getPasswordStrength(password || '');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching between login/register
  useEffect(() => {
    clearError();
    reset();
  }, [isLogin, clearError, reset]);

  const onSubmit = async (data: RegisterData) => {
    try {
      if (isLogin) {
        await login({ email: data.email, password: data.password }, rememberMe);
      } else {
        await registerUser(data);
      }
      navigate('/');
    } catch (error) {
      // Error handling is done in the store
      console.error('Auth failed:', error);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    reset();
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Neural Background - Only visible on left side */}
      <div className="absolute inset-0 lg:w-1/2">
        <NeuralBackground />
      </div>
      
      {/* Left Side - Branding & Animation */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12 text-center">
        <div className="max-w-md">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-neural-cyan/20 to-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-neural-cyan/30 shadow-2xl">
              <Sparkles className="w-10 h-10 text-neural-cyan" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-neural-cyan bg-clip-text text-transparent mb-2">
              LostMind AI
            </h1>
            <p className="text-xl text-neural-cyan font-medium">
              Veo3 Video Generator
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Professional AI Video Creation Platform
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-neural-cyan"></div>
              <span>Generate stunning AI videos with Veo 3</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-neural-cyan"></div>
              <span>Image-to-video generation capabilities</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-neural-cyan"></div>
              <span>Professional template library</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 rounded-full bg-neural-cyan"></div>
              <span>Real-time progress tracking</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-neural-cyan">10K+</div>
              <div className="text-sm text-gray-400">Videos Generated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neural-cyan">99.2%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-bg-primary relative z-20">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-neural-cyan/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-neural-cyan/30">
              <Sparkles className="w-8 h-8 text-neural-cyan" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-neural-cyan bg-clip-text text-transparent">LostMind AI</h2>
            <p className="text-sm text-gray-400">Veo3 Video Generator</p>
          </div>

          {/* Auth Card */}
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-neural-cyan/20 rounded-lg flex items-center justify-center">
                  {isLogin ? (
                    <User className="w-6 h-6 text-neural-cyan" />
                  ) : (
                    <Shield className="w-6 h-6 text-neural-cyan" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isLogin ? 'Sign in to continue' : 'Join thousands of creators'}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
                <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className="w-full pl-10 pr-4 py-3 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                    <X className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="w-full pl-10 pr-12 py-3 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                    <X className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}

                {/* Password Strength Indicator (Register Only) */}
                {!isLogin && password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Password Strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score < 2 ? 'bg-red-500' :
                          passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(passwordStrength.checks || {}).map(([key, passed]) => (
                        <div key={key} className={`flex items-center space-x-1 ${passed ? 'text-green-400' : 'text-gray-500'}`}>
                          {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span className="capitalize">{key === 'special' ? 'Symbol' : key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field (Register Only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className="w-full pl-10 pr-12 py-3 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                      <X className="w-4 h-4" />
                      <span>{errors.confirmPassword.message}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me (Login Only) */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-neural-cyan bg-bg-tertiary border-bg-quaternary rounded focus:ring-neural-cyan focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-neural-cyan hover:text-neural-light transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neural-cyan hover:bg-neural-cyan/90 disabled:bg-neural-cyan/50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-bg-tertiary" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg-secondary text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-bg-tertiary rounded-lg hover:bg-bg-tertiary transition-colors text-gray-300"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-bg-tertiary rounded-lg hover:bg-bg-tertiary transition-colors text-gray-300"
                >
                  <Chrome className="w-5 h-5" />
                  <span>Google</span>
                </button>
              </div>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-8 text-center">
              <p className="text-gray-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 text-neural-cyan hover:text-neural-light transition-colors font-medium"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
              <a href="#" className="text-neural-cyan hover:text-neural-light">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-neural-cyan hover:text-neural-light">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;