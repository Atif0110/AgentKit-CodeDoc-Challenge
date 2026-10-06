export default {
  name: "CodeDoc Generator",
  description: "A kit that analyzes any public GitHub repository and generates structured documentation — README, API reference, architecture overview, and deployment guides — rendered through a Next.js web app.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Atif",
    email: "data.atif001@gmail.com",
    github: "https://github.com/Atif0110"
  },
  tags: ["documentation", "developer-tools", "code-analysis", "github", "agentic"],
  steps: [
    {
      id: "codedoc-clone-analyze",
      type: "mandatory" as const,
      envKey: "CODEDOC_CLONE_ANALYZE"
    },
    {
      id: "codedoc-generate-docs",
      type: "mandatory" as const,
      envKey: "CODEDOC_GENERATE_DOCS",
      prerequisiteSteps: ["codedoc-clone-analyze"]
    }
  ],
  links: {
    github: "https://github.com/Atif0110/AgentKit-CodeDoc-Challenge/tree/main/kits/codedoc",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Atif0110/AgentKit-CodeDoc-Challenge&root-directory=kits%2Fcodedoc%2Fapps&env=CODEDOC_GENERATE_DOCS,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20IDs%20and%20credentials"
  }
};
