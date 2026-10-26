'use client';

import { AppLanguage, SpeechSpeed } from '../types';
import { getSpeechLocale, getSpeechRateMultiplier } from './i18n';

// Web Speech API interface declarations for TypeScript
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechService {
  private static recognitionInstance: any = null;

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public static isSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public static startListening(
    lang: AppLanguage,
    handlers: SpeechRecognitionHandlers
  ): () => void {
    if (!this.isRecognitionSupported()) {
      handlers.onError('Speech recognition is not supported in this browser. Please use keyboard entry.');
      return () => {};
    }

    try {
      this.stopListening();

      const win = window as IWindowWithSpeech;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getSpeechLocale(lang);

      recognition.onstart = () => {
        if (handlers.onStart) handlers.onStart();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          handlers.onResult(currentText.trim(), !!finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        let msg = 'Voice input error occurred.';
        if (event.error === 'not-allowed') {
          msg = 'Microphone permission was denied. Please allow microphone access in your browser.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'network') {
          msg = 'Network issue during speech recognition. Please check your connection.';
        }
        handlers.onError(msg);
      };

      recognition.onend = () => {
        if (handlers.onEnd) handlers.onEnd();
      };

      recognition.start();
      this.recognitionInstance = recognition;

      return () => {
        this.stopListening();
      };
    } catch (e: any) {
      handlers.onError(e?.message || 'Failed to start speech recognition.');
      return () => {};
    }
  }

  public static stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch (e) {
        // Ignore abort errors
      }
      this.recognitionInstance = null;
    }
  }

  public static speak(
    text: string,
    lang: AppLanguage,
    speed: SpeechSpeed,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): void {
    if (!this.isSynthesisSupported()) {
      if (onError) onError('Speech synthesis is not supported on this device.');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLocale(lang);
      utterance.rate = getSpeechRateMultiplier(speed);
      utterance.pitch = 1.0;

      // Select voice for language if available
      const voices = window.speechSynthesis.getVoices();
      const targetLocale = getSpeechLocale(lang);
      const matchingVoice = voices.find(v => v.lang === targetLocale || v.lang.startsWith(lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        if (onError) onError('Speech synthesis encountered an error.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e: any) {
      if (onError) onError(e?.message || 'Failed to synthesize speech.');
    }
  }

  public static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
