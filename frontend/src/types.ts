export interface TranscriptionJob {
  job_id: string;
  filename: string;
  status: 'uploaded' | 'processing' | 'transcribing' | 'completed' | 'error';
  progress: number;
  total_chunks?: number;
  completed_chunks?: number;
  processing_time?: string;
  processing_speed?: string;
  message?: string;
  output_file?: string;
}

export interface UploadResponse {
  job_id: string;
  user: UserStatus;
}

export interface UsageResponse {
  subscription_active: boolean;
  subscription_end: string | null;
  subscription_type: 'free' | 'subscription' | null;
  needs_payment: boolean;
  price: number;
  billing_type: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  transcription_count: number;
  subscription_active: boolean;
  subscription_end: string | null;
  subscription_type: 'free' | 'subscription' | null;
  has_used_free_transcription: boolean;
}

export interface UserStatus {
  transcription_count: number;
  subscription_active: boolean;
  subscription_end: string | null;
  subscription_type: 'free' | 'subscription' | null;
  has_used_free_transcription: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: User;
}

export interface StripeConfig {
  publishable_key: string;
}

export interface ApiError {
  error: string;
} 