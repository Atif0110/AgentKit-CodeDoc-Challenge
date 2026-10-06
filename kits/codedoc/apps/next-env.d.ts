/// <reference types="next" />

declare namespace NodeJS {
  interface ProcessEnv {
    LAMATIC_API_URL: string
    LAMATIC_PROJECT_ID: string
    LAMATIC_API_KEY: string
    CODEDOC_CLONE_ANALYZE: string
    CODEDOC_GENERATE_DOCS: string
    OPENAI_API_KEY: string
    ANTHROPIC_API_KEY: string
    GITHUB_TOKEN?: string
  }
}
