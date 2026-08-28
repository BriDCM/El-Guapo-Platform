# ADR-0002: Asset Storage Strategy

- Status: Accepted
- Date: 2026-08-27

## Context

Large source assets do not belong in normal Git history. The project needs versioning, approvals, previews, and usage-right tracking.

## Decision

For small Unity projects, use Git plus Git LFS as the source of truth for large binary assets. The workbench stores asset metadata, previews, approvals, rights status, and Git/LFS references only; it must not copy source binaries into its own repository or database.

## Operating rules

- Each Unity repository defines tracked LFS patterns in `.gitattributes`.
- A source asset record includes a stable asset ID, linked Git commit or LFS path, author, version, approval state, and usage-right status.
- Concurrent edits to the same binary asset require explicit coordination; use LFS file locking where supported.
- Revisit Perforce only when team size, binary volume, or concurrent artist edits make Git LFS unsuitable.
