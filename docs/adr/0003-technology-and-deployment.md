# ADR-0003: Local-first Workbench Deployment and Unity Support

- Status: Accepted
- Date: 2026-08-27

## Decision required

The first release must run locally and manage small Unity game projects. Cloud deployment is not needed for the MVP.

- The workbench must support local startup, local persistent storage, and a browser UI.
- The Unity adapter must use a project-scoped integration contract.
- A later cloud deployment must preserve the same data and API contracts.

## Implementation stack

- TypeScript + React + Vite for the browser UI.
- TypeScript + Fastify for the local API.
- SQLite for local persistence.
- A local HTTP API for scoped Agent access.

Use npm workspaces to keep the UI, API, and shared contracts in one reusable workbench repository.
