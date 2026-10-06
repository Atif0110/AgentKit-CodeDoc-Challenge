/*
 * # 2. Generate Documentation
 * This flow accepts a structured code analysis (output from the codedoc-clone-analyze flow), and generates comprehensive documentation sections including README, API reference, architecture overview, and deployment guide. It then bundles them into a downloadable Markdown file. It is the second and final stage of the two-flow CodeDoc Generator pipeline.
 *
 * ## Purpose
 * This flow is responsible for the documentation-generation stage of the CodeDoc Generator. It solves the problem of producing human-readable documentation from a structured codebase analysis. Given the analysis output from the first flow — which contains tech stack, entry points, dependencies, and file inventory — this flow orchestrates multiple LLM generation steps and a final bundling step to produce a complete documentation bundle.
 *
 * The outcome is a single Markdown document (or structured sections) ready for download or direct use. That outcome matters because it delivers the end product the broader system is designed to provide: documentation that captures the essential knowledge of a codebase in a consumable format.
 *
 * Within the broader CodeDoc system, this flow acts as the "write" stage in an understand-then-write pipeline. It consumes the analysis from `codedoc-clone-analyze` and produces the final documentation artifact. Any downstream consumer is typically the Next.js web app reading the API response.
 *
 * ## When To Use
 * - Use when you have a structured code analysis from the `codedoc-clone-analyze` flow.
 * - Use when you need a complete documentation bundle for a repository.
 * - Use when the caller wants downloadable Markdown documentation.
 * - Use when you want sections for README, API reference, architecture, and deployment guidance.
 *
 * ## When Not To Use
 * - Do not use when the analysis input is empty, malformed, or missing required fields.
 * - Do not use when you need real-time documentation updates for a live codebase (this flow is batch-oriented).
 * - Do not use when you need interactive documentation (this produces a static Markdown bundle).
 * - Do not use when the repository language is unsupported by the configured LLM provider.
 * - Do not use without first running the `codedoc-clone-analyze` flow to produce the analysis input.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `analysis` | `object` | Yes | Structured analysis from codedoc-clone-analyze flow. |
 * | `repositoryUrl` | `string` | Yes | Original GitHub URL (for reference links in docs). |
 * | `sections` | `string[]` | No | Specific sections to generate (default: all). |
 *
 * The trigger reads `analysis` and `repositoryUrl` from `{{triggerNode_1.output.analysis}}` and `{{triggerNode_1.output.repositoryUrl}}`.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `documentation` | `string` | Complete Markdown documentation bundle. |
 * | `sections` | `object` | Individual documentation sections keyed by name. |
 * | `bundleSize` | `number` | Character count of the documentation. |
 *
 * The response maps `documentation` from `{{codeNode_8.output.documentation}}` and `sections` from `{{dataTransformNode_7.output.sections}}`.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This flow requires the output of `codedoc-clone-analyze`. The `analysis` object should be passed as input.
 *
 * ### Downstream Flows
 * This is the final stage. Output is returned directly to the API caller (typically the Next.js app).
 *
 * ### External Services
 * - Lamatic runtime — hosts and executes the flow via API trigger nodes.
 * - LLM provider for README generation — `@model-configs/codedoc-generate-docs_readme.ts`.
 * - LLM provider for API reference — `@model-configs/codedoc-generate-docs_api.ts`.
 * - LLM provider for architecture — uses the same model config as README.
 *
 * ### Environment Variables
 * - `CODEDOC_GENERATE_DOCS` — deployed flow ID used by the Next.js app.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic API credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - Runtime entry point. Receives the analysis JSON and repository URL.
 *    - Configurable for realtime response.
 *
 * 2. `Generate README` (`LLMNode`)
 *    - Generates the README section using system and user prompts from `@prompts/codedoc-generate-docs_readme_system.md` and `@prompts/codedoc-generate-docs_readme_user.md`.
 *    - Model: `@model-configs/codedoc-generate-docs_readme.ts`.
 *    - Uses `{{triggerNode_1.output.analysis}}` as variable input.
 *    - Output: `{{LLMNode_10.output.generatedResponse}}`.
 *
 * 3. `Generate API Reference` (`LLMNode`)
 *    - Generates API reference from detected route handlers and exported functions.
 *    - Prompts from `@prompts/codedoc-generate-docs_api_system.md` and `@prompts/codedoc-generate-docs_api_user.md`.
 *    - Model: `@model-configs/codedoc-generate-docs_api.ts`.
 *    - Uses `{{triggerNode_1.output.analysis}}` and `{{LLMNode_10.output.generatedResponse}}` as input.
 *    - Output: `{{LLMNode_11.output.generatedResponse}}`.
 *
 * 4. `Generate Architecture` (`LLMNode`)
 *    - Generates architecture overview and data flow description.
 *    - Uses `@prompts/codedoc-generate-docs_architecture_system.md` and `@prompts/codedoc-generate-docs_architecture_user.md`.
 *    - Model: `@model-configs/codedoc-generate-docs_readme.ts` (same as README).
 *    - Output: `{{LLMNode_12.output.generatedResponse}}`.
 *
 * 5. `Generate Deployment Guide` (`LLMNode`)
 *    - Generates deployment and setup instructions.
 *    - Uses `@prompts/codedoc-generate-docs_deployment_system.md` and `@prompts/codedoc-generate-docs_deployment_user.md`.
 *    - Model: `@model-configs/codedoc-generate-docs_readme.ts`.
 *    - Output: `{{LLMNode_13.output.generatedResponse}}`.
 *
 * 6. `Combine Sections` (`dataTransformNode`)
 *    - Merges all generated sections into a structured object.
 *    - Variable mappings from `{{LLMNode_10.output.*}}`, `{{LLMNode_11.output.*}}`, etc.
 *    - Output: `{{dataTransformNode_7.output.sections}}`.
 *
 * 7. `Bundle Markdown` (`codeNode`)
 *    - Runs `@scripts/codedoc-generate-docs_bundle.ts` to assemble final Markdown.
 *    - Output: `{{codeNode_8.output.documentation}}` and `{{codeNode_8.output.bundleSize}}`.
 *
 * 8. `API Response` (`graphqlResponseNode`)
 *    - Maps `documentation`, `sections`, and `bundleSize` into the response.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Sections are empty | Analysis input missing or malformed | Run codedoc-clone-analyze first and pass valid output. |
 * | LLM generation fails | Model credentials not configured | Verify model configs have valid provider credentials. |
 * | Bundle is too large | Repository too complex | Add max token limits in the code node or split into multiple bundles. |
 * | Missing field in response | Output mapping incorrect | Check that dataTransformNode output keys match the response mapping. |
 *
 * ## Notes
 * - The flow generates sections in parallel where possible (README, API ref, architecture, deployment) to reduce latency.
 * - The bundling step adds a table of contents and cross-links between sections.
 * - All generated content respects the constitutions/default.md guardrails.
 * - The flow supports both monorepo and single-package layouts.
 */

