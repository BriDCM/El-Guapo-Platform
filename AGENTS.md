# Codex Project Guidance

## Mission

Build and maintain a reusable game-development workbench without losing traceability between requirements, game rules, assets, code, tests, builds, and releases across multiple game projects.

## Before changing files

1. Read `README.md`, relevant files under `docs/`, and any nested `AGENTS.md`.
2. Inspect the current Git status; preserve unrelated user changes.
3. State the intended scope, acceptance criteria, and affected directories.
4. Ask the owner before choosing a game engine, cloud provider, authentication provider, paid service, or irreversible data migration.

## Scope rules

- One branch and one Codex task should produce one independently reviewable outcome.
- Do not mix refactors, unrelated formatting changes, or dependency upgrades into a feature task.
- The workbench owns cross-project planning, approvals, asset metadata, and release status. Each managed game has its own Git repository, which owns its source code and configuration history.
- Record architecture decisions in `docs/adr/`; do not leave durable decisions only in chat.
- For the initial small Unity projects, use Git LFS for large source assets. The workbench stores only metadata, manifests, previews, and the LFS/Git reference; it never duplicates source binaries.

## Definition of done

Follow `docs/DEFINITION_OF_DONE.md`. At minimum, implementation must include relevant tests or a documented reason they cannot yet exist, documentation updates, and a verification report.

## Technology and directories

- Web UI: TypeScript, React, and Vite in `apps/workbench/`.
- Local API: TypeScript and Fastify in `services/api/`.
- Local persistence: SQLite; local database files are runtime data and are ignored by Git.
- Shared record contracts: `packages/shared-schema/`.
- Unity integration contract: `packages/unity-adapter/`.
- Use npm workspaces from the repository root. Do not add a new package manager.

## Common commands

- `npm install` — install declared workspace dependencies.
- `npm run dev` — start the local API and workbench.
- `npm run build` — build all workspaces.
- `npm run test` — run all available tests.
- `npm run check` — type-check all workspaces.

When introducing an application package, ensure it provides relevant `build`, `test`, and `check` commands. Until automated tests exist for a package, its `test` command must state that limitation explicitly rather than silently succeeding.

## Git rules

- Never commit directly to `main`.
- Use `feat/`, `fix/`, `docs/`, or `chore/` branch prefixes.
- Use conventional, scoped commit messages: `feat(workbench): add asset status filter`.
- Keep commits small and reversible.
- Before requesting a merge, run the documented checks and update the linked requirement or decision record.

## Dependencies

- Do not upgrade or replace dependencies outside the task scope.
- A new dependency needs a short justification in the change description and must be recorded in the lockfile.
- Do not add a dependency merely for a trivial utility that can be expressed clearly with the existing stack.

## Secrets and safety

- Never commit secrets, credentials, signing files, production exports, or generated engine caches.
- Commit `.env.example` only; keep real environment values in the approved secret store.
- Do not make paid-cloud, deployment, external-account, or destructive database changes without explicit owner confirmation.
