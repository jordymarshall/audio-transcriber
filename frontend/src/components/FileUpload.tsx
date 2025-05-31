import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { TranscriptionJob, UploadResponse } from '../types';

interface FileUploadProps {
  onJobStart: (jobId: string, filename: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onJobStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate API key
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      const proceed = window.confirm('API key does not start with "sk-". Continue anyway?');
      if (!proceed) return;
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, M4A, OGG)');
      return;
    }

    // Validate file size (max 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      alert('File size must be less than 2GB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);

      const response = await axios.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onJobStart(response.data.job_id, file.name);
    } catch (error: any) {
      console.error('Upload failed:', error);
      if (error.response?.data?.error) {
        alert(`Upload failed: ${error.response.data.error}`);
      } else {
        alert('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openFileDialog = () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key first');
      return;
    }
    fileInputRef.current?.click();
  };

  const saveApiKeyToLocal = () => {
    if (apiKey.trim() && window.confirm('Save API key to browser for next time?')) {
      localStorage.setItem('openai_api_key', apiKey);
      alert('API key saved locally (in this browser only)');
    }
  };

  const loadApiKeyFromLocal = () => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      alert('API key loaded from browser storage');
    } else {
      alert('No saved API key found');
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎵 Jordan's Audio Transcriber
        </h1>
        <p className="text-gray-600">
          Enter your OpenAI API key and upload an audio file to transcribe
        </p>
        
        {/* LinkedIn Follow Section */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-500">Follow me on</span>
          <a 
            href="https://www.linkedin.com/in/jordanmarshalluwo/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span className="font-medium">LinkedIn</span>
          </a>
        </div>
      </div>

      {/* API Key Input Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI API Key <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            onClick={saveApiKeyToLocal}
            className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            title="Save to browser"
            disabled={!apiKey.trim()}
          >
            💾
          </button>
          <button
            onClick={loadApiKeyFromLocal}
            className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            title="Load from browser"
          >
            📂
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>Get your API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600">OpenAI Platform</a></p>
          <p className="mt-1">Your API key is sent securely to the server and not stored permanently</p>
        </div>
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragover' : ''} ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${!apiKey.trim() ? 'opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || !apiKey.trim()}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Uploading...</p>
            <p className="text-sm text-gray-500">Please wait while your file uploads</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {!apiKey.trim() ? 'Enter API key first' : isDragging ? 'Drop your audio file here' : 'Drag & drop your audio file'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or <button className="text-primary-500 hover:text-primary-600 font-medium" disabled={!apiKey.trim()}>click to browse</button>
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Supports: MP3, WAV, M4A, OGG</p>
              <p>Max size: 2GB</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">⚡ Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Maximum speed optimization with compression</li>
          <li>• Adaptive chunking based on file size</li>
          <li>• Parallel transcription for faster results</li>
          <li>• Support for files up to 11+ hours</li>
          <li>• Secure: API key only used for this session</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload; 