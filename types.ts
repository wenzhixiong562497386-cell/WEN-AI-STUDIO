export interface ImageSize {
  label: string;
  width: number;
  height: number;
  category: string;
}

export interface UploadedImage {
  id: string;
  url: string; // Base64 or Blob URL
  file: File;
  name: string;
  processed: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  versions: ImageVersion[];
}

export interface ImageVersion {
  id: string;
  url: string;
  type: 'original' | 'white_bg' | 'scenario' | 'dimension';
  description: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export enum GenerationType {
  WHITE_BG = 'white_bg',
  SCENARIO = 'scenario',
  DIMENSION = 'dimension',
}

export type ProcessingStatus = 'idle' | 'uploading' | 'analyzing' | 'generating';