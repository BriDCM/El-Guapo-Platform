# Cloud deployment: El Guapo without localhost

This guide creates the permanent, browser-accessible El Guapo workbench. It uses GitHub Pages for the UI and Cloudflare Worker + D1 for protected project metadata. Perform these steps only in accounts you control.

## 1. Create Cloudflare resources

1. Install dependencies from the repository root: `npm install`.
2. Copy `services/cloud-api/wrangler.jsonc.example` to `services/cloud-api/wrangler.jsonc`.
3. Sign in to Cloudflare with `npx wrangler login`.
4. Create the database: `npx wrangler d1 create el-guapo`.
5. Copy the returned database ID into `services/cloud-api/wrangler.jsonc`.
6. Apply the schema: `npm run deploy --workspace @el-guapo/cloud-api` followed by `npx wrangler d1 migrations apply el-guapo --remote`.

The Worker URL printed by deployment is the API URL, for example `https://el-guapo-api.<your-subdomain>.workers.dev`.

## 2. Create GitHub OAuth credentials

In GitHub **Settings → Developer settings → OAuth Apps**, create an OAuth App with:

- Homepage URL: `https://bridcm.github.io/El-Guapo-Platform/`
- Authorization callback URL: `https://YOUR-WORKER.workers.dev/auth/callback`

Keep the client secret private. Set the following values in Cloudflare (replace the placeholders locally):

```bash
cd services/cloud-api
npx wrangler secret put GITHUB_OAUTH_CLIENT_ID
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
npx wrangler secret put SESSION_SIGNING_SECRET
```

Use a random session signing value of at least 32 characters. In `wrangler.jsonc`, set `OWNER_GITHUB_LOGIN` to the exact GitHub login permitted to access El Guapo, and set `PUBLIC_APP_URL` to the final Pages address.

## 3. Connect GitHub Pages to the Worker

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Value |
| --- | --- |
| `EL_GUAPO_API_URL` | The deployed Cloudflare Worker URL, without a trailing slash |

Push or re-run the **Deploy public demo to GitHub Pages** workflow. The Pages website will then present GitHub login and, after authorization, the live El Guapo control panel.

## 4. Verify

1. Open `https://bridcm.github.io/El-Guapo-Platform/` in a private browser window.
2. Select **使用 GitHub 登录** and authenticate as the configured owner.
3. Register a throwaway test project, create one task, and verify it remains after refresh.
4. Remove the test project only through a future deletion workflow; no deletion endpoint exists yet.

## Security and operations

- Do not put Cloudflare tokens, OAuth values, or database IDs in source files, GitHub Pages variables exposed to the browser, or chat messages.
- D1 is a metadata store, not a Unity asset store. Keep source assets in each game repository with Git LFS.
- The current Worker accepts only the configured owner identity. Adding team roles or long-lived Agent tokens requires a separate access-control change and review.
- D1 migration application and Worker deployment change external infrastructure. Review the generated Worker URL and D1 target before confirming Wrangler prompts.
