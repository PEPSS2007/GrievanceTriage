import { AppLanguage, SpeechSpeed } from '../types';

export interface TranslationDictionary {
  // Navigation
  nav_overview: string;
  nav_complaints: string;
  nav_incidents: string;
  nav_departments: string;
  nav_analytics: string;
  nav_escalations: string;
  nav_history: string;
  nav_settings: string;
  nav_landing: string;
  nav_back_to_app: string;

  // Common UI Buttons & Badges
  btn_approve: string;
  btn_override: string;
  btn_reject: string;
  btn_request_info: string;
  btn_save_changes: string;
  btn_saved: string;
  btn_reset_defaults: string;
  btn_reset_demo: string;
  btn_close: string;
  btn_cancel: string;
  btn_submit: string;
  btn_new_complaint: string;
  btn_speak_now: string;
  btn_listening: string;
  btn_click_to_speak: string;
  btn_stop_listening: string;
  btn_listen: string;
  btn_stop_audio: string;
  btn_test_voice: string;

  // Search & Filters
  search_placeholder: string;
  filter_all_categories: string;
  filter_all_priorities: string;
  filter_all_statuses: string;
  filter_needs_review: string;

  // Categories
  cat_water: string;
  cat_garbage: string;
  cat_lighting: string;
  cat_roads: string;
  cat_electrical: string;

  // Priorities
  priority_low: string;
  priority_medium: string;
  priority_high: string;
  priority_critical: string;

  // Statuses
  status_pending_review: string;
  status_approved: string;
  status_contact_prepared: string;
  status_contact_initiated: string;
  status_acknowledged: string;
  status_resolved: string;
  status_needs_more_info: string;
  status_escalated: string;
  status_rejected: string;
  status_open: string;
  status_in_review: string;

  // Settings Screen
  settings_title: string;
  settings_subtitle: string;
  settings_tab_general: string;
  settings_tab_speech: string;
  settings_pref_lang_title: string;
  settings_pref_lang_desc: string;
  settings_voice_input_title: string;
  settings_voice_input_desc: string;
  settings_enable_voice_input: string;
  settings_voice_output_title: string;
  settings_voice_output_desc: string;
  settings_enable_voice_output: string;
  settings_auto_read_title: string;
  settings_auto_read_desc: string;
  settings_speech_speed_title: string;
  settings_speed_slow: string;
  settings_speed_normal: string;
  settings_speed_fast: string;
  settings_persistence_title: string;
  settings_persistence_desc: string;
  settings_persistence_badge: string;
  settings_test_mic_label: string;
  settings_test_mic_desc: string;
  settings_test_voice_label: string;
  settings_test_voice_sample: string;
  settings_provider_title: string;
  settings_provider_web_speech: string;
  settings_provider_bhashini: string;

  // Prompt / Banner for First Time
  banner_initial_title: string;
  banner_initial_desc: string;
  banner_confirm_btn: string;

  // Audio Reading Prompts
  audio_complaint_intro: string;
  audio_status: string;
  audio_priority: string;
  audio_summary: string;
  audio_recommended_action: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_complaints: 'Complaints',
    nav_incidents: 'Incidents',
    nav_departments: 'Departments',
    nav_analytics: 'Analytics',
    nav_escalations: 'Escalations',
    nav_history: 'Review History',
    nav_settings: 'Settings',
    nav_landing: 'Public Landing Page',
    nav_back_to_app: 'Back to App',

    // Buttons
    btn_approve: 'Approve',
    btn_override: 'Edit & Override',
    btn_reject: 'Reject',
    btn_request_info: 'Request Info',
    btn_save_changes: 'Save Changes',
    btn_saved: 'Saved',
    btn_reset_defaults: 'Reset to Defaults',
    btn_reset_demo: 'Reset Demo Data',
    btn_close: 'Close',
    btn_cancel: 'Cancel',
    btn_submit: 'Submit Grievance',
    btn_new_complaint: '+ New Complaint',
    btn_speak_now: 'Speak now...',
    btn_listening: 'Listening...',
    btn_click_to_speak: 'Click to speak',
    btn_stop_listening: 'Stop',
    btn_listen: 'Listen',
    btn_stop_audio: 'Stop Audio',
    btn_test_voice: 'Test Voice Output',

