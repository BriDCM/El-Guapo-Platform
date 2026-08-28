# Workbench Data Model — Initial Contract

These records form the first shared vocabulary. Each item must receive a stable identifier.

| Record | Purpose | Required links |
| --- | --- | --- |
| Project | Scope, platforms, milestones, owners | requirements, releases |
| Requirement | Product / gameplay intent and acceptance criteria | tasks, decisions, tests |
| Task | Assigned implementation unit | requirement, branch, verification |
| Asset | Metadata for a source or delivery asset | requirement, storage URI, license, approval |
| Standard | Reusable project practice, template, or technical rule | owner, version, scope, exceptions |
| Standard exception | Explicit approved deviation from a standard | standard, project, approver, expiry / review date |
| Approval | Decision gate and approver | target record, decision, timestamp |
| Test case | Verifiable expected behavior | requirement, build result, defects |
| Build | Reproducible playable or web artifact | Git commit, asset manifest, test results |
| Release | Approved distribution milestone | builds, notes, approvals |

Suggested ID namespaces: `WB-` for workbench, `GAME-` for game client, `ART-` for assets, `STD-` for standards, `EXC-` for approved exceptions, `QA-` for verification, and `ADR-` for architectural decisions.
