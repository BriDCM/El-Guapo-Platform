# ADR-0005: Public Demo, Private Project Data

- Status: Accepted
- Date: 2026-08-28

## Decision

Deploy a read-only El Guapo presentation and demo workspace to GitHub Pages. Keep real project records, task history, assets, audit events, Agent credentials, and source repositories outside the public static site.

## Access model

- Unauthenticated visitors: public product information and synthetic demonstration content only.
- Authenticated project members: project-scoped data after a future protected backend and login system are configured.
- Agents: project-scoped API access with auditable writes only.

## Consequences

GitHub Pages is the public entry point, not the data backend. Publishing this repository must never expose `.env` files, SQLite databases, Git LFS source assets, local paths, access tokens, or production project metadata.
