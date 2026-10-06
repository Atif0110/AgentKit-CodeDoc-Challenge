# AgentKit — CodeDoc Generator Contribution

This repository contains my submission for the **Lamatic.ai AgentKit Challenge**.

## What I Built

**CodeDoc Generator** — A Lamatic.ai AgentKit kit that turns any public GitHub repository into structured documentation. Given a repository URL, the kit clones the code, runs static analysis to detect the tech stack, entry points, and dependency graph, and generates:

- A README with setup and usage instructions
- API reference documentation (from route and function signatures)
- Architecture overview and data flow diagrams
- Deployment and contributing guidelines

A Next.js web app provides an interactive front-end where users paste a GitHub URL and get back a downloadable Markdown bundle.

## Kit Directory

```
kits/codedoc/
├── lamatic.config.ts          # Kit metadata (type, steps, links)
├── agent.md                   # Agent identity and capability doc
├── README.md                  # Kit-level setup guide
├── constitutions/default.md   # Guardrails and tone rules
├── flows/
│   └── codedoc-generate-docs.ts   # Two-flow pipeline (analyze → generate)
├── prompts/                   # Externalized LLM prompts
├── model-configs/             # LLM / model settings
├── scripts/                   # Code-node logic
└── apps/                      # Next.js web application
```

## Flows

| Flow | Purpose |
|------|---------|
| `codedoc-clone-analyze` | Clones the repo, runs static analysis, extracts structure |
| `codedoc-generate-docs` | Generates documentation sections from the analysis |

## Quick Start

```bash
cd kits/codedoc/apps
cp .env.example .env.local
npm install
npm run dev
```

## License

MIT
