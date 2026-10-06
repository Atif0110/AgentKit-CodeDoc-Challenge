# CodeDoc Generator

## Overview

This project solves the problem of onboarding new developers, maintaining documentation, and keeping READMEs up-to-date across repositories. It implements a **two-flow** AgentKit pipeline: one flow clones and analyzes a public GitHub repository, and a second flow generates structured documentation (README, API reference, architecture overview, deployment guide) and bundles it into a downloadable Markdown file. The primary invoker is a Next.js web UI where users paste a GitHub URL and receive documentation in seconds.

It depends on Lamatic's hosted runtime and credentials, the Lamatic GitHub integration for cloning, and an LLM provider (OpenAI / Anthropic) for analysis and generation.

---

## Purpose

The goal of this agent system is to reduce the time and effort required to produce accurate, up-to-date documentation for any GitHub repository. After it runs, the caller has a complete Markdown documentation bundle that covers project overview, setup, API surface, architecture, and deployment — without needing to manually read the code or write docs from scratch.

Operationally, the system splits work into two stages so each flow stays focused: analysis (understand the codebase) and generation (write the docs). This separation keeps each flow simpler to review, test, and iterate on independently.

---

## Flows

### `codedoc-clone-analyze`

- **Flow ID / Env key mapping:** `codedoc-clone-analyze` (configured via `CODEDOC_CLONE_ANALYZE`)

#### Trigger
- **Invocation type:** API request via a GraphQL trigger node (`graphqlNode`) exposed by the AgentKit runtime.
- **Expected input shape:**
  - `repositoryUrl` (string, required) — the public GitHub repository URL.
  - `branch` (string, optional) — branch to analyze; defaults to the repo's default branch.
  - `includePrivate` (boolean, optional) — whether to include private file contents; default false.

#### What it does
1. **`API Request` (`graphqlNode`)**
   - Receives the API payload containing `repositoryUrl`, `branch`, and `includePrivate`.
   - The trigger is configured for realtime response.

2. **`GitHub Clone & List` (`gitHubNode`)**
   - Clones the repository at `{{triggerNode_1.output.repositoryUrl}}` into a temporary working directory.
   - Lists all files (excluding `.git/`, `node_modules/`, build artifacts) and returns a structured file tree.
   - Output: `{{gitHubNode_42.output.fileTree}}` and `{{gitHubNode_42.output.languageBreakdown}}`.

3. **`Analyze Code Structure` (`codeAnalysisNode`)**
   - Performs static analysis on the cloned files.
   - Detects: programming languages, package managers, frameworks, build tools, entry-point files, and configuration files.
   - Output: `{{codeAnalysisNode_2.output.analysis}}` and `{{codeAnalysisNode_2.output.languageBreakdown}}`.

4. **`LLM Analysis` (`LLMNode`)**
   - Runs a system prompt from `@prompts/codedoc-clone-analyze_analysis_system.md` and a user prompt from `@prompts/codedoc-clone-analyze_analysis_user.md`.
   - Model config: `@model-configs/codedoc-clone-analyze_analysis.ts`.
   - Uses variables: `fileTree`, `analysis`, `languageBreakdown`.
   - Produces a JSON-formatted analysis summary at `{{LLMNode_3.output.generatedResponse}}`.

5. **`Parse & Structure` (`codeNode`)**
   - Executes `@scripts/codedoc-clone-analyze_parse-analysis.ts` to parse the LLM JSON output and merge it with the file-tree data.
   - Uses Lamatic template variables to access prior node outputs.
   - Output: `{{codeNode_4.output.analysis}}`, `{{codeNode_4.output.fileCount}}`, `{{codeNode_4.output.languageBreakdown}}`.

6. **`Condition: Check Analysis` (`conditionNode`)**
   - Verifies the parse succeeded (`{{codeNode_4.output.success}}` equals `true`).
   - On success, routes to the API response. On failure, routes to an error response.

7. **`API Response` (`graphqlResponseNode`)**
   - Maps `analysis`, `fileCount`, and `languageBreakdown` into the response.
   - Response mode: realtime.

#### Outputs
| Field | Type | Description |
|---|---|---|
| `analysis` | `object` | Structured analysis: tech stack, entry points, dependencies, file inventory, API routes, etc. |
| `fileCount` | `number` | Total number of files detected. |
| `languageBreakdown` | `object` | Languages detected with byte counts. |

#### External Services
- **Lamatic GitHub integration** — clones the repo and lists files — requires GitHub credentials configured in the Lamatic environment.
- **LLM provider** (OpenAI via `@model-configs/codedoc-clone-analyze_analysis.ts`) — generates the structured analysis JSON from the file tree.

#### Environment Variables
- `LAMATIC_API_URL` — base URL for Lamatic API access.
- `LAMATIC_PROJECT_ID` — project scoping for API invocation.
- `LAMATIC_API_KEY` — authentication for Lamatic API calls.
- `CODEDOC_CLONE_ANALYZE` — deployed flow ID, used by the Next.js app.
- `GITHUB_TOKEN` — (optional) personal access token for higher API rate limits.
- `OPENAI_API_KEY` — API key for the LLM model used in analysis.

#### Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Clone fails | Repo is private or URL is invalid | Verify the URL and that the repo is public, or configure GitHub credentials. |
| File tree is empty | Repo has no source files | Check that the repo contains source files in a supported language. |
| LLM analysis fails | Model credentials not configured | Verify `@model-configs/codedoc-clone-analyze_analysis.ts` has valid provider credentials. |
| JSON parse error | LLM returned malformed JSON | Check prompt for JSON mode enforcement or add retry logic. |

---

### `codedoc-generate-docs`

- **Flow ID / Env key mapping:** `codedoc-generate-docs` (configured via `CODEDOC_GENERATE_DOCS`)
- **Prerequisite:** Output from `codedoc-clone-analyze` must be passed as the `analysis` input.

#### Trigger
- **Invocation type:** API request via a GraphQL trigger node (`graphqlNode`).
- **Expected input shape:**
  - `analysis` (object, required) — the structured analysis from the first flow.
  - `repositoryUrl` (string, required) — original GitHub URL for reference links.
  - `sections` (array of strings, optional) — specific sections to generate; defaults to all four.

#### What it does
1. **`API Request` (`graphqlNode`)** — receives the analysis JSON and repository URL.
2. **`Generate README` (`LLMNode`)** — generates README from `@prompts/codedoc-generate-docs_readme_*`. Model: `@model-configs/codedoc-generate-docs_readme.ts`.
3. **`Generate API Reference` (`LLMNode`)** — generates API reference from `@prompts/codedoc-generate-docs_api_*`. Model: `@model-configs/codedoc-generate-docs_api.ts`.
4. **`Generate Architecture` (`LLMNode`)** — generates architecture overview from `@prompts/codedoc-generate-docs_architecture_*`. Uses same model as README.
5. **`Generate Deployment Guide` (`LLMNode`)** — generates deployment guide from `@prompts/codedoc-generate-docs_deployment_*`. Uses same model as README.
6. **`Combine Sections` (`dataTransformNode`)** — merges all generated sections into a structured object.
7. **`Bundle Markdown` (`codeNode`)** — runs `@scripts/codedoc-generate-docs_bundle.ts` to assemble the final Markdown with table of contents and cross-links.
8. **`API Response` (`graphqlResponseNode`)** — maps `documentation`, `sections`, and `bundleSize`.

#### Outputs
| Field | Type | Description |
|---|---|---|
| `documentation` | `string` | Complete Markdown documentation bundle. |
| `sections` | `object` | Individual documentation sections keyed by name. |
| `bundleSize` | `number` | Character count of the documentation. |

#### External Services
- **LLM provider** (OpenAI via `@model-configs/codedoc-generate-docs_readme.ts`) — README, architecture, and deployment sections.
- **LLM provider** (Anthropic via `@model-configs/codedoc-generate-docs_api.ts`) — API reference section.
- **Lamatic runtime** — executes the flow via API trigger.

#### Environment Variables
- `CODEDOC_GENERATE_DOCS` — deployed flow ID, used by the Next.js app.
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic API credentials.
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — LLM provider keys.

#### Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Sections are empty | Analysis input missing or malformed | Run codedoc-clone-analyze first and pass valid output. |
| LLM generation fails | Model credentials not configured | Verify model configs have valid provider credentials. |
| Bundle is too large | Repository too complex | Add max token limits in the code node or split into multiple bundles. |

---

## Integration Reference

### Next.js App

The `apps/` directory contains a Next.js web application that:

1. Lets users paste a GitHub repository URL.
2. Calls the `codedoc-clone-analyze` flow to get the analysis.
3. Feeds the analysis into the `codedoc-generate-docs` flow.
4. Displays the generated documentation and offers a download button.

### Key Files

| File | Purpose |
|---|---|
| `apps/actions/orchestrate.ts` | Server action that calls both flows in sequence via the Lamatic SDK. |
| `apps/lib/lamatic-client.ts` | Lamatic SDK client setup with env validation. |
| `apps/lib/config.ts` | Imports `lamatic.config.ts` to read flow step definitions. |
| `apps/app/page.tsx` | Main UI with repo URL input form and documentation display. |

### Environment Setup

Required env vars for the Next.js app:

```bash
CODEDOC_CLONE_ANALYZE="<flow-id-for-clone-analyze>"
CODEDOC_GENERATE_DOCS="<flow-id-for-generate-docs>"
LAMATIC_API_URL="<lamatic-api-url>"
LAMATIC_PROJECT_ID="<lamatic-project-id>"
LAMATIC_API_KEY="<lamatic-api-key>"
```

### Quickstart

1. Sign up at [lamatic.ai](https://lamatic.ai) and create a project.
2. Import both flows from `kits/codedoc/flows/` into Lamatic Studio.
3. Configure your LLM provider (OpenAI) and GitHub integration.
4. Deploy both flows and copy the Flow IDs.
5. Create `.env.local` in `kits/codedoc/apps/` with the credentials above.
6. Run the app: `npm install && npm run dev`.
7. Open `http://localhost:3000` and enter a GitHub URL.

---

## Operational Limits

- Maximum repository size: 500 MB (clone timeout).
- Maximum files analyzed: 5,000.
- Generated documentation size: up to ~64K tokens (4 flows × 16K max tokens).
- Only public GitHub repositories are supported (private requires GitHub token with repo access).
- The flow does not execute any code from repositories — static analysis only.
