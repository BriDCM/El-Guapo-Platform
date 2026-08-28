# Unity Adapter

This package will define the project-scoped bridge between a Unity project and the workbench. It must never require the workbench to scan arbitrary folders or make unrestricted file changes.

Initial responsibilities:

- Export approved gameplay/configuration manifests.
- Report Unity version, build status, and selected validation results.
- Import only explicitly approved workbench configuration.
- Associate every exchange with a registered `projectId`.
