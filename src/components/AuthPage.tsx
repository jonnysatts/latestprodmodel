import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import PasswordResetForm from './PasswordResetForm';

const AuthPage = () => {
  const [activeView, setActiveView] = useState<'login' | 'signup' | 'reset'>('login');
  const auth = useAuth();

  // If already authenticated, redirect to home
  if (auth.isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Product KPI Model
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {activeView === 'login' && 'Sign in to your account'}
          {activeView === 'signup' && 'Create a new account'}
          {activeView === 'reset' && 'Reset your password'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {activeView === 'login' || activeView === 'signup' ? (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b mb-6">
                <button
                  className={`py-2 px-4 font-medium ${
                    activeView === 'login'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveView('login')}
                >
                  Login
                </button>
                <button
                  className={`py-2 px-4 font-medium ${
                    activeView === 'signup'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveView('signup')}
                >
                  Sign Up
                </button>
              </div>

              {/* Form Container */}
              <div>
                {activeView === 'login' ? (
                  <LoginForm 
                    onSuccess={() => {/* Navigation handled by redirect */}} 
                    onError={(error) => console.error('Login error:', error)}
                  />
                ) : (
                  <SignupForm onSuccess={() => setActiveView('login')} />
                )}
              </div>

              {/* Additional Info */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {activeView === 'login' ? "Don't have an account?" : "Already have an account?"}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    onClick={() => setActiveView(activeView === 'login' ? 'signup' : 'login')}
                  >
                    {activeView === 'login' ? 'Create a new account' : 'Sign in to your account'}
                  </button>
                </div>
                
                {activeView === 'login' && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      className="text-sm text-blue-500 hover:text-blue-700"
                      onClick={() => setActiveView('reset')}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <PasswordResetForm 
              onSuccess={() => {
                alert('Check your email for password reset instructions');
                setActiveView('login');
              }}
              onCancel={() => setActiveView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 