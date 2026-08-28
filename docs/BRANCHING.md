# Branch and Worktree Policy

## Branches

`main` is the stable integration branch. Create one short-lived branch per independently reviewable work item:

- `feat/<requirement-id>-<short-name>`
- `fix/<requirement-id>-<short-name>`
- `docs/<requirement-id>-<short-name>`
- `chore/<requirement-id>-<short-name>`

Examples: `feat/WB-012-asset-library`, `fix/GAME-034-dash-cancel`.

Never develop directly on `main`. Merge only after the Definition of Done is met. Tag tested releases from `main`, for example `v0.1.0-alpha.1`.

## Parallel work

Use one Git worktree per active branch. Bind each Codex task to exactly one worktree and state its branch in the opening message. Do not change branches inside another task's worktree.

## Commit messages

Use `<type>(<scope>): <imperative summary>` and include the requirement ID in the body when one exists.

Example: `feat(workbench): add asset approval states`.
