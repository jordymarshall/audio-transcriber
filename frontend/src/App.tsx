import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ProgressTracker from './components/ProgressTracker';
import { TranscriptionJob } from './types';
import './index.css';

function App() {
  const [currentJob, setCurrentJob] = useState<TranscriptionJob | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    // Load Stripe configuration
    const loadStripeConfig = async () => {
      try {
        const response = await axios.get('/api/config');
        const stripe = await loadStripe(response.data.publishable_key);
        setStripePromise(stripe);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!currentJob ? (
            <FileUpload onJobStart={handleJobStart} />
          ) : (
            <ProgressTracker job={currentJob} onComplete={handleJobComplete} />
          )}
        </div>
      </div>
    </Elements>
  );
}

export default App; 