# WB-003: 资产库与审批

- Owner: Project owner
- Linked branch: `main` (initial foundation delivery)
- Status: Ready for review

## Outcome

A registered Unity project can record production asset metadata and enforce an approval gate before an asset is treated as approved.

## Acceptance criteria

- [x] Assets store a project-scoped ID, name, type, Git LFS path, rights status, and approval status.
- [x] Asset source binaries are not copied into El Guapo or GitHub Pages.
- [x] Asset approval follows Draft → In review → Approved or Changes requested → Draft.
- [x] Invalid approval transitions are rejected and writes are audited.
- [x] The local UI displays an approval queue and its Git LFS references.

## Verification evidence

- Automated checks: `npm run check`, `npm run build`, and `npm run test` passed on 2026-08-28.
- Manual checks: Register a project, create a Draft asset, then submit it for review and approve or return it.
