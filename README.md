# El-Guapo-Platform — El Guapo

El Guapo is a reusable, local-first browser workbench for managing multiple game-development projects. It is not a game-client repository.

## Open the workbench locally

El Guapo uses a local browser interface plus a local API and SQLite database. GitHub stores the source code and project history; it does not run this local-first application directly.

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

- Browser entry: [`apps/workbench/src/main.tsx`](apps/workbench/src/main.tsx)
- Local API entry: [`services/api/src/server.ts`](services/api/src/server.ts)
- Before sharing code: `npm run check && npm run build && npm run test`

## Cloud workbench (recommended)

El Guapo can run without `localhost`: the browser UI is hosted on GitHub Pages, while the protected API and project metadata live in a Cloudflare Worker and D1 database. GitHub OAuth limits access to the configured owner account.

Cloud account setup is deliberately manual because it creates external resources and secrets. Follow [the cloud deployment guide](docs/CLOUD_DEPLOYMENT.md) once to configure Cloudflare, GitHub OAuth, and GitHub repository variables. After deployment, use the GitHub Pages URL as the permanent workbench entry.

The worker configuration and secret templates are in [`services/cloud-api/`](services/cloud-api/). Never commit a copied `wrangler.jsonc`, `.dev.vars`, OAuth secret, session signing secret, database export, or API token.

## Public demo

The public, read-only demonstration is deployed from `main` to GitHub Pages. It contains no real project data, credentials, source assets, task history, or Agent audit records. After GitHub Pages is enabled in repository settings, it is available at:

`https://bridcm.github.io/El-Guapo-Platform/`

When `EL_GUAPO_API_URL` is configured, the same GitHub Pages address becomes the authenticated cloud workbench. Without it, the deployment remains a public demonstration and exposes no project data.

## Start here

1. Read [WORKBENCH_BRIEF.md](docs/WORKBENCH_BRIEF.md) and fill the fields marked **Owner input required**.
2. Read [AGENTS.md](AGENTS.md) before asking Codex to make changes.
3. Create a scoped branch from `main` for each independently reviewable change.
4. Record durable decisions in `docs/adr/` and manage delivery status in the workbench.

## Repository map

- `apps/workbench/` — the browser-based project workbench.
- `services/api/` — workbench API and integrations.
- `services/mcp/` — Codex-facing MCP tools for cross-project Agent access.
- `packages/data-store/` — shared SQLite schema and audited domain operations.
- `packages/shared-schema/` — shared identifiers, contracts, and validation schemas.
- `packages/unity-adapter/` — reusable Unity export/import contract and future editor integration.
- `docs/` — product, architecture, decisions, and delivery rules.
- `infra/` — deployment, database, CI, and observability configuration.
- `assets-manifest/` — example metadata format; production manifests belong to each managed game project.

## Current status

The foundation targets local deployment and Unity-project management. The first implementation will use a project registry: every game has its own Git repository and is registered in the workbench through identifiers, paths, and integration settings.

## Agent access

Install the El Guapo personal Codex plugin to make its MCP tools available from other game repositories. See [Agent connection guide](docs/AGENT_CONNECTION.md).