    // Search & Filters
    search_placeholder: 'Search complaints...',
    filter_all_categories: 'All Categories',
    filter_all_priorities: 'All Priorities',
    filter_all_statuses: 'All Statuses',
    filter_needs_review: 'Needs Review',

    // Categories
    cat_water: 'Water Supply & Sewage',
    cat_garbage: 'Garbage & Sanitation',
    cat_lighting: 'Street Lighting',
    cat_roads: 'Roads & Potholes',
    cat_electrical: 'Electrical Hazards',

    // Priorities
    priority_low: 'Low',
    priority_medium: 'Medium',
    priority_high: 'High',
    priority_critical: 'Critical',

    // Statuses
    status_pending_review: 'Pending Review',
    status_approved: 'Approved',
    status_contact_prepared: 'Contact Prepared',
    status_contact_initiated: 'Contact Initiated',
    status_acknowledged: 'Acknowledged',
    status_resolved: 'Resolved',
    status_needs_more_info: 'Needs More Info',
    status_escalated: 'Escalated',
    status_rejected: 'Rejected',
    status_open: 'Open',
    status_in_review: 'In Review',

    // Settings Screen
    settings_title: 'Language & Accessibility Settings',
    settings_subtitle: 'Configure your preferred language and speech assistance settings. Preferences persist automatically across sessions.',
    settings_tab_general: 'Language & Preferences',
    settings_tab_speech: 'Speech & Accessibility',
    settings_pref_lang_title: '1. Preferred Language',
    settings_pref_lang_desc: 'Select your preferred language. GrievanceTriage automatically applies it across navigation, forms, buttons, and notifications.',
    settings_voice_input_title: '2. Voice Input Settings',
    settings_voice_input_desc: 'When enabled, a microphone option appears on complaint forms so you can speak in your preferred language. Speech is converted to editable text.',
    settings_enable_voice_input: 'Enable Voice Input (Microphone on forms)',
    settings_voice_output_title: '3. Voice Output Settings',
    settings_voice_output_desc: 'Hear complaint summaries, status updates, and instructions spoken aloud in your selected language.',
    settings_enable_voice_output: 'Enable Voice Responses (Audio readout)',
    settings_auto_read_title: 'Auto-read Responses',
    settings_auto_read_desc: 'Automatically speak complaint details when opened, without requiring you to click Play.',
    settings_speech_speed_title: 'Speech Speed',
    settings_speed_slow: 'Slow (0.8x)',
    settings_speed_normal: 'Normal (1.0x)',
    settings_speed_fast: 'Fast (1.25x)',
    settings_persistence_title: '4. Preference Persistence',
    settings_persistence_desc: 'Your preferences are saved in browser local storage and restored on subsequent visits. No repeated prompts.',
    settings_persistence_badge: 'Persisted to LocalStorage (grievancetriage_accessibility_settings_v1)',
    settings_test_mic_label: 'Microphone Test',
    settings_test_mic_desc: 'Speak into your microphone to verify speech recognition.',
    settings_test_voice_label: 'Voice Playback Test',
    settings_test_voice_sample: 'Welcome to GrievanceTriage. Your voice and accessibility settings are active.',
    settings_provider_title: '5. Technical & Provider Integration',
    settings_provider_web_speech: 'Browser Web Speech API: Active (Zero external API credentials required)',
    settings_provider_bhashini: 'BHASHINI Enterprise Gateway: Ready (Configure server keys in .env.local for cloud models)',

    // Initial Banner
    banner_initial_title: 'Welcome to GrievanceTriage — Choose Your Preferred Language',
    banner_initial_desc: 'Select your preferred language and voice preferences. Your choice will be remembered permanently across visits.',
    banner_confirm_btn: 'Save Preference',

