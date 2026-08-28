# ADR-0001: Separate Reusable Workbench from Managed Game Repositories

- Status: Accepted
- Date: 2026-08-27

## Context

The workbench will serve multiple development projects. Coupling it to one game's source repository would make reuse, access control, release cadence, and future project onboarding harder.

## Proposal

Keep the reusable workbench application, API, shared contracts, Unity adapter, and local deployment configuration in this repository. Keep every Unity game in its own Git repository. Register each game in the workbench using a stable project ID and its permitted integration settings.

## Consequences

- The workbench can evolve and release independently.
- A game team can adopt the workbench without relocating its existing repository.
- The Unity adapter provides a controlled integration point instead of direct workbench access to arbitrary game files.

## Owner decision needed

None. The owner clarified that cross-project reuse is required.
