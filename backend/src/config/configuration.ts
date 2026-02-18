export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/simple-chat',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: process.env.LLM_URL_KEY || 'https://openrouter.ai/api/v1',
  },
  uploads: {
    ttlHours: parseInt(process.env.UPLOAD_TTL_HOURS || '24', 10),
  },
});
