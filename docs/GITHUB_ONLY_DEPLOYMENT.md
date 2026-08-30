# GitHub-only deployment: El Guapo without localhost or Cloudflare

This mode is intended for one owner and low-frequency project-management changes. GitHub Pages hosts the workbench. A separate private repository stores workbench metadata as `data/el-guapo.json`; each change is a normal Git commit.

## 1. Create the private data repository

Create a new **private** repository in your `BriDCM` account named `El-Guapo-Data`. Do not add a README, `.gitignore`, license, game assets, secrets, or Unity files. The workbench creates `data/el-guapo.json` on the first save.

## 2. Create a minimal fine-grained token

In GitHub **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, create a token with:

- Resource owner: `BriDCM`
- Repository access: **Only select repositories** → `El-Guapo-Data`
- Repository permissions: **Contents: Read and write**
- Expiration: choose a short practical period and renew when required

Do not grant access to `El-Guapo-Platform`, game repositories, Actions, workflows, administration, organization settings, or any unrelated repository.

## 3. Use the permanent workbench link

Open `https://bridcm.github.io/El-Guapo-Platform/`. Enter your GitHub user, the private data repository, and the fine-grained token. The token is held only in the current browser session. Closing the tab or browser requires entering it again.

## 4. Verify the audit trail

Register a test project, then open the private `El-Guapo-Data` repository on GitHub. You should see `data/el-guapo.json` and a commit named `el-guapo: register GAME-...`. This is the source of truth for the workbench metadata.

## Constraints

- Do not edit the same workbench record in two browser sessions simultaneously. GitHub returns a conflict instead of silently overwriting concurrent changes.
- This mode is not appropriate for multi-user collaboration or high-frequency writes. Introduce a protected backend only if those requirements emerge.
- The token permits modification of the selected private data repository. Revoke it immediately from GitHub if a browser session or device is compromised.
