import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useExperiences } from '@/hooks/useExperiences';
import { ROUTES } from '@/constants/routes';

function Auth() {
  const [activeTab, setActiveTab] = useState('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const {
    experiences,
    experienceInput,
    showDropdown,
    filteredSuggestions,
    addExperience,
    removeExperience,
    handleExperienceInputChange,
  } = useExperiences();

  useEffect(() => {
    if (user) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, navigate]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      console.error('Google sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [signInWithGoogle]);

  const handleSignIn = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        setError('');
        await signInWithEmail(email, password);
      } catch (err) {
        setError(err.message || 'Failed to sign in');
      } finally {
        setIsLoading(false);
      }
    },
    [signInWithEmail, email, password]
  );

  const handleCreateAccount = useCallback(
    async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        await signUpWithEmail(email, password, fullName);
        alert('Account created! Please check your email to confirm.');
        setActiveTab('signin');
      } catch (err) {
        setError(err.message || 'Failed to create account');
      } finally {
        setIsLoading(false);
      }
    },
    [signUpWithEmail, email, password, confirmPassword, fullName]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 text-center">
            <div className="mb-2 inline-flex items-center space-x-2">
              <div className="rounded-lg border border-gray-300 p-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">ProPlan</span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google logo"
                  className="h-5 w-5"
                />
              )}
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mb-8 flex space-x-2">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'signin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'signup' && (
            <form className="space-y-5" onSubmit={handleCreateAccount}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="email"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-12 text-gray-900 placeholder-gray-500"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-12 text-gray-900 placeholder-gray-500"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Experience</label>
                <p className="mb-3 text-xs text-gray-500">
                  Add your technical experience (optional)
                </p>

                <div className="relative">
                  <input
                    type="text"
                    value={experienceInput}
                    onChange={(e) => handleExperienceInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExperience(experienceInput);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 placeholder-gray-500"
                    placeholder="Type your experience or select from suggestions"
                  />
                  <button
                    type="button"
                    onClick={() => addExperience(experienceInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-blue-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {showDropdown && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addExperience(suggestion)}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {experiences.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {experiences.map((experience, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                      >
                        {experience}
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {activeTab === 'signin' && (
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="email"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-12 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                  >
                    {showSignInPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
