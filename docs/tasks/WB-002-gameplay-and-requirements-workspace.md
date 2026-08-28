# WB-002: 玩法与需求工作区

- Owner: Project owner
- Linked branch: `main` (initial foundation delivery)
- Status: Ready for review

## Outcome

A registered project can store upstream gameplay facts and create Draft tasks with an observable outcome and acceptance criteria.

## Acceptance criteria

- [x] A project stores product positioning, world setting, core gameplay loop, and platform constraints.
- [x] A project owner can create a task with a title, outcome, and at least one acceptance criterion.
- [x] Tasks persist in the local data store and start in the required Draft state.
- [x] Changes are associated with the selected project and recorded through the audited data store.
- [x] The local UI explains that a project must be registered before using the workspace.

## Impact assessment

| Area | Impact |
| --- | --- |
| Interface | Adds a gameplay facts editor and task creation/list view to local El Guapo |
| Data | Adds `gameplay_facts` table and project-scoped API routes |
| Permissions | Owner writes only; Agent integration continues to follow project scope |
| Documentation | Adds this acceptance record |
| Build / release | GitHub Pages remains a read-only demonstration; no project data is published |

## Verification evidence

- Automated checks: `npm run check`, `npm run build`, and `npm run test` passed on 2026-08-28.
- Manual checks: Not yet performed in this delivery environment; verify by registering a project in the local UI, saving the four gameplay fields, and creating a task.
