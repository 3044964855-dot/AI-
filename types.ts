export interface AudioConfig {
  sampleRate: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  SUMMARY = 'summary',
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeneratedImage {
  url: string;
  blob?: Blob;
}

export interface VisualAid {
  url: string;
  caption: string;
}

export interface TranscriptItem {
  speaker: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Correction {
  original: string;
  better: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'naturalness';
}

export interface ConversationHints {
  topic: string;     // Level 1
  sentence: string;  // Level 2
  keywords: string[]; // Level 3
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
  timestamp: number;
}