import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import FileUpload from './FileUpload';
import ProgressTracker from './ProgressTracker';
import UserProfile from './UserProfile';
import { User, TranscriptionJob } from '../types';

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [currentJob, setCurrentJob] = useState<TranscriptionJob | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  React.useEffect(() => {
    // Load Stripe configuration
    const loadStripeConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        const stripe = await loadStripe(config.publishable_key);
        setStripePromise(Promise.resolve(stripe));
      } catch (error) {
        console.error('Failed to load Stripe configuration:', error);
      }
    };

    loadStripeConfig();
  }, []);

  const handleJobStart = (jobId: string, filename: string) => {
    setCurrentJob({
      job_id: jobId,
      filename,
      status: 'uploaded',
      progress: 0,
    });
  };

  const handleJobComplete = () => {
    setCurrentJob(null);
  };

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Audio Transcriber</h1>
              </div>
              
              <UserProfile user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {!currentJob ? (
              <FileUpload user={user} onJobStart={handleJobStart} />
            ) : (
              <ProgressTracker job={currentJob} onComplete={handleJobComplete} />
            )}
          </div>
        </div>
      </div>
    </Elements>
  );
};

export default MainApp; 