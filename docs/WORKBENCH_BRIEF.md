# Workbench Brief

This is the upstream source of truth for the reusable workbench. Individual game briefs belong in their own game repositories and are registered in the workbench.

## Owner input required

| Field | Current value |
| --- | --- |
| Workbench name | El Guapo (confirmed) |
| Supported game engine | Unity (confirmed) |
| Initial deployment | GitHub Pages + private GitHub data repository (confirmed 2026-08-30) |
| Managed game projects | Pending first project registration |
| Local user model | Project owner plus authorized Agents (confirmed) |
| Asset source-of-truth default | Git + Git LFS (confirmed) |
| First workbench milestone | Pending |

## Product boundaries

- The workbench is a browser application for planning, asset traceability, approval, tests, and releases across multiple games.
- Every Unity game remains in its own Git repository and connects through a project registration plus the Unity adapter contract.
- Local deployment remains available for offline development; the permanent owner-facing entry is GitHub Pages with a private GitHub data repository.
- The workbench includes a first-class **Standards & Practices** area for reusable cross-project rules and project-specific exceptions.
- Authorized Agents can use a project-scoped local integration interface; their actions must remain attributable and auditable.
