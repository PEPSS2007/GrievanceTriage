'use client';

import React, { useState, useEffect } from 'react';
import { useTriage } from '../../context/TriageContext';
import { AppLanguage, SpeechSpeed } from '../../types';
import {
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Gauge,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Server,
  Cpu,
  Radio,
  FileCheck,
  ShieldCheck,
  Headphones,
  Check
} from 'lucide-react';
import { SpeechService } from '../../lib/speech';
import { getSpeechLocale } from '../../lib/i18n';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, t } = useTriage();

  // Local staging state so user can make multiple adjustments or save instantly
  const [currentLang, setCurrentLang] = useState<AppLanguage>(settings.language);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState<boolean>(settings.voiceInput);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState<boolean>(settings.voiceOutput);
  const [autoReadEnabled, setAutoReadEnabled] = useState<boolean>(settings.autoRead);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(settings.speechSpeed);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [micTesting, setMicTesting] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [audioTesting, setAudioTesting] = useState(false);
  const [stopListeningFn, setStopListeningFn] = useState<(() => void) | null>(null);

  // Sync with context if context changes
  useEffect(() => {
    setCurrentLang(settings.language);
    setVoiceInputEnabled(settings.voiceInput);
    setVoiceOutputEnabled(settings.voiceOutput);
    setAutoReadEnabled(settings.autoRead);
    setSpeechSpeed(settings.speechSpeed);
  }, [settings]);

  // Clean up any active speech synthesis or recognition on unmount
  useEffect(() => {
    return () => {
      SpeechService.stopListening();
      SpeechService.stopSpeaking();
    };
  }, []);

  const handleApplyImmediate = (updates: {
    language?: AppLanguage;
    voiceInput?: boolean;
    voiceOutput?: boolean;
    autoRead?: boolean;
    speechSpeed?: SpeechSpeed;
  }) => {
    updateSettings(updates);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    setCurrentLang(lang);
    handleApplyImmediate({ language: lang });
  };

  const handleToggleVoiceInput = () => {
    const next = !voiceInputEnabled;
    setVoiceInputEnabled(next);
    handleApplyImmediate({ voiceInput: next });
    if (!next && micTesting) {
      stopMicTest();
    }
  };

  const handleToggleVoiceOutput = () => {
    const next = !voiceOutputEnabled;
    setVoiceOutputEnabled(next);
    handleApplyImmediate({ voiceOutput: next });
    if (!next && audioTesting) {
      SpeechService.stopSpeaking();
      setAudioTesting(false);
    }
  };

  const handleToggleAutoRead = () => {
    const next = !autoReadEnabled;
    setAutoReadEnabled(next);
    handleApplyImmediate({ autoRead: next });
  };

  const handleSpeedChange = (speed: SpeechSpeed) => {
    setSpeechSpeed(speed);
    handleApplyImmediate({ speechSpeed: speed });
  };

  const handleSaveAll = () => {
    updateSettings({
      language: currentLang,
      voiceInput: voiceInputEnabled,
      voiceOutput: voiceOutputEnabled,
      autoRead: autoReadEnabled,
      speechSpeed: speechSpeed
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaults = {
      language: 'en' as AppLanguage,
      voiceInput: false,
      voiceOutput: false,
      autoRead: false,
      speechSpeed: 'normal' as SpeechSpeed
    };
    setCurrentLang(defaults.language);
    setVoiceInputEnabled(defaults.voiceInput);
    setVoiceOutputEnabled(defaults.voiceOutput);
    setAutoReadEnabled(defaults.autoRead);
    setSpeechSpeed(defaults.speechSpeed);
    updateSettings(defaults);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Test Microphone (Voice Input)
  const startMicTest = () => {
    setMicError(null);
    setMicTranscript('');
    setMicTesting(true);

    const stopFn = SpeechService.startListening(currentLang, {
      onStart: () => {
        setMicError(null);
      },
      onResult: (transcript) => {
        setMicTranscript(transcript);
      },
      onError: (err) => {
        setMicError(err);
        setMicTesting(false);
      },
      onEnd: () => {
        setMicTesting(false);
      }
    });

    setStopListeningFn(() => stopFn);
  };

  const stopMicTest = () => {
    if (stopListeningFn) {
      stopListeningFn();
      setStopListeningFn(null);
    }
    SpeechService.stopListening();
    setMicTesting(false);
  };

  // Test Speech Synthesis (Voice Output)
  const testVoiceOutput = () => {
    if (audioTesting) {
      SpeechService.stopSpeaking();
      setAudioTesting(false);
      return;
    }

    setAudioTesting(true);
    const sampleText =
      currentLang === 'hi'
        ? 'ग्रीवेंस ट्राइएज में आपका स्वागत है। आपकी भाषा और ऑडियो प्राथमिकताएं सक्रिय हैं।'
        : currentLang === 'ta'
        ? 'GrievanceTriage-க்கு உங்களை வரவேற்கிறோம். உங்கள் குரல் மற்றும் அணுகல் அமைப்புகள் வெற்றிகரமாகச் செயல்படுத்தப்பட்டன.'
        : 'Welcome to GrievanceTriage. Your voice and accessibility settings are active and ready.';

    SpeechService.speak(
      sampleText,
      currentLang,
      speechSpeed,
      () => setAudioTesting(false),
      (err) => {
        console.warn('TTS test note:', err);
        setAudioTesting(false);
      }
    );
  };

  const languages = [
    {
      id: 'en' as AppLanguage,
      label: 'English',
      nativeLabel: 'English (India)',
      locale: 'en-IN',
      flag: '🌐',
      description: 'Standard municipal interface with English terminology'
    },
    {
      id: 'hi' as AppLanguage,
      label: 'Hindi',
      nativeLabel: 'हिंदी',
      locale: 'hi-IN',
      flag: '🇮🇳',
      description: 'नेविगेशन, बटन, शिकायत स्थिति और आवाज़ इनपुट हिंदी में'
    },
    {
      id: 'ta' as AppLanguage,
      label: 'Tamil',
      nativeLabel: 'தமிழ்',
      locale: 'ta-IN',
      flag: '🇮🇳',
      description: 'வழிசெலுத்தல், பொத்தான்கள், நிலை மற்றும் குரல் உள்ளீடு தமிழில்'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('settings_title')}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {t('settings_subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('btn_reset_defaults')}</span>
            </button>

            <button
              onClick={handleSaveAll}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('btn_saved')}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{t('btn_save_changes')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 1: Preferred Language */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Languages className="h-4 w-4 text-blue-600" />
                <span>{t('settings_pref_lang_title')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settings_pref_lang_desc')}
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md">
              Active: {currentLang.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {languages.map((item) => {
              const isSelected = currentLang === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleLanguageChange(item.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{item.flag}</span>
                        <span className="text-sm font-black text-slate-900">
                          {item.nativeLabel}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </span>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 font-normal leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Voice Input Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-600" />
                <span>{t('settings_voice_input_title')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settings_voice_input_desc')}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggleVoiceInput}
              role="switch"
              aria-checked={voiceInputEnabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                voiceInputEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  voiceInputEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interactive Voice Input Test Area */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {t('settings_test_mic_label')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-100 text-emerald-800">
                  Speech Locale: {getSpeechLocale(currentLang)}
                </span>
              </div>

              {voiceInputEnabled ? (
                micTesting ? (
                  <button
                    onClick={stopMicTest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold animate-pulse shadow-xs"
                  >
                    <MicOff className="h-3.5 w-3.5" />
                    <span>{t('btn_stop_listening')}</span>
                  </button>
                ) : (
                  <button
                    onClick={startMicTest}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>{t('btn_click_to_speak')}</span>
                  </button>
                )
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Enable voice input above to test microphone
                </span>
              )}
            </div>

            {/* Test Microphone Status Box */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 min-h-[56px] flex items-center justify-between gap-3 text-xs">
              <div className="flex-1">
                {micTesting ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold">{t('btn_listening')}</span>
                    <span className="text-slate-700 font-medium italic">
                      {micTranscript || 'Speak into your microphone now...'}
                    </span>
                  </div>
                ) : micTranscript ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Transcription Result (Editable):
                    </span>
                    <input
                      type="text"
                      value={micTranscript}
                      onChange={(e) => setMicTranscript(e.target.value)}
                      className="w-full font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-slate-400">
                    No microphone test recorded. Click &ldquo;Click to speak&rdquo; and grant microphone access to preview speech-to-text.
                  </span>
                )}

                {micError && (
                  <div className="flex items-center gap-1.5 text-rose-600 mt-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{micError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Microphone permission is only requested when you click the microphone button. Speech is converted to editable text so you can fix errors before submitting.</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Voice Output Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-indigo-600" />
                <span>{t('settings_voice_output_title')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settings_voice_output_desc')}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleToggleVoiceOutput}
              role="switch"
              aria-checked={voiceOutputEnabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                voiceOutputEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  voiceOutputEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sub-controls: Auto-read and Speed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Auto-read Toggle Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {t('settings_auto_read_title')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {t('settings_auto_read_desc')}
                </p>
              </div>

              <button
                onClick={handleToggleAutoRead}
                disabled={!voiceOutputEnabled}
                role="switch"
                aria-checked={autoReadEnabled}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !voiceOutputEnabled
                    ? 'bg-slate-200 opacity-60 cursor-not-allowed'
                    : autoReadEnabled
                    ? 'bg-indigo-600'
                    : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoReadEnabled && voiceOutputEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Speech Speed Selector Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {t('settings_speech_speed_title')}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded">
                  {speechSpeed === 'slow' ? '0.8x' : speechSpeed === 'fast' ? '1.25x' : '1.0x'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['slow', 'normal', 'fast'] as SpeechSpeed[]).map((spd) => {
                  const active = speechSpeed === spd;
                  return (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      disabled={!voiceOutputEnabled}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                        !voiceOutputEnabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {spd === 'slow'
                        ? t('settings_speed_slow')
                        : spd === 'fast'
                        ? t('settings_speed_fast')
                        : t('settings_speed_normal')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Test Audio Output Button */}
          <div className="rounded-xl border border-slate-200 bg-indigo-50/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-bold text-slate-800 block">
                {t('settings_test_voice_label')}
              </span>
              <p className="text-[11px] text-slate-500">
                Play a sample voice sentence in {languages.find(l => l.id === currentLang)?.nativeLabel} at configured rate.
              </p>
            </div>

            <button
              onClick={testVoiceOutput}
              disabled={!voiceOutputEnabled}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                !voiceOutputEnabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : audioTesting
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              {audioTesting ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>{t('btn_stop_audio')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>{t('btn_test_voice')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 4 & 5: Preference Persistence & Technical Provider Integration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persistence Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span>{t('settings_persistence_title')}</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('settings_persistence_desc')}
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 text-[11px] font-mono border border-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>grievancetriage_accessibility_settings_v1</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              When authentication is attached in enterprise deployments, preferences synchronize against user profiles.
            </p>
          </div>

          {/* Provider Integration Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-600" />
              <span>{t('settings_provider_title')}</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Web Speech Recognition & Synthesis</span>
                  <span className="text-[11px] text-slate-500">Active natively in modern Chrome, Edge, and Safari without external API keys.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <Server className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">BHASHINI Government AI Gateway</span>
                  <span className="text-[11px] text-slate-500">Architecture ready. Configure BHASHINI_API_KEY in server environment for cloud ASR/TTS.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
