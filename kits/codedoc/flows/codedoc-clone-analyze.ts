/*
 * # 1. Clone & Analyze Repository
 * This flow accepts a GitHub repository URL, clones the repository, extracts file structure and metadata, and returns a structured analysis containing the tech stack, entry points, dependencies, and file layout. It is the first stage of the two-flow CodeDoc Generator pipeline.
 *
 * ## Purpose
 * This flow is responsible for the initial analysis stage of the CodeDoc Generator. It solves the problem of quickly understanding an unfamiliar codebase by programmatically inspecting its structure, dependencies, and configuration files. Given only a GitHub URL, the flow retrieves the repository contents and produces a machine-readable summary that the subsequent documentation-generation flow can consume.
 *
 * The outcome is a structured JSON object containing detected technologies, entry-point files, dependency lists, and a file inventory. That outcome matters because it allows the doc-generation flow to focus purely on writing prose rather than re-analyzing code, keeping each stage simple and composable.
 *
 * Within the broader CodeDoc system, this flow acts as the "understand" stage in an understand-then-write pipeline. It runs before the documentation-generation flow and feeds its output as input. The flow depends on Lamatic's GitHub integration for cloning and a code-analysis node for static inspection.
 *
 * ## When To Use
 * - Use when you need to analyze a public GitHub repository's structure programmatically.
 * - Use when you want to extract tech-stack, entry points, and dependencies without reading the full codebase.
 * - Use as the first stage of a documentation-generation pipeline that needs structured code analysis.
 * - Use when the caller has a valid `repositoryUrl` and the repo is publicly accessible.
 *
 * ## When Not To Use
 * - Do not use when the input is not a GitHub URL (e.g., local files, private repos without credentials).
 * - Do not use when the repository is very large (>500MB), as cloning may time out.
 * - Do not use when you only need a single-file analysis rather than a full repository scan.
 * - Do not use if GitHub integration credentials are not configured in the Lamatic environment.
 * - Do not use for repositories containing malicious code; this flow performs read-only static analysis and does not execute any code.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `repositoryUrl` | `string` | Yes | Public GitHub repository URL to analyze. |
 * | `branch` | `string` | No | Branch to analyze (defaults to default branch). |
 * | `includePrivate` | `boolean` | No | Whether to include private file contents (default: false). |
 *
 * The trigger is a GraphQL API request node. The flow reads `repositoryUrl` from `{{triggerNode_1.output.repositoryUrl}}`.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `analysis` | `object` | Structured analysis: tech stack, entry points, dependencies, file inventory. |
 * | `fileCount` | `number` | Total number of files detected. |
 * | `languageBreakdown` | `object` | Languages detected with line/byte counts. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is the first stage in the pipeline. It is invoked directly by an API request.
 *
 * ### Downstream Flows
 * Output feeds into `codedoc-generate-docs` which consumes the `analysis` object to produce documentation.
 *
 * ### External Services
 * - Lamatic GitHub integration — clones the repo and lists files — requires GitHub credentials configured in the Lamatic environment.
 * - Configured LLM provider via `LLMNode` — generates the structured analysis summary — requires credentials in `@model-configs/codedoc-clone-analyze_analysis.ts`.
 *
 * ### Environment Variables
 * - `LAMATIC_API_URL` — base URL for Lamatic API access.
 * - `LAMATIC_PROJECT_ID` — project scoping for API invocation.
 * - `LAMATIC_API_KEY` — authentication for Lamatic API calls.
 * - `CODEDOC_CLONE_ANALYZE` — deployed flow ID used by the Next.js app.
 * - `GITHUB_TOKEN` — (optional) personal access token for higher API rate limits when cloning private repos.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - This is the runtime entry point. It receives the incoming API payload containing `repositoryUrl`.
 *    - The trigger is configured for realtime response.
 *
 * 2. `GitHub Clone & List` (`gitHubNode`)
 *    - Clones the repository at the provided URL into a temporary working directory.
 *    - Lists all files (excluding `.git/`, `node_modules/`, build artifacts) and returns a structured file tree.
 *    - Output referenced as `{{gitHubNode_1.output.fileTree}}`.
 *
 * 3. `Analyze Code Structure` (`codeAnalysisNode`)
 *    - Performs static analysis on the cloned files.
 *    - Detects: programming languages, package managers, frameworks, build tools, entry-point files, and configuration files.
 *    - Output: `{{codeAnalysisNode_2.output.analysis}}`.
 *
 * 4. `LLM Analysis` (`LLMNode`)
 *    - Uses a system prompt from `@prompts/codedoc-clone-analyze_analysis_system.md` and user prompt from `@prompts/codedoc-clone-analyze_analysis_user.md`.
 *    - Model config: `@model-configs/codedoc-clone-analyze_analysis.ts`.
 *    - Produces `{{LLMNode_3.output.generatedResponse}}` — a JSON-formatted analysis summary.
 *
 * 5. `Parse & Structure` (`codeNode`)
 *    - Runs `@scripts/codedoc-clone-analyze_parse-analysis.ts` to parse the LLM output into the final structured object.
 *    - Uses Lamatic template variables: `{{LLMNode_3.output.generatedResponse}}`, `{{codeAnalysisNode_2.output.fileTree}}`.
 *
 * 6. `Condition: Check Analysis` (`conditionNode`)
 *    - Checks if analysis was successful.
 *    - If yes, routes to output. If no, routes to an error path that returns an error message.
 *
 * 7. `API Response` (`graphqlResponseNode`)
 *    - Maps `analysis`, `fileCount`, and `languageBreakdown` from `{{codeNode_4.output.*}}` into the response.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Clone fails | Repo is private or URL is invalid | Verify the URL and that the repo is public, or configure GitHub credentials. |
 * | Analysis returns empty | No recognizable files found | Check that the repo contains source files in a supported language. |
 * | LLM analysis fails | Model credentials not configured | Verify `@model-configs/codedoc-clone-analyze_analysis.ts` has valid provider credentials. |
 * | Response contains errors | File tree too large | Limit the repository size or specify a subdirectory to analyze. |
 *
 * ## Notes
 * - The flow does not execute any code from the repository — it performs static analysis only.
 * - File tree is filtered to exclude common non-source directories (.git, node_modules, .next, /dist, etc.).
 * - Analysis quality depends on the detected configuration files (package.json, pyproject.toml, Cargo.toml, etc.).
 * - The flow supports both monorepo and single-package repository layouts.
 */

