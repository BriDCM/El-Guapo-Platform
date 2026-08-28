# Definition of Done

A work item can be marked done only when all applicable conditions hold:

- The linked requirement has clear acceptance criteria.
- Implementation is isolated to its intended branch and reviewable as a focused change.
- Relevant unit, integration, build, or manual verification has passed; any omitted check is documented with a reason.
- User-visible behavior, data contracts, and operational instructions are documented.
- Required approvals are recorded in the workbench.
- Asset source, license / usage status, and version are recorded when assets are affected.
- No secret, cache, build artifact, or unrelated generated file is introduced.
- The merge result keeps `main` buildable.

## Required acceptance record

Every task in El Guapo must store the following fields before it can move to **Ready for review**:

| Field | Requirement |
| --- | --- |
| Outcome | One observable user or system result |
| Acceptance criteria | Testable statements, not implementation aspirations |
| Interface impact | Required UI state and accessibility / error handling, or `None` |
| Data impact | Created, changed, migrated, or deleted records, or `None` |
| Permission impact | Roles and allowed / denied actions, or `None` |
| Verification | Automated tests, manual steps, build check, or documented temporary limitation |
| Documentation impact | Files to update, or `None` with rationale |
| Build / release impact | Affected builds, configuration, migrations, or `None` |

## Minimum lifecycle

`Draft → In progress → Ready for review → Approved → Done`

Tasks may not bypass **Ready for review**. A task with failed verification returns to **In progress**; an approved exception must link to an `EXC-` record.
