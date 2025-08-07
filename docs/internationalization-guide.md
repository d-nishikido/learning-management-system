# Test Management API - Internationalization (i18n) Guide

## Overview

The Test Management API supports full internationalization with localized error messages, date/time formatting, and number formatting for English and Japanese languages.

## Supported Languages

- **English (en)**: Default language
- **Japanese (ja)**: Full localization support

## Locale Detection

The system detects user locale through multiple sources (in order of priority):

1. **Request Header**: `X-Locale` header
2. **Query Parameter**: `?locale=ja` or `?locale=en`
3. **Accept-Language Header**: Standard HTTP header
4. **Default**: Falls back to English (`en`)

### Example Requests

```bash
# Using X-Locale header
curl -H "X-Locale: ja" https://api.lms.example.com/api/v1/tests

# Using query parameter
curl https://api.lms.example.com/api/v1/tests?locale=ja

# Using Accept-Language header
curl -H "Accept-Language: ja-JP,ja;q=0.9" https://api.lms.example.com/api/v1/tests
```

## Localized API Endpoints

### Standard vs Localized Endpoints

| Standard Endpoint | Localized Endpoint | Description |
|------------------|-------------------|-------------|
| `/api/v1/tests` | `/api/v1/i18n/tests` | Fully localized responses |
| All test endpoints | Same with `/i18n/` prefix | Error messages, dates, numbers localized |

### Response Format

Localized responses include metadata about the localization:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "locale": "ja",
    "timeZone": "Asia/Tokyo",
    "isRTL": false
  },
  "message": "テストが正常に取得されました"
}
```

## Localized Error Messages

### Test Management Errors

| Error Code | English | Japanese |
|------------|---------|----------|
| `TEST_NOT_FOUND` | Test not found | テストが見つかりません |
| `TEST_NOT_PUBLISHED` | Test is not published | テストが公開されていません |
| `TEST_NOT_AVAILABLE_YET` | Test is not yet available | テストはまだ利用できません |
| `MAX_ATTEMPTS_EXCEEDED` | Maximum attempts ({maxAttempts}) exceeded | 最大受験回数（{maxAttempts}回）を超過しました |
| `TEST_IN_PROGRESS` | Test is already in progress | テストは既に実行中です |
| `CANNOT_DELETE_TEST_WITH_RESULTS` | Cannot delete test with completed attempts | 完了した受験記録があるテストは削除できません |

### Validation Errors

| Validation Rule | English | Japanese |
|-----------------|---------|----------|
| `string.empty` | {label} is required | {label}は必須です |
| `string.min` | {label} must be at least {limit} characters long | {label}は{limit}文字以上である必要があります |
| `number.positive` | {label} must be positive | {label}は正の数である必要があります |
| `date.greater` | {label} must be after {limit} | {label}は{limit}より後である必要があります |

### Success Messages

| Action | English | Japanese |
|---------|---------|----------|
| `TEST_CREATED` | Test created successfully | テストが正常に作成されました |
| `TEST_UPDATED` | Test updated successfully | テストが正常に更新されました |
| `TEST_STARTED` | Test started successfully | テストが正常に開始されました |
| `TEST_SUBMITTED` | Test submitted successfully | テストが正常に提出されました |

## Date and Time Localization

### Time Zone Support

Users can specify their timezone using the `X-Timezone` header:

```bash
curl -H "X-Timezone: Asia/Tokyo" -H "X-Locale: ja" \
  https://api.lms.example.com/api/v1/tests/1
```

### Date Formatting Examples

| Locale | Format | Example |
|--------|--------|---------|
| English (en-US) | MM/DD/YYYY, HH:MM AM/PM | 12/25/2024, 2:30 PM |
| Japanese (ja-JP) | YYYY年MM月DD日 HH:MM | 2024年12月25日 14:30 |

### Duration Formatting

| Locale | Format | Examples |
|--------|--------|----------|
| English | `{h}h {m}m` or `{m}m` | `1h 30m`, `45m` |
| Japanese | `{h}時間{m}分` or `{m}分` | `1時間30分`, `45分` |

### Relative Time

| Locale | Examples |
|--------|----------|
| English | `5 minutes ago`, `2 hours ago`, `3 days ago` |
| Japanese | `5分前`, `2時間前`, `3日前` |

## Number Formatting

### Score Formatting

```javascript
// English
85.5 → "85.5"
72.0 → "72.0"

