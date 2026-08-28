# STD-001: Unity Asset Source and Git LFS Policy

- Status: Active
- Scope: Global default for small Unity projects
- Owner: Project owner
- Version: 1.0
- Review: Before the first project grows beyond the small-team workflow

## Rule

Use Git for code, text configuration, and small tracked files. Use Git LFS for large Unity source assets such as source images, audio, 3D files, and videos. The workbench records metadata and references, not duplicate source binaries.

## Required asset record

Every asset approved for production must record: asset ID, display name, project ID, LFS path or Git commit, source author, usage-right status, version, approval state, and linked requirement.

## Exceptions

An exception requires an `EXC-` record with a reason, approver, and review date.
