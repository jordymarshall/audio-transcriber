export interface TranscriptionJob {
  job_id: string;
  status: 'uploaded' | 'compressing' | 'chunking' | 'transcribing' | 'completed' | 'error';
  progress: number;
  filename: string;
  total_chunks?: number;
  completed_chunks?: number;
  message?: string;
  output_file?: string;
  usage_count?: number;
  subscription_active?: boolean;
}

export interface UploadResponse {
  job_id: string;
  usage_count?: number;
  subscription_active?: boolean;
  subscription_end?: string;
}

export interface UsageResponse {
  subscription_active: boolean;
  subscription_end: string | null;
  needs_payment: boolean;
  price: number;
  billing_type: string;
}

export interface StripeConfig {
  publishable_key: string;
}

export interface ApiError {
  error: string;
} 