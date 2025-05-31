import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TranscriptionJob } from '../types';

interface ProgressTrackerProps {
  job: TranscriptionJob;
  onComplete: () => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  job: initialJob, 
  onComplete 
}) => {
  const [job, setJob] = useState<TranscriptionJob>(initialJob);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get<TranscriptionJob>(`/status/${job.job_id}`);
        setJob(response.data);
        
        if (response.data.status === 'completed') {
          onComplete();
        } else if (response.data.status === 'error') {
          setError(response.data.message || 'An error occurred during transcription');
        }
      } catch (err) {
        setError('Failed to check transcription status');
      }
    };

    // Check status immediately
    checkStatus();

    // Then check every 2 seconds
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [job.job_id, onComplete]);

  const getStatusText = () => {
    if (!job) return 'Initializing...';
    
    switch (job.status) {
      case 'uploaded':
        return 'File uploaded successfully';
      case 'compressing':
        return 'Compressing audio for maximum speed...';
      case 'chunking':
        return 'Creating optimized chunks...';
      case 'transcribing':
        return `Transcribing chunks... (${job.completed_chunks || 0}/${job.total_chunks || 0})`;
      case 'completed':
        return 'Transcription completed!';
      case 'error':
        return 'Error occurred';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (!job) return '⏳';
    
    switch (job.status) {
      case 'uploaded':
        return '📁';
      case 'compressing':
        return '🗜️';
      case 'chunking':
        return '🔪';
      case 'transcribing':
        return '⚡';
      case 'completed':
        return '🎉';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const downloadTranscription = async () => {
    try {
      const response = await axios.get(`/download/${job.job_id}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcription_${job.filename}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download transcription');
    }
  };

  if (error) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Transcription Failed
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onComplete}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{getStatusIcon()}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Processing: {job.filename}
        </h3>
        <p className="text-gray-600">{getStatusText()}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{job?.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="progress-bar"
            style={{ width: `${job?.progress || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Chunk Progress (during transcription) */}
      {job?.status === 'transcribing' && job.total_chunks && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Chunks Processed</span>
            <span>{job.completed_chunks || 0} / {job.total_chunks}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ 
                width: `${((job.completed_chunks || 0) / job.total_chunks) * 100}%` 
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Processing {job.total_chunks} chunks in parallel for maximum speed
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {job?.status === 'completed' ? (
          <>
            <button
              onClick={downloadTranscription}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Transcription</span>
            </button>
            <button
              onClick={onComplete}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Process Another File
            </button>
          </>
        ) : (
          <button
            onClick={onComplete}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            disabled={job?.status === 'transcribing'}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Estimated Time */}
      {job?.status === 'transcribing' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            ⚡ Processing at maximum speed with parallel chunks
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker; 