/**
 * CAREGRID Voice-Ready Architecture Types
 * Clean abstractions for interchangeable Speech-to-Text (STT) and Text-to-Speech (TTS)
 */

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  detectedLanguage?: string;
}

export interface VoiceInputConfig {
  locale: 'mr' | 'hi' | 'en' | 'mr-IN' | 'hi-IN' | 'en-IN';
  continuous?: boolean;
  interimResults?: boolean;
}

export interface VoiceSynthesisOptions {
  locale: 'mr' | 'hi' | 'en' | 'mr-IN' | 'hi-IN' | 'en-IN';
  pitch?: number;
  rate?: number;
  volume?: number;
}

export interface VoiceInputAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  startListening(
    config: VoiceInputConfig,
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: { code: string; message: string }) => void
  ): Promise<void>;
  stopListening(): Promise<void>;
  abort(): void;
  isListening(): boolean;
}

export interface VoiceOutputAdapter {
  id: string;
  name: string;
  isSupported(): boolean;
  speak(text: string, options?: VoiceSynthesisOptions): Promise<void>;
  stop(): void;
  isSpeaking(): boolean;
}
