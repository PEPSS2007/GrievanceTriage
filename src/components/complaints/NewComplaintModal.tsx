'use client';

import React, { useState, useEffect } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  X,
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle2,
  Send,
  Sparkles,
  MapPin,
  Tag,
  FileText
} from 'lucide-react';
import { SpeechService } from '../../lib/speech';
import { getCategoryLabel } from '../../lib/i18n';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, submitComplaint, t } = useTriage();

  const [category, setCategory] = useState('Water Supply & Sewage');
  const [location, setLocation] = useState('Ward 4, Pine Street');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Speech input state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [stopListeningFn, setStopListeningFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      SpeechService.stopListening();
    };
  }, []);

  if (!isOpen) return null;

  const categories = [
    'Water Supply & Sewage',
    'Garbage & Sanitation',
    'Street Lighting',
    'Roads & Potholes',
    'Electrical Hazards'
  ];

  const handleStartListening = () => {
    setSpeechError(null);
    setIsListening(true);

    const stopFn = SpeechService.startListening(settings.language, {
      onStart: () => {
        setSpeechError(null);
      },
      onResult: (transcript, isFinal) => {
        setText(prev => {
          if (!prev) return transcript;
          // Append or update speech
          return transcript;
        });
      },
      onError: (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    setStopListeningFn(() => stopFn);
  };

  const handleStopListening = () => {
    if (stopListeningFn) {
      stopListeningFn();
      setStopListeningFn(null);
    }
    SpeechService.stopListening();
    setIsListening(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    handleStopListening();

    try {
      await submitComplaint({
        title: title.trim() || `${category} in ${location}`,
        text: text.trim(),
        location: location.trim() || 'Ward 1',
        category,
        source: settings.voiceInput && isListening ? 'Citizen Helpline' : 'Web Portal'
      });

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setIsSubmitting(false);
        onClose();
        setText('');
        setTitle('');
      }, 1200);
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t('btn_submit')}
              </h2>
              <p className="text-xs text-slate-500">
                AI automated categorization and triage
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopListening();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Grievance Registered Successfully
              </h3>
              <p className="text-xs text-slate-500">
                Assigned triage reference ID and queued for municipal department dispatch.
              </p>
            </div>
          ) : (
            <>
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span>Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {getCategoryLabel(c, settings.language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>Ward / Location</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ward 4, Pine Street"
                  required
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description with Voice Input integration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Complaint Description
                  </label>

                  {/* Voice input button shown ONLY when voice input is enabled in Settings */}
                  {settings.voiceInput && (
                    <div>
                      {isListening ? (
                        <button
                          type="button"
                          onClick={handleStopListening}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold animate-pulse shadow-xs"
                        >
                          <MicOff className="h-3 w-3" />
                          <span>{t('btn_stop_listening')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartListening}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-[11px] font-bold transition-all"
                          title={`Speak in ${settings.language === 'hi' ? 'Hindi' : settings.language === 'ta' ? 'Tamil' : 'English'}`}
                        >
                          <Mic className="h-3 w-3 text-emerald-600" />
                          <span>{t('btn_click_to_speak')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isListening && (
                  <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold">{t('btn_listening')}</span>
                    <span className="text-[11px] text-emerald-700 italic">
                      Speaking in {settings.language === 'hi' ? 'Hindi' : settings.language === 'ta' ? 'Tamil' : 'English'}...
                    </span>
                  </div>
                )}

                {speechError && (
                  <div className="mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{speechError}</span>
                  </div>
                )}

                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe the municipal issue in detail. You can edit voice transcriptions here directly before submitting."
                  required
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-[11px] text-slate-400 mt-1">
                  Original text is strictly preserved. Voice input is converted to editable text for user correction.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleStopListening();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !text.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Registering...' : t('btn_submit')}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