    // Audio Reading
    audio_complaint_intro: 'Complaint reference',
    audio_status: 'Current status',
    audio_priority: 'Priority',
    audio_summary: 'Summary',
    audio_recommended_action: 'Recommended action'
  },

  hi: {
    // Navigation
    nav_overview: 'अवलोकन',
    nav_complaints: 'शिकायतें',
    nav_incidents: 'घटना समूह',
    nav_departments: 'विभाग',
    nav_analytics: 'विश्लेषण',
    nav_escalations: 'एस्केलेशन',
    nav_history: 'समीक्षा इतिहास',
    nav_settings: 'सेटिंग्स',
    nav_landing: 'सार्वजनिक लैंडिंग पृष्ठ',
    nav_back_to_app: 'ऐप पर वापस',

    // Buttons
    btn_approve: 'स्वीकृत करें',
    btn_override: 'संपादित करें और बदलें',
    btn_reject: 'अस्वीकार करें',
    btn_request_info: 'जानकारी मांगें',
    btn_save_changes: 'परिवर्तन सहेजें',
    btn_saved: 'सहेजा गया',
    btn_reset_defaults: 'डिफ़ॉल्ट पर रीसेट करें',
    btn_reset_demo: 'डेमो डेटा रीसेट करें',
    btn_close: 'बंद करें',
    btn_cancel: 'रद्द करें',
    btn_submit: 'शिकायत दर्ज करें',
    btn_new_complaint: '+ नई शिकायत',
    btn_speak_now: 'बोलिए...',
    btn_listening: 'सुन रहे हैं...',
    btn_click_to_speak: 'बोलने के लिए क्लिक करें',
    btn_stop_listening: 'रोकें',
    btn_listen: 'सुनें',
    btn_stop_audio: 'ऑडियो रोकें',
    btn_test_voice: 'ध्वनि आउटपुट का परीक्षण करें',

    // Search & Filters
    search_placeholder: 'शिकायतें खोजें...',
    filter_all_categories: 'सभी श्रेणियां',
    filter_all_priorities: 'सभी प्राथमिकताएं',
    filter_all_statuses: 'सभी स्थितियां',
    filter_needs_review: 'समीक्षा आवश्यक',

    // Categories
    cat_water: 'जल आपूर्ति और सीवरेज',
    cat_garbage: 'कचरा और स्वच्छता',
    cat_lighting: 'स्ट्रीट लाइट',
    cat_roads: 'सड़कें और गड्ढे',
    cat_electrical: 'विद्युत खतरे',

    // Priorities
    priority_low: 'निम्न',
    priority_medium: 'मध्यम',
    priority_high: 'उच्च',
    priority_critical: 'गंभीर',

    // Statuses
    status_pending_review: 'समीक्षा लंबित',
    status_approved: 'स्वीकृत',
    status_contact_prepared: 'संपर्क तैयार',
    status_contact_initiated: 'संपर्क शुरू किया गया',
    status_acknowledged: 'अभिस्वीकृत',
    status_resolved: 'हल किया गया',
    status_needs_more_info: 'अधिक जानकारी चाहिए',
    status_escalated: 'एस्केलेट किया गया',
    status_rejected: 'अस्वीकृत',
    status_open: 'खुला है',
    status_in_review: 'समीक्षाधीन',

    // Settings Screen
    settings_title: 'भाषा और सुगमता सेटिंग्स',
    settings_subtitle: 'अपनी पसंदीदा भाषा और ध्वनि सहायता सेटिंग्स कॉन्फ़िगर करें। प्राथमिकताएं हमेशा सहेजी रहती हैं।',
    settings_tab_general: 'भाषा और प्राथमिकताएं',
    settings_tab_speech: 'ध्वनि और सुगमता',
    settings_pref_lang_title: '1. पसंदीदा भाषा',
    settings_pref_lang_desc: 'अपनी पसंदीदा भाषा चुनें। GrievanceTriage इसे नेविगेशन, फ़ॉर्म, बटन और सूचनाओं पर लागू करता है।',
    settings_voice_input_title: '2. वॉयस इनपुट सेटिंग्स',
    settings_voice_input_desc: 'सक्षम होने पर, शिकायत फ़ॉर्म पर एक माइक्रोफ़ोन दिखाई देता है जिससे आप बोल सकते हैं। बोली को संपादन योग्य पाठ में बदला जाता है।',
    settings_enable_voice_input: 'वॉयस इनपुट सक्षम करें (फ़ॉर्म पर माइक्रोफ़ोन)',
    settings_voice_output_title: '3. वॉयस आउटपुट सेटिंग्स',
    settings_voice_output_desc: 'शिकायत सारांश, स्थिति और निर्देशों को अपनी चुनी हुई भाषा में बोलकर सुनें।',
    settings_enable_voice_output: 'वॉयस प्रतिक्रियाएं सक्षम करें (ऑडियो पढ़ें)',
    settings_auto_read_title: 'प्रतिक्रियाएं स्वतः पढ़ें',
    settings_auto_read_desc: 'प्ले बटन दबाए बिना शिकायत खोलते ही विवरण स्वचालित रूप से सुनें।',
    settings_speech_speed_title: 'बोलने की गति',
    settings_speed_slow: 'धीमी (0.8x)',
    settings_speed_normal: 'सामान्य (1.0x)',
    settings_speed_fast: 'तेज़ (1.25x)',
    settings_persistence_title: '4. प्राथमिकताएं सहेजना',
    settings_persistence_desc: 'आपकी प्राथमिकताएं ब्राउज़र लोकल स्टोरेज में सुरक्षित हैं और हर विज़िट पर अपने आप लोड होती हैं।',
    settings_persistence_badge: 'लोकल स्टोरेज में सुरक्षित (grievancetriage_accessibility_settings_v1)',
    settings_test_mic_label: 'माइक्रोफ़ोन परीक्षण',
    settings_test_mic_desc: 'वाक् पहचान का परीक्षण करने के लिए अपने माइक्रोफ़ोन में बोलें।',
    settings_test_voice_label: 'ध्वनि परीक्षण',
    settings_test_voice_sample: 'ग्रीवेंस ट्राइएज में आपका स्वागत है। आपकी भाषा और सुगमता सेटिंग्स सक्रिय हैं।',
    settings_provider_title: '5. तकनीकी और प्रदाता एकीकरण',
    settings_provider_web_speech: 'ब्राउज़र वेब स्पीच एपीआई: सक्रिय (शून्य बाहरी क्रेडेंशियल्स की आवश्यकता)',
    settings_provider_bhashini: 'भाषिणी (BHASHINI) गेटवे: तैयार (क्लाउड मॉडल हेतु .env.local में सर्वर कुंजियाँ दर्ज करें)',

    // Initial Banner
    banner_initial_title: 'GrievanceTriage में आपका स्वागत है — अपनी पसंदीदा भाषा चुनें',
    banner_initial_desc: 'अपनी पसंदीदा भाषा और वॉयस सेटिंग्स चुनें। आपकी पसंद हमेशा याद रखी जाएगी।',
    banner_confirm_btn: 'प्राथमिकता सहेजें',

    // Audio Reading
    audio_complaint_intro: 'शिकायत संख्या',
    audio_status: 'वर्तमान स्थिति',
    audio_priority: 'प्राथमिकता',
    audio_summary: 'सारांश',
    audio_recommended_action: 'अनुशंसित कार्रवाई'
  },

  ta: {
    // Navigation
    nav_overview: 'கண்ணோட்டம்',
    nav_complaints: 'புகார்கள்',
    nav_incidents: 'சம்பவங்கள்',
    nav_departments: 'துறைகள்',
    nav_analytics: 'பகுப்பாய்வு',
    nav_escalations: 'தீவிரமாக்கல்கள்',
    nav_history: 'மதிப்பாய்வு வரலாறு',
    nav_settings: 'அமைப்புகள்',
    nav_landing: 'பொது முகப்புப் பக்கம்',
    nav_back_to_app: 'பயன்பாட்டிற்குத் திரும்பு',

    // Buttons
    btn_approve: 'ஒப்புதல் அளி',
    btn_override: 'திருத்தி மாற்றியமைக்கவும்',
    btn_reject: 'நிராகரிக்கவும்',
    btn_request_info: 'தகவல் கோரவும்',
    btn_save_changes: 'மாற்றங்களைச் சேமி',
    btn_saved: 'சேமிக்கப்பட்டது',
    btn_reset_defaults: 'இயல்புநிலைக்கு மீட்டமை',
    btn_reset_demo: 'டெமோ தரவை மீட்டமைக்கவும்',
    btn_close: 'மூடு',
    btn_cancel: 'ரத்துசெய்',
    btn_submit: 'குறைதீர்ப்பு சமர்ப்பிக்கவும்',
    btn_new_complaint: '+ புதிய புகார்',
    btn_speak_now: 'இப்போது பேசுங்கள்...',
    btn_listening: 'கேட்கிறது...',
    btn_click_to_speak: 'பேச கிளிக் செய்யவும்',
    btn_stop_listening: 'நிறுத்து',
    btn_listen: 'கேட்கவும்',
    btn_stop_audio: 'ஆடியோவை நிறுத்து',
    btn_test_voice: 'குரல் வெளியீட்டைச் சோதிக்கவும்',

    // Search & Filters
    search_placeholder: 'புகார்களைத் தேடவும்...',
    filter_all_categories: 'அனைத்து பிரிவுகள்',
    filter_all_priorities: 'அனைத்து முன்னுரிமைகள்',
    filter_all_statuses: 'அனைத்து நிலைகள்',
    filter_needs_review: 'மதிப்பாய்வு தேவை',

    // Categories
    cat_water: 'குடிநீர் வழங்கல் & கழிவுநீர்',
    cat_garbage: 'குப்பை & துப்புரவு',
    cat_lighting: 'தெரு விளக்குகள்',
    cat_roads: 'சாலைகள் & குழிகள்',
    cat_electrical: 'மின் அபாயங்கள்',

    // Priorities
    priority_low: 'குறைந்த',
    priority_medium: 'நடுத்தர',
    priority_high: 'உயர்',
    priority_critical: 'முக்கியமானது',

    // Statuses
    status_pending_review: 'மதிப்பாய்வு நிலுவையில் உள்ளது',
    status_approved: 'ஒப்புதல் அளிக்கப்பட்டது',
    status_contact_prepared: 'தொடர்பு தயார்',
    status_contact_initiated: 'தொடர்பு தொடங்கப்பட்டது',
    status_acknowledged: 'ஏற்றுக்கொள்ளப்பட்டது',
    status_resolved: 'தீர்க்கப்பட்டது',
    status_needs_more_info: 'கூடுதல் தகவல் தேவை',
    status_escalated: 'தீவிரப்படுத்தப்பட்டது',
    status_rejected: 'நிராகரிக்கப்பட்டது',
    status_open: 'திறந்துள்ளது',
    status_in_review: 'மதிப்பாய்வில் உள்ளது',

    // Settings Screen
    settings_title: 'மொழி மற்றும் அணுகல் அமைப்புகள்',
    settings_subtitle: 'உங்கள் விருப்பமான மொழி மற்றும் குரல் உதவி அமைப்புகளை உள்ளமைக்கவும். விருப்பங்கள் எப்போதும் நினைவில் வைக்கப்படும்.',
    settings_tab_general: 'மொழி & விருப்பங்கள்',
    settings_tab_speech: 'குரல் & அணுகல்',
    settings_pref_lang_title: '1. விருப்பமான மொழி',
    settings_pref_lang_desc: 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும். GrievanceTriage தானாகவே அதை வழிசெலுத்தல், படிவங்கள் மற்றும் எச்சரிக்கைகளில் பயன்படுத்துகிறது.',
    settings_voice_input_title: '2. குரல் உள்ளீட்டு அமைப்புகள்',
    settings_voice_input_desc: 'இயக்கப்பட்டால், புகார் படிவங்களில் மைக்ரோஃபோன் காட்டப்படும், இதன் மூலம் நீங்கள் பேசலாம். பேச்சு திருத்தக்கூடிய உரையாக மாற்றப்படும்.',
    settings_enable_voice_input: 'குரல் உள்ளீட்டை இயக்கு (படிவங்களில் மைக்ரோஃபோன்)',
    settings_voice_output_title: '3. குரல் வெளியீட்டு அமைப்புகள்',
    settings_voice_output_desc: 'புகார் சுருக்கம், நிலை மற்றும் வழிமுறைகளை நீங்கள் தேர்ந்தெடுத்த மொழியில் கேட்கவும்.',
    settings_enable_voice_output: 'குரல் பதில்களை இயக்கு (ஆடியோ வாசிப்பு)',
    settings_auto_read_title: 'பதில்களை தானாகப் படிக்கவும்',
    settings_auto_read_desc: 'பிளே பொத்தானை அழுத்தாமல் திறக்கும் போது புகார் விவரங்களை தானாகவே கேட்கவும்.',
    settings_speech_speed_title: 'பேச்சு வேகம்',
    settings_speed_slow: 'மெதுவான (0.8x)',
    settings_speed_normal: 'இயல்பான (1.0x)',
    settings_speed_fast: 'வேகமான (1.25x)',
    settings_persistence_title: '4. விருப்பங்களை சேமித்தல்',
    settings_persistence_desc: 'உங்கள் அமைப்புகள் உலாவி உள்ளூர் சேமிப்பகத்தில் சேமிக்கப்பட்டு ஒவ்வொரு வருகையிலும் தானாகவே மீட்டமைக்கப்படும்.',
    settings_persistence_badge: 'உள்ளூர் சேமிப்பகத்தில் சேமிக்கப்பட்டது (grievancetriage_accessibility_settings_v1)',
    settings_test_mic_label: 'மைக்ரோஃபோன் சோதனை',
    settings_test_mic_desc: 'பேச்சு அங்கீகாரத்தை சரிபார்க்க உங்கள் மைக்ரோஃபோனில் பேசுங்கள்.',
    settings_test_voice_label: 'குரல் சோதனை',
    settings_test_voice_sample: 'GrievanceTriage-க்கு உங்களை வரவேற்கிறோம். உங்கள் மொழி மற்றும் அணுகல் அமைப்புகள் செயல்படுகின்றன.',
    settings_provider_title: '5. தொழில்நுட்ப மற்றும் வழங்குநர் ஒருங்கிணைப்பு',
    settings_provider_web_speech: 'உலாவி வெப் ஸ்பீச் ஏபிஐ: செயலில் உள்ளது (வெளிப்புற நற்சான்றிதழ்கள் தேவையில்லை)',
    settings_provider_bhashini: 'பாஷினி (BHASHINI) நுழைவாயில்: தயார் (கிளவுட் மாடல்களுக்கு .env.local-ல் விசைகளை உள்ளமைக்கவும்)',

    // Initial Banner
    banner_initial_title: 'GrievanceTriage-க்கு வரவேற்கிறோம் — உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    banner_initial_desc: 'உங்கள் விருப்பமான மொழி மற்றும் குரல் அமைப்புகளைத் தேர்வுசெய்யவும். உங்கள் தேர்வு எப்போதும் நினைவில் வைக்கப்படும்.',
    banner_confirm_btn: 'விருப்பத்தை சேமிக்கவும்',

    // Audio Reading
    audio_complaint_intro: 'புகார் குறிப்பு எண்',
    audio_status: 'தற்போதைய நிலை',
    audio_priority: 'முன்னுரிமை',
    audio_summary: 'சுருக்கம்',
    audio_recommended_action: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை'
  }
};

