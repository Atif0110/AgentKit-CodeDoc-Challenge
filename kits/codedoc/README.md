# CodeDoc Generator

## About This Kit

CodeDoc Generator is a Lamatic.ai AgentKit kit that turns any public GitHub repository into structured, developer-friendly documentation. Given a repository URL, it clones the code, performs static analysis to detect the tech stack, entry points, and dependency graph, and then generates a complete documentation bundle including:

- **README** — project overview, setup, and usage instructions
- **API Reference** — auto-generated from route handlers and exported functions
- **Architecture Overview** — data flow, module layout, and key design decisions
- **Deployment Guide** — environment setup and deployment steps

A Next.js web app provides an interactive interface: paste a GitHub URL, get back a downloadable Markdown bundle.

This kit includes **2 flows** working together as a pipeline:

1. **`codedoc-clone-analyze`** — Clones the repository and extracts structural information
2. **`codedoc-generate-docs`** — Generates documentation sections from the analysis

## Flow Components

This workflow includes the following node types:
- `graphqlNode` — API request/response triggers
- `gitHubNode` — Repository cloning and file listing
- `codeAnalysisNode` — Static analysis (tech stack, entry points, dependencies)
- `LLMNode` — Documentation generation with externalized prompts
- `codeNode` — Post-processing and Markdown bundling
- `conditionNode` — Conditional routing based on analysis results
- `dataTransformNode` — Merging outputs from multiple steps

## Files Included

```
kits/codedoc/
├── lamatic.config.ts          # Kit metadata
├── agent.md                   # Agent identity and capabilities
├── README.md                  # This file
├── constitutions/default.md   # Guardrails and behavior rules
├── flows/
│   ├── codedoc-clone-analyze.ts   # Flow 1: repo analysis
│   └── codedoc-generate-docs.ts   # Flow 2: doc generation
├── prompts/                   # Externalized LLM prompts (6 files)
├── model-configs/             # Model configuration (2 files)
├── scripts/                   # Code node logic (2 files)
└── apps/                      # Next.js web application
    ├── package.json
    ├── .env.example
    ├── actions/orchestrate.ts
    ├── lib/lamatic-client.ts
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   └── globals.css
    └── components/
        ├── header.tsx
        └── ui/               # shadcn/ui components
```

## Required Credentials

| Key | Purpose | Where to Get It |
|-----|---------|-----------------|
| `LAMATIC_API_KEY` | Authentication for Lamatic AI APIs | [lamatic.ai → Settings → API Keys](https://lamatic.ai) |
| `LAMATIC_PROJECT_ID` | Project scoping | [lamatic.ai → Settings → Project](https://lamatic.ai) |
| `LAMATIC_API_URL` | API endpoint URL | [lamatic.ai → Settings → API Docs](https://lamatic.ai) |
| `CODEDOC_CLONE_ANALYZE` | Flow ID for analysis flow | Deployed flow in Lamatic Studio |
| `CODEDOC_GENERATE_DOCS` | Flow ID for doc generation | Deployed flow in Lamatic Studio |

## Setup & Installation

### 1. Build and Deploy Flows in Lamatic

1. Sign in or sign up at [lamatic.ai](https://lamatic.ai)
2. Create a new project (or use an existing one)
3. Import the two flows from `kits/codedoc/flows/`:
   - `codedoc-clone-analyze.ts`
   - `codedoc-generate-docs.ts`
4. Configure the required providers and integrations:
   - Connect your GitHub account for repo cloning
   - Configure your preferred LLM provider (OpenAI, Anthropic, etc.)
5. Deploy both flows and copy the Flow IDs

### 2. Wire Up the Next.js App

```bash
cd kits/codedoc/apps
cp .env.example .env.local
# Edit .env.local with your Lamatic credentials and flow IDs
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Deploy

```bash
# Deploy to Vercel with one click
npx vercel
```

## Usage

1. Open the app in your browser
2. Enter a public GitHub repository URL (e.g., `https://github.com/Lamatic/AgentKit`)
3. Click "Generate Documentation"
4. Wait for the analysis and generation to complete
5. Download the Markdown bundle or copy individual sections

## Tags

developer-tools, documentation, github, code-analysis

---

*Built for the Lamatic.ai AgentKit Challenge by Atif*
