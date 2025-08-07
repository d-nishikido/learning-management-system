import Joi from 'joi';
import { SupportedLocale, VALIDATION_MESSAGES, getLocalizedMessage } from '../utils/i18n';

// Custom Joi extension for localized messages
const createLocalizedSchema = (locale: SupportedLocale = 'en') => {
  // Helper function to get localized message
  const getMessage = (key: keyof typeof VALIDATION_MESSAGES) => {
    return getLocalizedMessage(VALIDATION_MESSAGES[key], locale);
  };

  // Field labels in different languages
  const labels = {
    en: {
      title: 'Test title',
      description: 'Test description',
      courseId: 'Course ID',
      lessonId: 'Lesson ID',
      timeLimitMinutes: 'Time limit',
      maxAttempts: 'Max attempts',
      passingScore: 'Passing score',
      shuffleQuestions: 'Shuffle questions',
      shuffleOptions: 'Shuffle options',
      showResultsImmediately: 'Show results immediately',
      isPublished: 'Is published',
      availableFrom: 'Available from',
      availableUntil: 'Available until',
      questionId: 'Question ID',
      sortOrder: 'Sort order',
      testResultId: 'Test result ID',
      answers: 'Answers',
      selectedOptionId: 'Selected option ID',
      answerText: 'Answer text'
    },
    ja: {
      title: 'テストタイトル',
      description: 'テスト説明',
      courseId: 'コースID',
      lessonId: 'レッスンID',
      timeLimitMinutes: '制限時間',
      maxAttempts: '最大受験回数',
      passingScore: '合格点',
      shuffleQuestions: '問題のシャッフル',
      shuffleOptions: '選択肢のシャッフル',
      showResultsImmediately: '結果の即座表示',
      isPublished: '公開状態',
      availableFrom: '利用開始日',
      availableUntil: '利用終了日',
      questionId: '問題ID',
      sortOrder: '並び順',
      testResultId: 'テスト結果ID',
      answers: '回答',
      selectedOptionId: '選択された選択肢ID',
      answerText: '回答テキスト'
    }
  };

  const createTestSchema = Joi.object({
    title: Joi.string()
      .required()
      .min(1)
      .max(200)
      .label(labels[locale].title)
      .messages({
        'string.empty': getMessage('string.empty'),
        'string.min': getMessage('string.min'),
        'string.max': getMessage('string.max'),
        'any.required': getMessage('any.required')
      }),

    description: Joi.string()
      .allow('', null)
      .max(1000)
      .label(labels[locale].description)
      .messages({
        'string.max': getMessage('string.max')
      }),

    courseId: Joi.number()
      .integer()
      .positive()
      .required()
      .label(labels[locale].courseId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive'),
        'any.required': getMessage('any.required')
      }),

    lessonId: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .label(labels[locale].lessonId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive')
      }),

    timeLimitMinutes: Joi.number()
      .integer()
      .min(1)
      .max(480)
      .allow(null)
      .label(labels[locale].timeLimitMinutes)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    maxAttempts: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .label(labels[locale].maxAttempts)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    passingScore: Joi.number()
      .min(0)
      .max(100)
      .label(labels[locale].passingScore)
      .messages({
        'number.base': getMessage('number.base'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    shuffleQuestions: Joi.boolean()
      .label(labels[locale].shuffleQuestions)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    shuffleOptions: Joi.boolean()
      .label(labels[locale].shuffleOptions)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    showResultsImmediately: Joi.boolean()
      .label(labels[locale].showResultsImmediately)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    isPublished: Joi.boolean()
      .label(labels[locale].isPublished)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    availableFrom: Joi.date()
      .iso()
      .allow(null)
      .label(labels[locale].availableFrom)
      .messages({
        'date.base': getMessage('date.base'),
        'date.format': getMessage('date.format')
      }),

    availableUntil: Joi.date()
      .iso()
      .allow(null)
      .when('availableFrom', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('availableFrom')),
        otherwise: Joi.date()
      })
      .label(labels[locale].availableUntil)
      .messages({
        'date.base': getMessage('date.base'),
        'date.format': getMessage('date.format'),
        'date.greater': getMessage('date.greater')
      })
  });

  const updateTestSchema = Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .label(labels[locale].title)
      .messages({
        'string.min': getMessage('string.min'),
        'string.max': getMessage('string.max')
      }),

    description: Joi.string()
      .allow('', null)
      .max(1000)
      .label(labels[locale].description)
      .messages({
        'string.max': getMessage('string.max')
      }),

    courseId: Joi.number()
      .integer()
      .positive()
      .label(labels[locale].courseId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive')
      }),

    lessonId: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .label(labels[locale].lessonId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive')
      }),

    timeLimitMinutes: Joi.number()
      .integer()
      .min(1)
      .max(480)
      .allow(null)
      .label(labels[locale].timeLimitMinutes)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    maxAttempts: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .label(labels[locale].maxAttempts)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    passingScore: Joi.number()
      .min(0)
      .max(100)
      .label(labels[locale].passingScore)
      .messages({
        'number.base': getMessage('number.base'),
        'number.min': getMessage('number.min'),
        'number.max': getMessage('number.max')
      }),

    shuffleQuestions: Joi.boolean()
      .label(labels[locale].shuffleQuestions)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    shuffleOptions: Joi.boolean()
      .label(labels[locale].shuffleOptions)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    showResultsImmediately: Joi.boolean()
      .label(labels[locale].showResultsImmediately)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    isPublished: Joi.boolean()
      .label(labels[locale].isPublished)
      .messages({
        'boolean.base': getMessage('boolean.base')
      }),

    availableFrom: Joi.date()
      .iso()
      .allow(null)
      .label(labels[locale].availableFrom)
      .messages({
        'date.base': getMessage('date.base'),
        'date.format': getMessage('date.format')
      }),

    availableUntil: Joi.date()
      .iso()
      .allow(null)
      .when('availableFrom', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('availableFrom')),
        otherwise: Joi.date()
      })
      .label(labels[locale].availableUntil)
      .messages({
        'date.base': getMessage('date.base'),
        'date.format': getMessage('date.format'),
        'date.greater': getMessage('date.greater')
      })
  }).min(1).messages({
    'object.min': getMessage('object.min')
  });

  const addQuestionToTestSchema = Joi.object({
    questionId: Joi.number()
      .integer()
      .positive()
      .required()
      .label(labels[locale].questionId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive'),
        'any.required': getMessage('any.required')
      }),

    sortOrder: Joi.number()
      .integer()
      .min(1)
      .label(labels[locale].sortOrder)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.min': getMessage('number.min')
      })
  });

  const submitTestSchema = Joi.object({
    testResultId: Joi.number()
      .integer()
      .positive()
      .required()
      .label(labels[locale].testResultId)
      .messages({
        'number.base': getMessage('number.base'),
        'number.integer': getMessage('number.integer'),
        'number.positive': getMessage('number.positive'),
        'any.required': getMessage('any.required')
      }),

    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.number()
            .integer()
            .positive()
            .required()
            .label(labels[locale].questionId)
            .messages({
              'number.base': getMessage('number.base'),
              'number.integer': getMessage('number.integer'),
              'number.positive': getMessage('number.positive'),
              'any.required': getMessage('any.required')
            }),

          selectedOptionId: Joi.number()
            .integer()
            .positive()
            .when('answerText', {
              is: Joi.exist(),
              then: Joi.optional(),
              otherwise: Joi.required()
            })
            .label(labels[locale].selectedOptionId)
            .messages({
              'number.base': getMessage('number.base'),
              'number.integer': getMessage('number.integer'),
              'number.positive': getMessage('number.positive'),
              'any.required': locale === 'ja' ? 
                '選択式問題には選択された選択肢IDが必要です' : 
                'Selected option ID is required for choice questions'
            }),

          answerText: Joi.string()
            .max(5000)
            .when('selectedOptionId', {
              is: Joi.exist(),
              then: Joi.optional(),
              otherwise: Joi.required()
            })
            .label(labels[locale].answerText)
            .messages({
              'string.base': getMessage('string.empty'),
              'string.max': getMessage('string.max'),
              'any.required': locale === 'ja' ? 
                '記述式・プログラミング問題には回答テキストが必要です' : 
                'Answer text is required for essay/programming questions'
            })
        }).or('selectedOptionId', 'answerText')
      )
      .required()
      .label(labels[locale].answers)
      .messages({
        'array.base': getMessage('array.base'),
        'any.required': getMessage('any.required')
      })
  });

  return {
    createTestSchema,
    updateTestSchema,
    addQuestionToTestSchema,
    submitTestSchema
  };
};

// Export schema factory
export { createLocalizedSchema };

// Export default schemas (English)
export const {
  createTestSchema: createTestSchemaEn,
  updateTestSchema: updateTestSchemaEn,
  addQuestionToTestSchema: addQuestionToTestSchemaEn,
  submitTestSchema: submitTestSchemaEn
} = createLocalizedSchema('en');

// Export Japanese schemas
export const {
  createTestSchema: createTestSchemaJa,
  updateTestSchema: updateTestSchemaJa,
  addQuestionToTestSchema: addQuestionToTestSchemaJa,
  submitTestSchema: submitTestSchemaJa
} = createLocalizedSchema('ja');