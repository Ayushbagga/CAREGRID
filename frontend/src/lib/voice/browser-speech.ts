/**
 * Browser Native Web Speech API Adapters
 * Standard Web Speech STT & SpeechSynthesis TTS
 */

import type { 
  VoiceInputAdapter, 
  VoiceOutputAdapter, 
  VoiceInputConfig, 
  VoiceRecognitionResult, 
  VoiceSynthesisOptions 
} from './types';

function mapLocaleToSpeechCode(locale: string): string {
  switch (locale) {
    case 'mr':
    case 'mr-IN':
      return 'mr-IN';
    case 'hi':
    case 'hi-IN':
      return 'hi-IN';
    case 'en':
    case 'en-IN':
    default:
      return 'en-IN';
  }
}

export class BrowserSpeechInputAdapter implements VoiceInputAdapter {
  public id = 'browser-speech-recognition';
  public name = 'Browser Web Speech API';
  private recognition: any = null;
  private _isListening = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }

  public isListening(): boolean {
    return this._isListening;
  }

  public async startListening(
    config: VoiceInputConfig,
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: { code: string; message: string }) => void
  ): Promise<void> {
    if (!this.isSupported()) {
      onError({ code: 'NOT_SUPPORTED', message: 'Speech recognition is not supported in this browser environment.' });
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = mapLocaleToSpeechCode(config.locale);
      this.recognition.continuous = config.continuous ?? false;
      this.recognition.interimResults = config.interimResults ?? true;

      this.recognition.onstart = () => {
        this._isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        let confidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
          if (event.results[i][0].confidence) {
            confidence = event.results[i][0].confidence;
          }
        }

        onResult({
          transcript: transcript.trim(),
          confidence,
          isFinal,
          detectedLanguage: config.locale
        });
      };

      this.recognition.onerror = (event: any) => {
        this._isListening = false;
        onError({
          code: event.error || 'SPEECH_ERROR',
          message: event.message || `Speech recognition error: ${event.error}`
        });
      };

      this.recognition.onend = () => {
        this._isListening = false;
      };

      this.recognition.start();
    } catch (err: any) {
      this._isListening = false;
      onError({ code: 'START_FAILED', message: err.message || 'Failed to start speech recognition' });
    }
  }

  public async stopListening(): Promise<void> {
    if (this.recognition && this._isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this._isListening = false;
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
    this._isListening = false;
  }
}

export class BrowserSpeechOutputAdapter implements VoiceOutputAdapter {
  public id = 'browser-speech-synthesis';
  public name = 'Browser Speech Synthesis';
  private _isSpeaking = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined') return false;
    return window.speechSynthesis ? window.speechSynthesis.speaking : false;
  }

  public async speak(text: string, options?: VoiceSynthesisOptions): Promise<void> {
    if (!this.isSupported() || !text) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = mapLocaleToSpeechCode(options?.locale || 'en');
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.rate = options?.rate ?? 0.95;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      this._isSpeaking = true;
    };
    utterance.onend = () => {
      this._isSpeaking = false;
    };
    utterance.onerror = () => {
      this._isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this._isSpeaking = false;
  }
}
