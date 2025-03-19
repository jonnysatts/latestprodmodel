import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationProps {
  onVerificationSent?: () => void;
}

const EmailVerification = ({ onVerificationSent }: EmailVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const auth = useAuth();

  const handleSendVerification = async () => {
    if (auth.currentUser?.emailVerified) {
      setSuccess(false);
      setError('Your email is already verified.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await auth.sendVerificationEmail();
      
      setSuccess(true);
      if (onVerificationSent) {
        onVerificationSent();
      }
    } catch (err) {
      console.error('Verification email error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!auth.currentUser || !auth.currentUser.email) {
    return null;
  }

  if (auth.currentUser.emailVerified) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4 flex items-center">
        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Your email is verified</span>
      </div>
    );
  }

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
      <div className="flex">
        <div className="py-1">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-bold">Your email is not verified</p>
          <p className="text-sm">
            Please verify your email address ({auth.currentUser.email}) to access all features.
          </p>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-2 text-sm text-green-600">
              Verification email sent! Please check your inbox.
            </div>
          )}
          
          <div className="mt-3">
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded focus:outline-none focus:shadow-outline"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 