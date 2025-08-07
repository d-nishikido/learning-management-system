import Joi from 'joi';

export const createTestSchema = Joi.object({
  title: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Test title is required',
      'string.min': 'Test title must be at least 1 character long',
      'string.max': 'Test title must be at most 200 characters long',
    }),

  description: Joi.string()
    .allow('', null)
    .max(1000)
    .messages({
      'string.max': 'Test description must be at most 1000 characters long',
    }),

  courseId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Course ID must be a number',
      'number.integer': 'Course ID must be an integer',
      'number.positive': 'Course ID must be positive',
      'any.required': 'Course ID is required',
    }),

  lessonId: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Lesson ID must be a number',
      'number.integer': 'Lesson ID must be an integer',
      'number.positive': 'Lesson ID must be positive',
    }),

  timeLimitMinutes: Joi.number()
    .integer()
    .min(1)
    .max(480) // 8 hours max
    .allow(null)
    .messages({
      'number.base': 'Time limit must be a number',
      'number.integer': 'Time limit must be an integer',
      'number.min': 'Time limit must be at least 1 minute',
      'number.max': 'Time limit must be at most 480 minutes (8 hours)',
    }),

  maxAttempts: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .allow(null)
    .messages({
      'number.base': 'Max attempts must be a number',
      'number.integer': 'Max attempts must be an integer',
      'number.min': 'Max attempts must be at least 1',
      'number.max': 'Max attempts must be at most 10',
    }),

  passingScore: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Passing score must be a number',
      'number.min': 'Passing score must be at least 0',
      'number.max': 'Passing score must be at most 100',
    }),

  shuffleQuestions: Joi.boolean()
    .messages({
      'boolean.base': 'Shuffle questions must be a boolean',
    }),

  shuffleOptions: Joi.boolean()
    .messages({
      'boolean.base': 'Shuffle options must be a boolean',
    }),

  showResultsImmediately: Joi.boolean()
    .messages({
      'boolean.base': 'Show results immediately must be a boolean',
    }),

  isPublished: Joi.boolean()
    .messages({
      'boolean.base': 'Is published must be a boolean',
    }),

  availableFrom: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Available from must be a valid date',
      'date.format': 'Available from must be in ISO format',
    }),

  availableUntil: Joi.date()
    .iso()
    .allow(null)
    .when('availableFrom', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('availableFrom')),
      otherwise: Joi.date()
    })
    .messages({
      'date.base': 'Available until must be a valid date',
      'date.format': 'Available until must be in ISO format',
      'date.greater': 'Available until must be after available from date',
    }),
});

export const updateTestSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Test title must be at least 1 character long',
      'string.max': 'Test title must be at most 200 characters long',
    }),

  description: Joi.string()
    .allow('', null)
    .max(1000)
    .messages({
      'string.max': 'Test description must be at most 1000 characters long',
    }),

  courseId: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Course ID must be a number',
      'number.integer': 'Course ID must be an integer',
      'number.positive': 'Course ID must be positive',
    }),

  lessonId: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Lesson ID must be a number',
      'number.integer': 'Lesson ID must be an integer',
      'number.positive': 'Lesson ID must be positive',
    }),

  timeLimitMinutes: Joi.number()
    .integer()
    .min(1)
    .max(480)
    .allow(null)
    .messages({
      'number.base': 'Time limit must be a number',
      'number.integer': 'Time limit must be an integer',
      'number.min': 'Time limit must be at least 1 minute',
      'number.max': 'Time limit must be at most 480 minutes (8 hours)',
    }),

  maxAttempts: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .allow(null)
    .messages({
      'number.base': 'Max attempts must be a number',
      'number.integer': 'Max attempts must be an integer',
      'number.min': 'Max attempts must be at least 1',
      'number.max': 'Max attempts must be at most 10',
    }),

  passingScore: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Passing score must be a number',
      'number.min': 'Passing score must be at least 0',
      'number.max': 'Passing score must be at most 100',
    }),

  shuffleQuestions: Joi.boolean()
    .messages({
      'boolean.base': 'Shuffle questions must be a boolean',
    }),

  shuffleOptions: Joi.boolean()
    .messages({
      'boolean.base': 'Shuffle options must be a boolean',
    }),

  showResultsImmediately: Joi.boolean()
    .messages({
      'boolean.base': 'Show results immediately must be a boolean',
    }),

  isPublished: Joi.boolean()
    .messages({
      'boolean.base': 'Is published must be a boolean',
    }),

  availableFrom: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.base': 'Available from must be a valid date',
      'date.format': 'Available from must be in ISO format',
    }),

  availableUntil: Joi.date()
    .iso()
    .allow(null)
    .when('availableFrom', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('availableFrom')),
      otherwise: Joi.date()
    })
    .messages({
      'date.base': 'Available until must be a valid date',
      'date.format': 'Available until must be in ISO format',
      'date.greater': 'Available until must be after available from date',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const addQuestionToTestSchema = Joi.object({
  questionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.positive': 'Question ID must be positive',
      'any.required': 'Question ID is required',
    }),

  sortOrder: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Sort order must be a number',
      'number.integer': 'Sort order must be an integer',
      'number.min': 'Sort order must be at least 1',
    }),
});

export const submitTestSchema = Joi.object({
  testResultId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Test result ID must be a number',
      'number.integer': 'Test result ID must be an integer',
      'number.positive': 'Test result ID must be positive',
      'any.required': 'Test result ID is required',
    }),

  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.base': 'Question ID must be a number',
            'number.integer': 'Question ID must be an integer',
            'number.positive': 'Question ID must be positive',
            'any.required': 'Question ID is required',
          }),

        selectedOptionId: Joi.number()
          .integer()
          .positive()
          .when('answerText', {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required()
          })
          .messages({
            'number.base': 'Selected option ID must be a number',
            'number.integer': 'Selected option ID must be an integer',
            'number.positive': 'Selected option ID must be positive',
            'any.required': 'Selected option ID is required for choice questions',
          }),

        answerText: Joi.string()
          .max(5000)
          .when('selectedOptionId', {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required()
          })
          .messages({
            'string.base': 'Answer text must be a string',
            'string.max': 'Answer text must be at most 5000 characters long',
            'any.required': 'Answer text is required for essay/programming questions',
          }),
      }).or('selectedOptionId', 'answerText')
    )
    .required()
    .messages({
      'array.base': 'Answers must be an array',
      'any.required': 'Answers are required',
    }),
});