// Flow: codedoc-clone-analyze

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "CodeDoc Clone & Analyze",
  description:
    "Accepts a GitHub repository URL, clones the repo, and performs static analysis to extract tech stack, entry points, dependencies, and file structure.",
  tags: ["clone", "analysis", "github", "code-analysis"],
  testInput: {
    repositoryUrl: "https://github.com/Lamatic/AgentKit",
    branch: "main"
  },
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/codedoc",
  documentationUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/codedoc/agent.md",
  deployUrl: "https://studio.lamatic.ai/flow/codedoc-clone-analyze",
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
      description: "Public GitHub repository URL to analyze."
    },
    {
      name: "branch",
      label: "Branch",
      type: "string",
      required: false,
      isPrivate: false,
      description: "Git branch to analyze (defaults to repo default)."
    },
    {
      name: "includePrivate",
      label: "Include Private Files",
      type: "boolean",
      required: false,
      isPrivate: false,
      description: "Whether to include private file contents in analysis."
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    codedoc_clone_analyze_analysis_system:
      "@prompts/codedoc-clone-analyze_analysis_system.md",
    codedoc_clone_analyze_analysis_user:
      "@prompts/codedoc-clone-analyze_analysis_user.md"
  },
  modelConfigs: {
    codedoc_clone_analyze_analysis:
      "@model-configs/codedoc-clone-analyze_analysis.ts"
  },
  scripts: {
    codedoc_clone_analyze_parse_analysis:
      "@scripts/codedoc-clone-analyze_parse-analysis.ts"
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
    id: "gitHubNode_42",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "gitHubNode",
      values: {
        nodeName: "GitHub Clone & List",
        repositoryUrl: "{{triggerNode_1.output.repositoryUrl}}",
        branch: "{{triggerNode_1.output.branch}}",
        includePrivate: "{{triggerNode_1.output.includePrivate}}",
        excludePatterns: [
          ".git/**",
          "node_modules/**",
          "dist/**",
          "build/**",
          "*.log",
          ".env*"
        ],
        maxFiles: 5000
      }
    }
  },
  {
    id: "codeAnalysisNode_2",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "codeAnalysisNode",
      values: {
        nodeName: "Analyze Code Structure",
        sourceData: "{{gitHubNode_42.output.fileTree}}",
        analysisType: "full",
        extractTechStack: true,
        extractEntryPoints: true,
        extractDependencies: true,
        detectFrameworks: true
      }
    }
  },
  {
    id: "LLMNode_3",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "LLM Analysis",
        tools: [],
        prompts: [
          {
            id: "sys-prompt-codedoc-1",
            role: "system",
            content: "@prompts/codedoc-clone-analyze_analysis_system.md"
          },
          {
            id: "usr-prompt-codedoc-1",
            role: "user",
            content: "@prompts/codedoc-clone-analyze_analysis_user.md"
          }
        ],
        memories: "@model-configs/codedoc-clone-analyze_analysis.ts",
        messages: "@model-configs/codedoc-clone-analyze_analysis.ts",
        generativeModelName: "@model-configs/codedoc-clone-analyze_analysis.ts",
        variables: {
          fileTree: "{{gitHubNode_42.output.fileTree}}",
          analysis: "{{codeAnalysisNode_2.output.analysis}}",
          languageBreakdown: "{{codeAnalysisNode_2.output.languageBreakdown}}"
        }
      }
    }
  },
  {
    id: "codeNode_4",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "codeNode",
      values: {
        nodeName: "Parse & Structure",
        language: "typescript",
        code: "@scripts/codedoc-clone-analyze_parse-analysis.ts"
      }
    }
  },
  {
    id: "conditionNode_5",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "conditionNode",
      values: {
        nodeName: "Condition: Check Analysis",
        conditions: [
          {
            condition: "{{codeNode_4.output.success}}",
            operator: "equals",
            value: true,
            next: "LLMNode_3"
          }
        ],
        default: "graphqlResponseNode_6"
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
          '{\n  "analysis": "{{codeNode_4.output.analysis}}",\n  "fileCount": "{{codeNode_4.output.fileCount}}",\n  "languageBreakdown": "{{codeNode_4.output.languageBreakdown}}"\n}'
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-gitHubNode_42",
    source: "triggerNode_1",
    target: "gitHubNode_42",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "gitHubNode_42-codeAnalysisNode_2",
    source: "gitHubNode_42",
    target: "codeAnalysisNode_2",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeAnalysisNode_2-LLMNode_3",
    source: "codeAnalysisNode_2",
    target: "LLMNode_3",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_3-codeNode_4",
    source: "LLMNode_3",
    target: "codeNode_4",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_4-conditionNode_5",
    source: "codeNode_4",
    target: "conditionNode_5",
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
