# Managed Project Registry

The workbench is reusable. A game is registered as data; its files do not become part of this repository.

## One registered project contains

- Stable project ID and display name.
- Unity version and target platforms.
- Permitted local repository path or Git remote reference.
- Optional Unity adapter connection settings.
- Requirement, asset, build, and release records owned by that project.
- Access scope and asset-storage policy.

## Isolation rule

Records, assets, builds, and approvals must always carry a `projectId`. A user selecting one project must not view or edit another project's data accidentally.

## First project registration — owner input required

| Field | Value |
| --- | --- |
| Project ID | Pending |
| Display name | Pending |
| Unity version | Pending |
| Local repository path | Pending |
| Target platforms | Pending |
| Asset strategy | Pending |
