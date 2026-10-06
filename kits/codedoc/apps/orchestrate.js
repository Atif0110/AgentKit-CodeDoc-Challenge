const findStep = (steps, id) => steps.find((s) => s.id === id);

const lamaticConfig = {
  name: "CodeDoc Generator",
  description: "A kit that analyzes any public GitHub repository and generates structured documentation — README, API reference, architecture overview, and deployment guide.",
  version: "1.0.0",
  type: "kit",
  author: {
    name: "Atif",
    email: "data.atif001@gmail.com"
  },
  tags: ["documentation", "developer-tools", "github", "agentic"],
  steps: [
    {
      id: "codedoc-clone-analyze",
      type: "mandatory",
      envKey: "CODEDOC_CLONE_ANALYZE"
    },
    {
      id: "codedoc-generate-docs",
      type: "mandatory",
      envKey: "CODEDOC_GENERATE_DOCS",
      prerequisiteSteps: ["codedoc-clone-analyze"]
    }
  ],
  links: {
    github: "https://github.com/Atif0110/AgentKit-CodeDoc-Challenge/tree/main/kits/codedoc",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Atif0110/AgentKit-CodeDoc-Challenge&root-directory=kits%2Fcodedoc%2Fapps&env=CODEDOC_CLONE_ANALYZE,CODEDOC_GENERATE_DOCS,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20IDs%20and%20credentials"
  }
};

export const config = {
  type: "multi-flow",
  flows: {
    "codedoc-clone-analyze": {
      name: "Clone & Analyze Repository",
      type: "graphQL",
      workflowId: process.env.CODEDOC_CLONE_ANALYZE,
      description: "Clones a GitHub repo and extracts structured code analysis",
      expectedOutput: ["analysis", "fileCount", "languageBreakdown"],
      inputSchema: {
        repositoryUrl: "string",
        branch: "string",
        includePrivate: "boolean"
      },
      outputSchema: {
        analysis: "object",
        fileCount: "number",
        languageBreakdown: "object"
      },
      mode: "sync",
      polling: "false"
    },
    "codedoc-generate-docs": {
      name: "Generate Documentation",
      type: "graphQL",
      workflowId: process.env.CODEDOC_GENERATE_DOCS,
      description: "Generates README, API reference, architecture, and deployment docs from analysis",
      expectedOutput: ["documentation", "sections", "bundleSize"],
      inputSchema: {
        repositoryUrl: "string",
        analysis: "object",
        sections: "array"
      },
      outputSchema: {
        documentation: "string",
        sections: "object",
        bundleSize: "number"
      },
      mode: "sync",
      polling: "false"
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
};
