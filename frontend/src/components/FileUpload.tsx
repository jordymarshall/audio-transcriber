import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { TranscriptionJob, UploadResponse, UsageResponse } from '../types';
import PaymentForm from './PaymentForm';

interface FileUploadProps {
  onJobStart: (jobId: string, filename: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onJobStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageResponse | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check user usage on component mount
    checkUsage();
  }, []);

  const checkUsage = async () => {
    try {
      const response = await axios.get<UsageResponse>('/api/check-usage');
      setUsageInfo(response.data);
    } catch (error) {
      console.error('Failed to check usage:', error);
    }
  };

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

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, M4A, OGG)');
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      alert('File size must be less than 500MB');
      return;
    }

    // Check if payment is needed
    if (usageInfo && usageInfo.needs_payment && !paymentIntentId) {
      setPendingFile(file);
      setShowPayment(true);
      return;
    }

    // Proceed with upload
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (paymentIntentId) {
        formData.append('payment_intent_id', paymentIntentId);
      }

      const response = await axios.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onJobStart(response.data.job_id, file.name);
      
      // Reset payment state
      setPaymentIntentId(null);
      setPendingFile(null);
      
      // Update usage info
      await checkUsage();
      
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

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentIntentId(paymentId);
    setShowPayment(false);
    
    // Upload the pending file
    if (pendingFile) {
      uploadFile(pendingFile);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPendingFile(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎵 Audio Transcriber
          </h1>
          <p className="text-gray-600">
            Upload an audio file to transcribe using advanced AI
          </p>
          
          {/* Usage Information */}
          {usageInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              {usageInfo.subscription_active ? (
                <p className="text-sm text-blue-800">
                  ✅ <strong>Subscription Active!</strong> You have unlimited transcriptions until {' '}
                  {usageInfo.subscription_end ? new Date(usageInfo.subscription_end).toLocaleDateString() : 'renewal'}.
                </p>
              ) : (
                <p className="text-sm text-blue-800">
                  🎯 <strong>Subscribe for ${usageInfo.price.toFixed(2)}/month</strong> and get unlimited transcriptions! 
                  No API key needed - we handle everything for you.
                </p>
              )}
            </div>
          )}
          
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

        <div
          className={`upload-area ${isDragging ? 'dragover' : ''} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
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
            disabled={isUploading}
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
                {isDragging ? 'Drop your audio file here' : 'Drag & drop your audio file'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or <button className="text-primary-500 hover:text-primary-600 font-medium">click to browse</button>
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Supports: MP3, WAV, M4A, OGG</p>
                <p>Max size: 500MB</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">⚡ Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Advanced AI transcription using GPT-4o-mini model</li>
            <li>• Maximum speed optimization with compression</li>
            <li>• Adaptive chunking based on file size</li>
            <li>• Parallel transcription for faster results</li>
            <li>• Support for files up to 11+ hours</li>
            <li>• Secure processing - files are deleted after transcription</li>
            <li>• 💎 <strong>Monthly subscription:</strong> Unlimited transcriptions for $1.99/month</li>
          </ul>
        </div>
      </div>

      {showPayment && usageInfo && (
        <PaymentForm
          amount={usageInfo.price}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </>
  );
};

export default FileUpload; 