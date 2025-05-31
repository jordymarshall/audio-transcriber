import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { TranscriptionJob, UploadResponse, User } from '../types';
import PaymentForm from './PaymentForm';

interface FileUploadProps {
  user: User;
  onJobStart: (jobId: string, filename: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ user, onJobStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canTranscribeForFree = !user.has_used_free_transcription;
  const needsSubscription = !user.subscription_active && user.has_used_free_transcription;

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
    if (needsSubscription && !paymentIntentId) {
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
          'X-User-ID': user.id,
        },
      });

      onJobStart(response.data.job_id, file.name);
      
      // Reset payment state
      setPaymentIntentId(null);
      setPendingFile(null);
      
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

  const getStatusMessage = () => {
    if (canTranscribeForFree) {
      return {
        title: "🎁 Your First Transcription is FREE!",
        subtitle: "Upload your audio file and try our service completely free",
        bgColor: "bg-gradient-to-r from-green-50 to-blue-50",
        borderColor: "border-green-200"
      };
    } else if (user.subscription_active) {
      const endDate = user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : 'unknown';
      return {
        title: "✅ Subscription Active",
        subtitle: `Unlimited transcriptions until ${endDate}`,
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        borderColor: "border-green-200"
      };
    } else {
      return {
        title: "💳 Subscription Required",
        subtitle: "Subscribe for $1.99/month for unlimited transcriptions",
        bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
        borderColor: "border-amber-200"
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <>
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎵 Upload Audio File
          </h1>
          <p className="text-gray-600">
            Transform your audio into text with advanced AI transcription
          </p>
        </div>

        {/* User Status */}
        <div className={`${statusMessage.bgColor} border ${statusMessage.borderColor} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-1">{statusMessage.title}</h3>
            <p className="text-sm text-gray-700">{statusMessage.subtitle}</p>
            {canTranscribeForFree && (
              <div className="mt-2 text-xs text-gray-600">
                After your free transcription, subscribe for $1.99/month for unlimited access
              </div>
            )}
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
            <li>• Advanced AI transcription using GPT-4o-mini model (~$0.16/hour)</li>
            <li>• Maximum speed optimization with parallel processing</li>
            <li>• Support for files up to 500MB and 11+ hours long</li>
            <li>• Secure processing - files are deleted after transcription</li>
            <li>• Real-time progress tracking</li>
            {canTranscribeForFree && (
              <li>• 🎁 <strong>Your first transcription is completely FREE!</strong></li>
            )}
          </ul>
        </div>
      </div>

      {showPayment && (
        <PaymentForm
          amount={1.99}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </>
  );
};

export default FileUpload; 