# ADR-0006: GitHub-only Owner Workbench

- Status: Accepted
- Date: 2026-08-30

## Decision

El Guapo's owner-facing workbench will no longer require a long-running local server or a separate cloud provider. The static browser application is delivered through GitHub Pages; project metadata and audit records are stored in a dedicated private GitHub repository.

A repository-scoped fine-grained personal access token authorizes the browser to call GitHub's Contents API. The browser keeps this token only in `sessionStorage`; it is not committed, included in the Pages build, or written to the data repository.

## Consequences

- GitHub Pages remains public as a static host, but it cannot access project data until the owner supplies a repository-scoped token during that browser session.
- The private data repository contains metadata only: projects, requirements, tasks, asset references, content design packs, and audit events. Unity source assets remain in their game repositories and Git LFS.
- Each write uses GitHub's Contents API and creates a commit, providing a directly inspectable change history. Concurrent edits can cause a conflict; the owner refreshes and retries.
- The existing Fastify + SQLite service remains the local/offline development adapter. No automatic import of its local SQLite data occurs; importing existing local records is a separately approved data migration.
