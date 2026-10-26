import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SEED_COMPLAINTS } from '../src/data/mockData';
import {
  t,
  getCategoryLabel,
  getStatusLabel,
  getPriorityLabel,
  getSpeechLocale,
  getSpeechRateMultiplier
} from '../src/lib/i18n';
import { DEFAULT_SETTINGS } from '../src/context/TriageContext';

describe('Deduplication & Unique Key Integrity', () => {
  it('ensures SEED_COMPLAINTS contains zero duplicate IDs', () => {
    const ids = SEED_COMPLAINTS.map(c => c.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'Every complaint ID must be strictly unique');

    // Specifically test the 5 IDs previously reported as duplicates
    const checkIds = [
      'GRV-2026-1012',
      'GRV-2026-1018',
      'GRV-2026-1021',
      'GRV-2026-1027',
      'GRV-2026-1041'
    ];
    for (const testId of checkIds) {
      const occurrences = ids.filter(id => id === testId).length;
      assert.strictEqual(occurrences, 1, `${testId} must appear exactly once in SEED_COMPLAINTS`);
    }
  });

  it('ensures shortIds are unique across the dataset', () => {
    const shortIds = SEED_COMPLAINTS.map(c => c.shortId);
    const uniqueShortIds = new Set(shortIds);
    assert.strictEqual(shortIds.length, uniqueShortIds.size, 'All shortIds must be unique');
  });
});

describe('Multilingual i18n & Accessibility System', () => {
  it('translates navigation and core labels for English, Hindi, and Tamil', () => {
    // English
    assert.strictEqual(t('nav_settings', 'en'), 'Settings');
    assert.strictEqual(t('nav_complaints', 'en'), 'Complaints');

    // Hindi (हिंदी)
    assert.strictEqual(t('nav_settings', 'hi'), 'सेटिंग्स');
    assert.strictEqual(t('nav_complaints', 'hi'), 'शिकायतें');

    // Tamil (தமிழ்)
    assert.strictEqual(t('nav_settings', 'ta'), 'அமைப்புகள்');
    assert.strictEqual(t('nav_complaints', 'ta'), 'புகார்கள்');
  });

  it('localizes status badges accurately while preserving database enums', () => {
    // English
    assert.strictEqual(getStatusLabel('Approved', 'en'), 'Approved');
    assert.strictEqual(getStatusLabel('Pending Review', 'en'), 'Pending Review');

    // Hindi
    assert.strictEqual(getStatusLabel('Approved', 'hi'), 'स्वीकृत');
    assert.strictEqual(getStatusLabel('Pending Review', 'hi'), 'समीक्षा लंबित');

    // Tamil
    assert.strictEqual(getStatusLabel('Approved', 'ta'), 'ஒப்புதல் அளிக்கப்பட்டது');
    assert.strictEqual(getStatusLabel('Pending Review', 'ta'), 'மதிப்பாய்வு நிலுவையில் உள்ளது');
  });

  it('localizes priority labels accurately', () => {
    assert.strictEqual(getPriorityLabel('High', 'en'), 'High');
    assert.strictEqual(getPriorityLabel('High', 'hi'), 'उच्च');
    assert.strictEqual(getPriorityLabel('High', 'ta'), 'உயர்');
  });

  it('maps speech locales and speech rates correctly', () => {
    assert.strictEqual(getSpeechLocale('en'), 'en-IN');
    assert.strictEqual(getSpeechLocale('hi'), 'hi-IN');
    assert.strictEqual(getSpeechLocale('ta'), 'ta-IN');

    assert.strictEqual(getSpeechRateMultiplier('slow'), 0.8);
    assert.strictEqual(getSpeechRateMultiplier('normal'), 1.0);
    assert.strictEqual(getSpeechRateMultiplier('fast'), 1.25);
  });

  it('provides sensible default settings for first-time visitors', () => {
    assert.strictEqual(DEFAULT_SETTINGS.language, 'en');
    assert.strictEqual(DEFAULT_SETTINGS.voiceInput, false);
    assert.strictEqual(DEFAULT_SETTINGS.voiceOutput, false);
    assert.strictEqual(DEFAULT_SETTINGS.autoRead, false);
    assert.strictEqual(DEFAULT_SETTINGS.speechSpeed, 'normal');
    assert.strictEqual(DEFAULT_SETTINGS.hasConfiguredPreferences, false);
  });
});