// Japanese  
85.5 → "85.5"
72.0 → "72.0"
```

### Percentage Formatting

```javascript
// English
85.5 → "85.5%"
100.0 → "100.0%"

// Japanese
85.5 → "85.5%"
100.0 → "100.0%"
```

### Integer Formatting (with thousand separators)

```javascript
// English
1000 → "1,000"
1000000 → "1,000,000"

// Japanese
1000 → "1,000"
1000000 → "1,000,000"
```

## Implementation Guide

### Backend Implementation

#### 1. Using Localized Services

```typescript
import { LocalizedTestService } from '../services/localizedTestService';

// In controller
const testService = new LocalizedTestService(req);
const result = await testService.getLocalizedTests(options);
```

#### 2. Creating Localized Errors

```typescript
import { TestErrorFactory } from '../utils/localizedErrors';

const errorFactory = new TestErrorFactory(locale);
throw errorFactory.testNotFound();
```

#### 3. Formatting Dates and Numbers

```typescript
import { DateFormatter, NumberFormatter } from '../utils/i18n';

const dateFormatter = new DateFormatter('ja', 'Asia/Tokyo');
const formattedDate = dateFormatter.formatDateTime(new Date());

const numberFormatter = new NumberFormatter('ja');
const formattedScore = numberFormatter.formatScore(85.5);
```

### Frontend Implementation

#### 1. Setting Locale Headers

```typescript
// axios interceptor
axios.interceptors.request.use(config => {
  config.headers['X-Locale'] = localStorage.getItem('locale') || 'en';
  config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return config;
});
```

#### 2. Handling Localized Responses

```typescript
interface LocalizedResponse<T> {
  success: boolean;
  data: T;
  meta: {
    locale: string;
    timeZone: string;
    isRTL: boolean;
  };
  message: string;
}

// Usage
const response: LocalizedResponse<Test[]> = await api.get('/i18n/tests');
console.log(response.meta.locale); // 'ja'
console.log(response.message); // 'テストが正常に取得されました'
```

## Configuration

### Environment Variables

```bash
# Default locale
DEFAULT_LOCALE=en

# Supported locales (comma-separated)
SUPPORTED_LOCALES=en,ja

# Default timezone
DEFAULT_TIMEZONE=UTC

# Enable/disable i18n
ENABLE_I18N=true
```

### Locale Configuration

```typescript
// config/i18n.ts
export const I18N_CONFIG = {
  defaultLocale: 'en' as SupportedLocale,
  supportedLocales: ['en', 'ja'] as SupportedLocale[],
  defaultTimeZone: 'UTC',
  fallbackToDefault: true,
  validateLocale: true
};
```

## Testing Internationalization

### Unit Tests

```typescript
describe('Internationalization', () => {
  test('should return Japanese error message', async () => {
    const req = { headers: { 'x-locale': 'ja' } } as Request;
    const testService = new LocalizedTestService(req);
    
    try {
      await testService.getTestById(999);
    } catch (error) {
      expect(error.message).toBe('テストが見つかりません');
    }
  });

  test('should format date in Japanese locale', () => {
    const formatter = new DateFormatter('ja', 'Asia/Tokyo');
    const formatted = formatter.formatDate(new Date('2024-12-25'));
    expect(formatted).toMatch(/2024年12月25日/);
  });
});
```

### E2E Tests

```typescript
test('should display localized test interface', async ({ page }) => {
  // Set locale
  await page.setExtraHTTPHeaders({
    'X-Locale': 'ja',
    'X-Timezone': 'Asia/Tokyo'
  });
  
  await page.goto('/tests');
  
  // Verify Japanese interface
  await expect(page.locator('[data-testid="create-test-btn"]')).toContainText('テスト作成');
  await expect(page.locator('[data-testid="test-title-header"]')).toContainText('テスト一覧');
});
```

## Performance Considerations

### Caching Localized Content

```typescript
// Cache localized messages
const messageCache = new Map<string, LocalizedMessage>();

