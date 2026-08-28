---
name: el-guapo
description: Use the local El Guapo workbench to load registered game-project context and standards, create and advance development tasks, record verification evidence, and inspect Agent audit events. Use when the user asks to call, use, sync with, or update El Guapo from any Codex game project.
---

# El Guapo

El Guapo is the source of truth for cross-project standards, project metadata, task acceptance criteria, verification evidence, and Agent audit history.

## Start of work

1. Call `list_projects` to discover registered IDs unless the repository guidance supplies one.
2. Call `get_project_context` with the exact `GAME-...` ID before planning or implementation.
3. If the project is missing, tell the user to register it in the El Guapo browser UI. Do not create an unrelated local project or invent an ID.

## Task workflow

- Create a task with `create_task` before implementation when no linked task exists.
- The task must have one observable outcome and at least one testable acceptance criterion.
- Follow the lifecycle exactly: `draft → in_progress → ready_for_review → approved → done`.
- Use `record_verification` for build, automated test, or manual verification evidence.
- An Agent may move work to `ready_for_review`; owner approval is required before moving to `approved` unless the user explicitly delegates that approval in the current task.

## Safety boundaries

- Every project-scoped call must use the exact registered `projectId`.
- Never claim a write succeeded until the MCP tool returns the changed record.
- Do not use El Guapo tools to access source binaries, secrets, arbitrary local files, project deletion, standards editing, or release approval; these capabilities are intentionally not exposed.
- After a write, report the affected record ID and verification performed.
