import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ProgressTracker from './components/ProgressTracker';
import './index.css';

interface AppState {
  currentJob: {
    jobId: string;
    filename: string;
  } | null;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentJob: null
  });

  const handleJobStart = (jobId: string, filename: string) => {
    setAppState({
      currentJob: { jobId, filename }
    });
  };

  const handleJobComplete = (jobId: string) => {
    // Keep the job state to show download button
    console.log(`Job ${jobId} completed`);
  };

  const handleReset = () => {
    setAppState({
      currentJob: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto">
        {appState.currentJob ? (
          <ProgressTracker
            jobId={appState.currentJob.jobId}
            filename={appState.currentJob.filename}
            onComplete={handleJobComplete}
            onReset={handleReset}
          />
        ) : (
          <FileUpload onJobStart={handleJobStart} />
        )}
      </div>
    </div>
  );
};

export default App; 