// Cache formatted dates
const dateCache = new Map<string, string>();

// Implementation with TTL
const CACHE_TTL = 3600000; // 1 hour

class LocalizedCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, value: any, ttl = CACHE_TTL) {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}
```

### Lazy Loading

```typescript
// Lazy load locale-specific resources
const loadLocaleResources = async (locale: SupportedLocale) => {
  if (!localeCache.has(locale)) {
    const resources = await import(`../locales/${locale}.json`);
    localeCache.set(locale, resources);
  }
  return localeCache.get(locale);
};
```

## Migration Guide

### Adding New Languages

1. **Create message definitions**:
```typescript
// Add to TEST_ERROR_MESSAGES
VALIDATION_ERROR: {
  en: 'Validation failed: {details}',
  ja: '入力検証エラー: {details}',
  fr: 'Échec de validation: {details}' // New language
}
```

2. **Update SupportedLocale type**:
```typescript
export type SupportedLocale = 'en' | 'ja' | 'fr';
```

3. **Add formatting rules**:
```typescript
private getIntlLocale(): string {
  switch(this.locale) {
    case 'ja': return 'ja-JP';
    case 'fr': return 'fr-FR';
    default: return 'en-US';
  }
}
```

4. **Update validation schemas**:
```typescript
const labels = {
  en: { title: 'Test title' },
  ja: { title: 'テストタイトル' },
  fr: { title: 'Titre du test' } // New language
};
```

### Gradual Migration

For existing applications, enable i18n gradually:

1. **Phase 1**: Add locale detection and metadata
2. **Phase 2**: Implement localized error messages  
3. **Phase 3**: Add date/time formatting
4. **Phase 4**: Implement localized validation
5. **Phase 5**: Full localization with new languages

## Best Practices

### 1. Message Structure
- Use placeholder variables: `{variable}`
- Keep messages concise and clear
- Maintain consistent tone across languages

### 2. Date/Time Handling
- Always include timezone information
- Use ISO 8601 format for API communication
- Format dates on display only

### 3. Number Formatting
- Use appropriate decimal places for different number types
- Consider cultural differences in number representation
- Cache formatted numbers when possible

### 4. Error Handling
- Provide context-specific error messages
- Include field names in validation errors
- Maintain error code consistency across languages

### 5. Testing
- Test with different locales and timezones
- Verify text length doesn't break UI layouts
- Test character encoding (Unicode support)

## Troubleshooting

### Common Issues

1. **Mixed Language Responses**
```typescript
// Problem: Inconsistent locale detection
const locale1 = getLocaleFromRequest(req); // 'ja'
const locale2 = req.headers['accept-language']; // 'en'

// Solution: Use single source of truth
const locale = getLocaleFromRequest(req);
const service = new LocalizedTestService(req); // Uses same detection
```

2. **Date Timezone Issues**
```typescript
// Problem: Incorrect timezone conversion
const date = new Date('2024-12-25T10:00:00Z');
const formatted = date.toLocaleString('ja-JP'); // Uses system timezone

// Solution: Explicit timezone handling
const formatter = new DateFormatter('ja', 'Asia/Tokyo');
const formatted = formatter.formatDateTime(date); // Correct timezone
```

3. **Validation Message Inconsistency**
```typescript
// Problem: Mixed English/Japanese validation errors
const schema = Joi.string().required().messages({
  'string.empty': 'Required field' // English only
});

// Solution: Use localized schema factory
const schemas = createLocalizedSchema(locale);
const schema = schemas.createTestSchema; // Fully localized
```

## Conclusion

The internationalization system provides comprehensive localization support for the Test Management API, ensuring a seamless user experience across different languages and regions. The modular design allows for easy extension to additional languages and locales while maintaining high performance through caching and lazy loading strategies.