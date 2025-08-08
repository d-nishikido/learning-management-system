import { Request } from 'express';
import {
  getLocaleFromRequest,
  getLocalizedMessage,
  DateFormatter,
  NumberFormatter,
  TEST_ERROR_MESSAGES,
  TEST_SUCCESS_MESSAGES
} from '../i18n';

describe('Internationalization Utils', () => {
  describe('getLocaleFromRequest', () => {
    it('should return locale from X-Locale header', () => {
      const req = {
        headers: { 'x-locale': 'ja' },
        query: {}
      } as Request;

      const locale = getLocaleFromRequest(req);
      expect(locale).toBe('ja');
    });

    it('should return locale from query parameter', () => {
      const req = {
        headers: {},
        query: { locale: 'ja' }
      } as Request;

      const locale = getLocaleFromRequest(req);
      expect(locale).toBe('ja');
    });

    it('should return locale from Accept-Language header', () => {
      const req = {
        headers: { 'accept-language': 'ja-JP,ja;q=0.9,en;q=0.8' },
        query: {}
      } as Request;

      const locale = getLocaleFromRequest(req);
      expect(locale).toBe('ja');
    });

    it('should return default locale (en) when no locale specified', () => {
      const req = {
        headers: {},
        query: {}
      } as Request;

      const locale = getLocaleFromRequest(req);
      expect(locale).toBe('en');
    });

    it('should prioritize X-Locale header over query parameter', () => {
      const req = {
        headers: { 'x-locale': 'ja' },
        query: { locale: 'en' }
      } as Request;

      const locale = getLocaleFromRequest(req);
      expect(locale).toBe('ja');
    });
  });

  describe('getLocalizedMessage', () => {
    it('should return English message', () => {
      const message = getLocalizedMessage(
        TEST_ERROR_MESSAGES.TEST_NOT_FOUND,
        'en'
      );
      expect(message).toBe('Test not found');
    });

    it('should return Japanese message', () => {
      const message = getLocalizedMessage(
        TEST_ERROR_MESSAGES.TEST_NOT_FOUND,
        'ja'
      );
      expect(message).toBe('テストが見つかりません');
    });

    it('should replace parameters in message', () => {
      const message = getLocalizedMessage(
        TEST_ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED,
        'en',
        { maxAttempts: '3' }
      );
      expect(message).toBe('Maximum attempts (3) exceeded');
    });

    it('should replace parameters in Japanese message', () => {
      const message = getLocalizedMessage(
        TEST_ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED,
        'ja',
        { maxAttempts: '3' }
      );
      expect(message).toBe('最大受験回数（3回）を超過しました');
    });

    it('should handle multiple parameters', () => {
      const message = getLocalizedMessage(
        TEST_ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        'en',
        { action: 'update' }
      );
      expect(message).toBe('You can only update tests you created');
    });
  });

  describe('DateFormatter', () => {
    const testDate = new Date('2024-12-25T14:30:45Z');

    describe('English formatting', () => {
      const formatter = new DateFormatter('en', 'UTC');

      it('should format date in English', () => {
        const formatted = formatter.formatDate(testDate);
        expect(formatted).toMatch(/December 25, 2024/);
      });

      it('should format datetime in English', () => {
        const formatted = formatter.formatDateTime(testDate);
        expect(formatted).toMatch(/Dec 25, 2024, 2:30 PM/);
      });

      it('should format time in English', () => {
        const formatted = formatter.formatTime(testDate);
        expect(formatted).toMatch(/2:30:45 PM/);
      });

      it('should format duration in English', () => {
        expect(formatter.formatDuration(90)).toBe('1h 30m');
        expect(formatter.formatDuration(45)).toBe('45m');
        expect(formatter.formatDuration(120)).toBe('2h');
      });

      it('should format relative time in English', () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const formatted = formatter.formatRelativeTime(oneHourAgo);
        expect(formatted).toMatch(/1 hours? ago/);
      });
    });

    describe('Japanese formatting', () => {
      const formatter = new DateFormatter('ja', 'Asia/Tokyo');

      it('should format date in Japanese', () => {
        const formatted = formatter.formatDate(testDate);
        expect(formatted).toMatch(/2024年12月25日/);
      });

      it('should format datetime in Japanese', () => {
        const formatted = formatter.formatDateTime(testDate);
        expect(formatted).toMatch(/2024年12月25日/);
      });

      it('should format duration in Japanese', () => {
        expect(formatter.formatDuration(90)).toBe('1時間30分');
        expect(formatter.formatDuration(45)).toBe('45分');
        expect(formatter.formatDuration(120)).toBe('2時間');
      });

      it('should format relative time in Japanese', () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const formatted = formatter.formatRelativeTime(oneHourAgo);
        expect(formatted).toMatch(/1時間前/);
      });
    });

    describe('Timezone handling', () => {
      it('should format date in different timezone', () => {
        const utcFormatter = new DateFormatter('en', 'UTC');
        const tokyoFormatter = new DateFormatter('en', 'Asia/Tokyo');
        
        const utcFormatted = utcFormatter.formatDateTime(testDate);
        const tokyoFormatted = tokyoFormatter.formatDateTime(testDate);
        
        // Should be different due to timezone offset
        expect(utcFormatted).not.toBe(tokyoFormatted);
      });
    });
  });

  describe('NumberFormatter', () => {
    describe('English formatting', () => {
      const formatter = new NumberFormatter('en');

      it('should format score', () => {
        expect(formatter.formatScore(85.5)).toBe('85.5');
        expect(formatter.formatScore(100)).toBe('100.0');
      });

      it('should format percentage', () => {
        expect(formatter.formatPercentage(85.5)).toBe('85.5%');
        expect(formatter.formatPercentage(100)).toBe('100.0%');
      });

      it('should format integer with thousand separators', () => {
        expect(formatter.formatInteger(1000)).toBe('1,000');
        expect(formatter.formatInteger(1000000)).toBe('1,000,000');
      });
    });

    describe('Japanese formatting', () => {
      const formatter = new NumberFormatter('ja');

      it('should format score', () => {
        expect(formatter.formatScore(85.5)).toBe('85.5');
        expect(formatter.formatScore(100)).toBe('100.0');
      });

      it('should format percentage', () => {
        expect(formatter.formatPercentage(85.5)).toBe('85.5%');
        expect(formatter.formatPercentage(100)).toBe('100.0%');
      });

      it('should format integer with thousand separators', () => {
        expect(formatter.formatInteger(1000)).toBe('1,000');
        expect(formatter.formatInteger(1000000)).toBe('1,000,000');
      });
    });
  });

  describe('Message constants', () => {
    it('should have all error messages in both languages', () => {
      Object.values(TEST_ERROR_MESSAGES).forEach(message => {
        expect(message).toHaveProperty('en');
        expect(message).toHaveProperty('ja');
        expect(typeof message.en).toBe('string');
        expect(typeof message.ja).toBe('string');
        expect(message.en.length).toBeGreaterThan(0);
        expect(message.ja.length).toBeGreaterThan(0);
      });
    });

    it('should have all success messages in both languages', () => {
      Object.values(TEST_SUCCESS_MESSAGES).forEach(message => {
        expect(message).toHaveProperty('en');
        expect(message).toHaveProperty('ja');
        expect(typeof message.en).toBe('string');
        expect(typeof message.ja).toBe('string');
        expect(message.en.length).toBeGreaterThan(0);
        expect(message.ja.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle string dates in DateFormatter', () => {
      const formatter = new DateFormatter('en', 'UTC');
      const formatted = formatter.formatDate('2024-12-25T14:30:45Z');
      expect(formatted).toMatch(/December 25, 2024/);
    });

    it('should handle zero duration', () => {
      const formatter = new DateFormatter('en');
      expect(formatter.formatDuration(0)).toBe('0m');
    });

    it('should handle large numbers', () => {
      const formatter = new NumberFormatter('en');
      expect(formatter.formatInteger(1234567890)).toBe('1,234,567,890');
    });

    it('should handle decimal precision', () => {
      const formatter = new NumberFormatter('en');
      expect(formatter.formatScore(85.123456)).toBe('85.1');
      expect(formatter.formatPercentage(85.123456)).toBe('85.1%');
    });
  });
});