export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-chat',
    poolSizeMin: parseInt(process.env.MONGO_POOL_SIZE_MIN || '2', 10),
    poolSizeMax: parseInt(process.env.MONGO_POOL_SIZE_MAX || '10', 10),
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: process.env.LLM_URL_KEY || 'https://openrouter.ai/api/v1',
  },
  uploads: {
    ttlHours: parseInt(process.env.UPLOAD_TTL_HOURS || '24', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationSeconds: parseInt(
      process.env.JWT_EXPIRATION_SECONDS || '900',
      10,
    ),
  },
});
