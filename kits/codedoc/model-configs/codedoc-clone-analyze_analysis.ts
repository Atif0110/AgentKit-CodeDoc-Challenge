export default {
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.1,
  maxTokens: 16384,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,
  jsonMode: true,
  timeout: 120,
  retryAttempts: 3,
  credentials: {
    apiKeyRef: "OPENAI_API_KEY"
  }
};
