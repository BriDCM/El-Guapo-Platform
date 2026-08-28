# El Guapo Agent Connection

El Guapo exposes a local MCP server through a personal Codex plugin. This is the supported cross-project integration; mentioning “El Guapo” in a prompt is not sufficient by itself.

## Tools

- `list_projects` — discover registered project IDs.
- `get_project_context` — load project facts, standards and tasks.
- `list_standards` — read global standards.
- `create_task` — create a task with outcome and acceptance criteria.
- `update_task_status` — follow the required task lifecycle.
- `record_verification` — attach test or manual evidence.
- `list_audit_events` — inspect Agent write history.

## New game project workflow

1. Register the game in El Guapo's browser UI and note its `GAME-...` ID.
2. Install or enable the personal `el-guapo` plugin in Codex.
3. Start a new Codex task in the game repository so the new MCP tools are loaded.
4. Ask Codex to call `list_projects`, then `get_project_context` with the registered ID.
5. Keep the game project's own `AGENTS.md` focused on its engine and repository rules; refer to the El Guapo project ID there.

The plugin is installed from the personal marketplace at `~/.agents/plugins/marketplace.json`. Plugin capabilities are loaded when a Codex task starts, so an already-open task must be replaced with a new task after installation or an update.

Suggested game-project guidance:

```md
## El Guapo

- Project ID: GAME-03
- At the start of planning or implementation, load this project's context and standards from El Guapo.
- Create or update the linked El Guapo task and record verification evidence before declaring work complete.
```

## Local trust boundary

The first version assumes a single machine controlled by the project owner. MCP write tools cannot register/delete projects, edit standards, approve releases or bypass task-state transitions. Every write is recorded in the SQLite audit log. Remote authentication is intentionally deferred until remote deployment.

## Troubleshooting

- If Codex says no El Guapo connector exists, run `codex plugin list` and confirm `el-guapo@personal` is `installed, enabled`, then start a new Codex task.
- If `list_projects` does not show the game, register it once in the El Guapo web UI; the Agent intentionally cannot create or delete project registrations.
- If the MCP process cannot start, build El Guapo with `npm run build` from the workbench repository and retry in a new task.
- The web UI does not need to remain open for Agent access. The plugin starts the local MCP process and both use the same SQLite data store.
