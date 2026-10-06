export default {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.5,
  maxTokens: 16384,
  topP: 0.95,
  frequencyPenalty: 0,
  presencePenalty: 0,
  timeout: 120,
  retryAttempts: 3,
  credentials: {
    apiKeyRef: "ANTHROPIC_API_KEY"
  }
};
