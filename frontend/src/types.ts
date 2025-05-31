export interface TranscriptionJob {
  status: 'uploaded' | 'compressing' | 'chunking' | 'transcribing' | 'completed' | 'error';
  progress: number;
  filename: string;
  total_chunks?: number;
  completed_chunks?: number;
  message?: string;
  output_file?: string;
}

export interface UploadResponse {
  job_id: string;
}

export interface ApiError {
  error: string;
} 