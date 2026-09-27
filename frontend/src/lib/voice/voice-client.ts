/**
 * CAREGRID Voice Client
 * 
 * Provides a clean, provider-agnostic voice interaction layer.
 * Pluggable design allows future integration of external speech services 
 * (e.g. Bhashini, Whisper, Sarvam AI, Google STT/TTS) without touching the Copilot UI.
 */

import type { 
  VoiceInputAdapter, 
  VoiceOutputAdapter, 
  VoiceInputConfig, 
  VoiceRecognitionResult, 
  VoiceSynthesisOptions 
} from './types';
import { BrowserSpeechInputAdapter, BrowserSpeechOutputAdapter } from './browser-speech';

export class CareGridVoiceClient {
  private static instance: CareGridVoiceClient | null = null;
  private inputAdapter: VoiceInputAdapter;
  private outputAdapter: VoiceOutputAdapter;

  private constructor() {
    this.inputAdapter = new BrowserSpeechInputAdapter();
    this.outputAdapter = new BrowserSpeechOutputAdapter();
  }

  public static getInstance(): CareGridVoiceClient {
    if (!this.instance) {
      this.instance = new CareGridVoiceClient();
    }
    return this.instance;
  }

  /**
   * Swap out input adapter with an external provider (Whisper, Bhashini, etc.)
   */
  public setInputAdapter(adapter: VoiceInputAdapter): void {
    if (this.inputAdapter.isListening()) {
      this.inputAdapter.abort();
    }
    this.inputAdapter = adapter;
  }

  /**
   * Swap out output adapter with an external TTS provider
   */
  public setOutputAdapter(adapter: VoiceOutputAdapter): void {
    if (this.outputAdapter.isSpeaking()) {
      this.outputAdapter.stop();
    }
    this.outputAdapter = adapter;
  }

  public isInputSupported(): boolean {
    return this.inputAdapter.isSupported();
  }

  public isOutputSupported(): boolean {
    return this.outputAdapter.isSupported();
  }

  public isListening(): boolean {
    return this.inputAdapter.isListening();
  }

  public isSpeaking(): boolean {
    return this.outputAdapter.isSpeaking();
  }

  public async startListening(
    config: VoiceInputConfig,
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: { code: string; message: string }) => void
  ): Promise<void> {
    return this.inputAdapter.startListening(config, onResult, onError);
  }

  public async stopListening(): Promise<void> {
    return this.inputAdapter.stopListening();
  }

  public abortListening(): void {
    this.inputAdapter.abort();
  }

  public async speak(text: string, options?: VoiceSynthesisOptions): Promise<void> {
    return this.outputAdapter.speak(text, options);
  }

  public stopSpeaking(): void {
    this.outputAdapter.stop();
  }
}

export const voiceClient = CareGridVoiceClient.getInstance();
