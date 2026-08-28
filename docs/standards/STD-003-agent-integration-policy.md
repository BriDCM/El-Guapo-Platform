# STD-003: Agent Integration and Audit Policy

- Status: Active
- Scope: Global default for all managed projects
- Owner: Project owner
- Version: 1.0
- Review: Before enabling a remote deployment or external collaborators

## Rule

Agents access El Guapo through the approved local integration interface. Each request names a project and is limited to a role-specific scope. All write activity is auditable.

## Prohibited actions without owner approval

- Registering or deleting projects.
- Editing global standards or approving exceptions.
- Approving a release or overriding a failed gate.
- Reading secrets, arbitrary local files, or source asset binaries.
- Writing to a game's Git repository outside the normal development workflow.

## Evidence

The workbench must retain acting identity, project ID, action, affected records, timestamp, and result for every agent write operation.
