# Standards & Practices Center

The workbench has a first-class **Standards & Practices** area. It records reusable rules that apply across projects, so collaboration knowledge does not remain scattered in chats or individual repositories.

## Two scopes

| Scope | Purpose | Examples |
| --- | --- | --- |
| Global | Default standard for every managed project | Git flow, requirement IDs, Unity resource import policy, Definition of Done |
| Project | A project-specific addition or approved deviation | A mobile game's texture budget or a temporary branch policy exception |

## Required fields for every standard

- Stable ID, such as `STD-001`.
- Title, category, owner, and scope.
- Rule text and the reason it exists.
- Version, effective date, and review date.
- Linked templates, checklists, or automated checks.
- Status: draft, active, deprecated, or superseded.
- Known exceptions and their approval records.

## Initial categories

1. Project governance — IDs, milestones, Definition of Done, approvals.
2. Git and Codex workflow — branches, worktrees, review, commit format, `AGENTS.md`.
3. Unity engineering — Unity version, package policy, folder layout, configuration exports, build verification.
4. Asset production — Git LFS, naming, import settings, previews, license and approval status.
5. Quality and release — tests, performance budget, release gates, version tags, rollback.
6. Security and operations — secrets, backups, local deployment, access, audit trail.
7. Agent integration — agent roles, project scopes, write audit, and approval boundaries.

## Relationship to implementation

The Standards & Practices view is not just a document library. A task, asset, build, or release can declare which standards apply. A failed check should link back to the relevant standard; a deviation must create an approved exception rather than silently bypassing the rule.
