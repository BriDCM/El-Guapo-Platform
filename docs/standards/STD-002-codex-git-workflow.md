# STD-002: Codex and Git Workflow

- Status: Active
- Scope: Global default for all managed projects
- Owner: Project owner
- Version: 1.0
- Review: Quarterly or after the first release

## Rule

One Codex implementation task works in one Git worktree and one short-lived branch. `main` remains stable and is never used for direct feature development. Each branch delivers one independently reviewable outcome linked to a requirement ID.

## Verification

Before merge, meet `docs/DEFINITION_OF_DONE.md` and update the linked requirement with verification results.
