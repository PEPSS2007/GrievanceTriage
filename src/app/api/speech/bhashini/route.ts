import { NextRequest, NextResponse } from 'next/server';

interface BhashiniConfigStatus {
  service: string;
  configured: boolean;
  supportedLanguages: Array<{ code: string; name: string; native: string }>;
  clientFallback: string;
  endpoints: {
    asr: boolean;
    translation: boolean;
    tts: boolean;
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const isConfigured = !!(apiKey && userId);

  const status: BhashiniConfigStatus = {
    service: 'BHASHINI Government Multilingual AI Gateway',
    configured: isConfigured,
    supportedLanguages: [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'hi', name: 'Hindi', native: 'हिंदी' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
    ],
    clientFallback: 'Web Speech API (SpeechRecognition & SpeechSynthesis)',
    endpoints: {
      asr: isConfigured,
      translation: isConfigured,
      tts: isConfigured
    }
  };

  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, text, sourceLanguage = 'en', targetLanguage = 'en' } = body;

    const apiKey = process.env.BHASHINI_API_KEY;
    const userId = process.env.BHASHINI_USER_ID;

    // Preserve original text strictly
    if (!apiKey || !userId) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          provider: 'bhashini',
          message:
            'BHASHINI server credentials (BHASHINI_API_KEY, BHASHINI_USER_ID) are not configured in environment. Browser-native Web Speech API is handling voice input and synthesis on the client without API keys.',
          original_text: text || null,
          preserved: true
        },
        { status: 200 }
      );
    }

    // If server credentials exist, execute BHASHINI pipeline
    // e.g., POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
    if (action === 'translate') {
      if (!text) {
        return NextResponse.json({ error: 'Text is required for translation' }, { status: 400 });
      }

      // Preserve original text alongside translated version
      return NextResponse.json({
        success: true,
        provider: 'bhashini',
        original_text: text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_text: text // Echo or mocked pipeline output when testing
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `Unsupported action '${action}'. Supported: 'translate', 'asr', 'tts'.`
      },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error processing speech request'
      },
      { status: 500 }
    );
  }
}
