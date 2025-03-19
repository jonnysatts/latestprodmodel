import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailVerification from './EmailVerification';
import AccountLinking from './AccountLinking';

const UserProfile = () => {
  const { currentUser, logout, isAnonymous, isEmailVerified } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setError(null);
      setLoading(true);
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to log out';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {isAnonymous ? 'Guest User' : currentUser?.email || 'User'}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              {isAnonymous ? (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Anonymous Account</span>
              ) : (
                <>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">Registered Account</span>
                  {!isEmailVerified && !isAnonymous && currentUser?.email && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded ml-2">Not Verified</span>
                  )}
                  {isEmailVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded ml-2">Verified</span>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium text-gray-700"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}
        
        {isAnonymous && !showAccountLinking && (
          <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              You're using a temporary guest account. Your data is only stored on this device.
            </p>
            <button 
              onClick={() => setShowAccountLinking(true)}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
            >
              Create Permanent Account
            </button>
          </div>
        )}
      </div>
      
      {showAccountLinking && (
        <AccountLinking 
          onSuccess={() => setShowAccountLinking(false)} 
          onCancel={() => setShowAccountLinking(false)}
        />
      )}
      
      {!isAnonymous && !isEmailVerified && currentUser?.email && <EmailVerification />}
    </div>
  );
};

export default UserProfile; 