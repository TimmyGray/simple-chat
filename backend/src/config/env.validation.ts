import Joi from 'joi';

export const envValidationSchema = Joi.object({
  OPENROUTER_API_KEY: Joi.string().required().not('').messages({
    'any.required': 'OPENROUTER_API_KEY is required',
    'string.empty': 'OPENROUTER_API_KEY must not be empty',
  }),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .default('mongodb://localhost:27017/simple-chat'),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  LLM_URL_KEY: Joi.string().uri().optional(),
  CORS_ORIGIN: Joi.string().optional(),
  UPLOAD_TTL_HOURS: Joi.number().integer().min(1).default(24),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
}).unknown(true);