export function t(key: keyof TranslationDictionary, lang: AppLanguage = 'en'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function getCategoryLabel(category: string, lang: AppLanguage = 'en'): string {
  if (lang === 'en') return category;
  const cat = category.toLowerCase();
  if (cat.includes('water')) return t('cat_water', lang);
  if (cat.includes('garbage') || cat.includes('sanitation')) return t('cat_garbage', lang);
  if (cat.includes('light')) return t('cat_lighting', lang);
  if (cat.includes('road') || cat.includes('pothole')) return t('cat_roads', lang);
  if (cat.includes('electric')) return t('cat_electrical', lang);
  return category;
}

export function getStatusLabel(status: string, lang: AppLanguage = 'en'): string {
  if (lang === 'en') return status;
  switch (status) {
    case 'Pending Review': return t('status_pending_review', lang);
    case 'Approved': return t('status_approved', lang);
    case 'Contact Prepared': return t('status_contact_prepared', lang);
    case 'Contact Initiated': return t('status_contact_initiated', lang);
    case 'Acknowledged': return t('status_acknowledged', lang);
    case 'Resolved': return t('status_resolved', lang);
    case 'Needs More Information':
    case 'Needs More Info': return t('status_needs_more_info', lang);
    case 'Escalated': return t('status_escalated', lang);
    case 'Rejected': return t('status_rejected', lang);
    case 'In Review': return t('status_in_review', lang);
    case 'Open': return t('status_open', lang);
    default: return status;
  }
}

export function getPriorityLabel(priority: string, lang: AppLanguage = 'en'): string {
  if (lang === 'en') return priority;
  switch (priority) {
    case 'Low': return t('priority_low', lang);
    case 'Medium': return t('priority_medium', lang);
    case 'High': return t('priority_high', lang);
    case 'Critical': return t('priority_critical', lang);
    default: return priority;
  }
}

export function getSpeechLocale(lang: AppLanguage): string {
  switch (lang) {
    case 'hi': return 'hi-IN';
    case 'ta': return 'ta-IN';
    case 'en':
    default: return 'en-IN';
  }
}

export function getSpeechRateMultiplier(speed: SpeechSpeed): number {
  switch (speed) {
    case 'slow': return 0.8;
    case 'fast': return 1.25;
    case 'normal':
    default: return 1.0;
  }
}