// Flow: codedoc-generate-docs

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "CodeDoc Generate Documentation",
  description:
    "Generates README, API reference, architecture overview, and deployment guide from a structured code analysis, and bundles them into downloadable Markdown.",
  tags: ["documentation", "generation", "markdown", "readme"],
  testInput: {
    repositoryUrl: "https://github.com/Lamatic/AgentKit",
    analysis: {
      repositoryName: "AgentKit",
      language: "TypeScript",
      techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
      entryPoints: ["kits/*/apps/page.tsx"],
      dependencies: { next: "^15.0.0", react: "^19.0.0" },
      fileInventory: [{ path: "kits/article-summariser/README.md", type: "file" }]
    },
    sections: ["readme", "api", "architecture", "deployment"]
  },
  githubUrl:
    "https://github.com/Atif0110/AgentKit-CodeDoc-Challenge/tree/main/kits/codedoc",
  documentationUrl:
    "https://github.com/Atif0110/AgentKit-CodeDoc-Challenge/tree/main/kits/codedoc/agent.md",
  deployUrl: "https://studio.lamatic.ai/flow/codedoc-generate-docs",
  author: {
    name: "Atif",
    email: "data.atif001@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  graphqlNode: [
    {
      name: "repositoryUrl",
      label: "Repository URL",
      type: "string",
      required: true,
      isPrivate: false,
      description: "GitHub repository URL (for reference links in generated docs)."
    },
    {
      name: "analysis",
      label: "Code Analysis",
      type: "object",
      required: true,
      isPrivate: false,
      description: "Structured analysis output from codedoc-clone-analyze flow."
    },
    {
      name: "sections",
      label: "Sections to Generate",
      type: "array",
      required: false,
      isPrivate: false,
      description: "Specific sections to generate. Defaults to all four."
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    codedoc_generate_docs_readme_system:
      "@prompts/codedoc-generate-docs_readme_system.md",
    codedoc_generate_docs_readme_user:
      "@prompts/codedoc-generate-docs_readme_user.md",
    codedoc_generate_docs_api_system:
      "@prompts/codedoc-generate-docs_api_system.md",
    codedoc_generate_docs_api_user:
      "@prompts/codedoc-generate-docs_api_user.md",
    codedoc_generate_docs_architecture_system:
      "@prompts/codedoc-generate-docs_architecture_system.md",
    codedoc_generate_docs_architecture_user:
      "@prompts/codedoc-generate-docs_architecture_user.md",
    codedoc_generate_docs_deployment_system:
      "@prompts/codedoc-generate-docs_deployment_system.md",
    codedoc_generate_docs_deployment_user:
      "@prompts/codedoc-generate-docs_deployment_user.md"
  },
  modelConfigs: {
    codedoc_generate_docs_readme:
      "@model-configs/codedoc-generate-docs_readme.ts",
    codedoc_generate_docs_api:
      "@model-configs/codedoc-generate-docs_api.ts"
  },
  scripts: {
    codedoc_generate_docs_bundle:
      "@scripts/codedoc-generate-docs_bundle.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: ""
      }
    }
  },
  {
    id: "LLMNode_10",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Generate README",
        tools: [],
        prompts: [
          {
            id: "sys-prompt-codedoc-2",
            role: "system",
            content: "@prompts/codedoc-generate-docs_readme_system.md"
          },
          {
            id: "usr-prompt-codedoc-2",
            role: "user",
            content: "@prompts/codedoc-generate-docs_readme_user.md"
          }
        ],
        memories: "@model-configs/codedoc-generate-docs_readme.ts",
        messages: "@model-configs/codedoc-generate-docs_readme.ts",
        generativeModelName: "@model-configs/codedoc-generate-docs_readme.ts",
        variables: {
          analysis: "{{triggerNode_1.output.analysis}}",
          repositoryUrl: "{{triggerNode_1.output.repositoryUrl}}"
        }
      }
    }
  },
  {
    id: "LLMNode_11",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Generate API Reference",
        tools: [],
        prompts: [
          {
            id: "sys-prompt-codedoc-3",
            role: "system",
            content: "@prompts/codedoc-generate-docs_api_system.md"
          },
          {
            id: "usr-prompt-codedoc-3",
            role: "user",
            content: "@prompts/codedoc-generate-docs_api_user.md"
          }
        ],
        memories: "@model-configs/codedoc-generate-docs_api.ts",
        messages: "@model-configs/codedoc-generate-docs_api.ts",
        generativeModelName: "@model-configs/codedoc-generate-docs_api.ts",
        variables: {
          analysis: "{{triggerNode_1.output.analysis}}",
          repositoryUrl: "{{triggerNode_1.output.repositoryUrl}}"
        }
      }
    }
  },
  {
    id: "LLMNode_12",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Generate Architecture",
        tools: [],
        prompts: [
          {
            id: "sys-prompt-codedoc-4",
            role: "system",
            content: "@prompts/codedoc-generate-docs_architecture_system.md"
          },
          {
            id: "usr-prompt-codedoc-4",
            role: "user",
            content: "@prompts/codedoc-generate-docs_architecture_user.md"
          }
        ],
        memories: "@model-configs/codedoc-generate-docs_readme.ts",
        messages: "@model-configs/codedoc-generate-docs_readme.ts",
        generativeModelName: "@model-configs/codedoc-generate-docs_readme.ts",
        variables: {
          analysis: "{{triggerNode_1.output.analysis}}",
          repositoryUrl: "{{triggerNode_1.output.repositoryUrl}}"
        }
      }
    }
  },
  {
    id: "LLMNode_13",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Generate Deployment Guide",
        tools: [],
        prompts: [
          {
            id: "sys-prompt-codedoc-5",
            role: "system",
            content: "@prompts/codedoc-generate-docs_deployment_system.md"
          },
          {
            id: "usr-prompt-codedoc-5",
            role: "user",
            content: "@prompts/codedoc-generate-docs_deployment_user.md"
          }
        ],
        memories: "@model-configs/codedoc-generate-docs_readme.ts",
        messages: "@model-configs/codedoc-generate-docs_readme.ts",
        generativeModelName: "@model-configs/codedoc-generate-docs_readme.ts",
        variables: {
          analysis: "{{triggerNode_1.output.analysis}}",
          repositoryUrl: "{{triggerNode_1.output.repositoryUrl}}"
        }
      }
    }
  },
  {
    id: "dataTransformNode_7",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "dataTransformNode",
      values: {
        nodeName: "Combine Sections",
        transformations: [
          {
            outputKey: "readme",
            source: "{{LLMNode_10.output.generatedResponse}}"
          },
          {
            outputKey: "apiReference",
            source: "{{LLMNode_11.output.generatedResponse}}"
          },
          {
            outputKey: "architecture",
            source: "{{LLMNode_12.output.generatedResponse}}"
          },
          {
            outputKey: "deployment",
            source: "{{LLMNode_13.output.generatedResponse}}"
          }
        ]
      }
    }
  },
  {
    id: "codeNode_8",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "codeNode",
      values: {
        nodeName: "Bundle Markdown",
        language: "typescript",
        code: "@scripts/codedoc-generate-docs_bundle.ts"
      }
    }
  },
  {
    id: "graphqlResponseNode_6",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        responeType: "realtime",
        outputMapping:
          '{\n  "documentation": "{{codeNode_8.output.documentation}}",\n  "sections": "{{dataTransformNode_7.output.sections}}",\n  "bundleSize": "{{codeNode_8.output.bundleSize}}"\n}'
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_10",
    source: "triggerNode_1",
    target: "LLMNode_10",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "triggerNode_1-LLMNode_11",
    source: "triggerNode_1",
    target: "LLMNode_11",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "triggerNode_1-LLMNode_12",
    source: "triggerNode_1",
    target: "LLMNode_12",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "triggerNode_1-LLMNode_13",
    source: "triggerNode_1",
    target: "LLMNode_13",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_10-dataTransformNode_7",
    source: "LLMNode_10",
    target: "dataTransformNode_7",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_11-dataTransformNode_7",
    source: "LLMNode_11",
    target: "dataTransformNode_7",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_12-dataTransformNode_7",
    source: "LLMNode_12",
    target: "dataTransformNode_7",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_13-dataTransformNode_7",
    source: "LLMNode_13",
    target: "dataTransformNode_7",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "dataTransformNode_7-codeNode_8",
    source: "dataTransformNode_7",
    target: "codeNode_8",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "response-triggerNode_1-graphqlResponseNode_6",
    source: "triggerNode_1",
    target: "graphqlResponseNode_6",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
