import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string>('');

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setError('');
      const success = await login(credentialResponse.credential);
      
      if (success) {
        // The user will be updated in AuthContext, and parent component will re-render
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        onLogin(userData);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } else {
      setError('Failed to get Google credentials. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎵 Audio Transcriber
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            AI-powered transcription with your first transcription <strong>FREE</strong>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600 text-sm">
              Sign up with Google to access our transcription service
            </p>
          </div>

          <div className="space-y-4">
            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">🎁</span>
                <h3 className="font-semibold text-green-800">Free First Transcription!</h3>
              </div>
              <p className="text-sm text-green-700 text-center">
                Try our service with your first transcription completely free.
              </p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-gray-600 text-center">
                  After your free transcription: <strong>$1.99/month</strong> for unlimited transcriptions
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-center">✨ What you get:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Advanced AI transcription (GPT-4o-mini)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Support for files up to 500MB</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Fast parallel processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Secure processing & file cleanup</span>
                </div>
              </div>
            </div>

            {/* Google Sign In */}
            <div className="space-y-4">
              <div className="flex justify-center">
                {loading ? (
                  <div className="flex items-center space-x-2 py-3 px-6 bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">Signing you in...</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_blue"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    logo_alignment="left"
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            By signing up, you agree to try our service with your first transcription free.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-400">Made with ❤️ by</span>
            <a 
              href="https://www.linkedin.com/in/jordanmarshalluwo/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Jordan Marshall
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 