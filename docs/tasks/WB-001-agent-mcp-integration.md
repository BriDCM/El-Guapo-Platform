# WB-001: Agent MCP Integration

- Owner: Project owner
- Linked branch: `feat/WB-001-agent-mcp-integration`
- Status: Ready for review

## Outcome

Codex tasks opened from other game repositories can discover and call El Guapo through an installed personal plugin without reading the El Guapo repository directly.

## Acceptance criteria

- [x] A valid Codex plugin exposes an El Guapo MCP server.
- [x] Agents can list projects, read project context and list standards.
- [x] Agents can create tasks, follow allowed task transitions and record verification evidence.
- [x] Every MCP write records an actor, project, action, affected record and timestamp.
- [x] Unknown projects and invalid task transitions return actionable errors.
- [x] Type checks, builds, unit tests and an MCP protocol smoke test pass.
- [x] Installation and new-project usage are documented.

## Impact assessment

| Area | Impact |
| --- | --- |
| Interface | No browser UI change required for this item |
| Data | Adds tasks, verifications and audit log tables |
| Permissions | Local Agent tools exclude project deletion, standards editing and release approval |
| Documentation | README, ADR-0004 and Agent connection guide |
| Build / release | Adds MCP and data-store workspaces plus a personal plugin package |

## Verification evidence

- Automated checks: `npm run check`, `npm run build`, and `npm run test` passed on 2026-08-28. MCP includes an in-memory protocol test and a spawned stdio boundary test; data-store includes lifecycle, rejection and audit tests.
- Manual checks: Plugin and skill validators passed; `codex plugin list` reports `el-guapo@personal` version `0.1.0` as `installed, enabled`.
- Known limitations: Local owner trust model; remote authentication remains out of scope
