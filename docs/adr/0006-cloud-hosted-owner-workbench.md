# ADR-0006: Cloud-hosted Owner Workbench

- Status: Accepted
- Date: 2026-08-30

## Decision

El Guapo's owner-facing workbench will no longer require a long-running local server. The static browser application is delivered through GitHub Pages; a Cloudflare Worker provides the protected API and Cloudflare D1 holds project metadata and audit records.

GitHub OAuth authenticates the configured owner login. The Worker issues a short-lived signed browser session only after validating that login. The browser keeps this session only in `sessionStorage`; it is not committed, stored in the project database, or included in the Pages build.

## Consequences

- GitHub Pages remains public as a static host, but project data is requested only from the protected Worker after login.
- D1 contains metadata only: projects, requirements, tasks, asset references, content design packs, and audit events. Unity source assets remain in their game repositories and Git LFS.
- Cloudflare resource IDs and GitHub OAuth/session secrets are external configuration. They must be created by the owner and stored as Worker secrets or GitHub Actions secrets, never in the repository.
- The existing Fastify + SQLite service remains the local/offline development adapter. No automatic migration of its local SQLite data occurs; importing existing local records is a separately approved data migration.
