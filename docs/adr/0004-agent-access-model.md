# ADR-0004: Local Agent Access Model

- Status: Accepted
- Date: 2026-08-27

## Context

El Guapo is locally deployed and must be usable by a project owner as well as authorized development Agents.

## Decision

Agents connect through an installed local Codex plugin and its stdio MCP server rather than unrestricted file-system access or an owner-equivalent account. Every Agent operation records the project, acting identity, requested operation, changed records, and timestamp.

## Initial roles

| Role | Typical permissions |
| --- | --- |
| Owner | Register projects; manage standards; approve exceptions, releases, and Agent permissions |
| Agent — reader | Read project requirements, standards, approved asset metadata, and assigned task context |
| Agent — contributor | Create or update assigned tasks, implementation notes, test evidence, and draft asset metadata |
| Agent — reviewer | Add review findings and verification evidence; cannot approve its own work |

## Safety boundaries

- Every request contains a `projectId` and uses the least required scope.
- Agents cannot change standards, approve releases, or grant permissions without an Owner action.
- Agents do not receive implicit access to local Git repositories, secrets, source binaries, or unrelated projects.
- Write operations require an audit log record and return the changed record IDs.

## Consequences

The local MCP server accepts explicit project IDs, exposes only bounded workflow tools and writes an audit log. The first local-only release uses an owner-controlled machine trust boundary; scoped credentials become mandatory before remote deployment.
