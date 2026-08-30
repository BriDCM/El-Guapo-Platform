type D1Row = Record<string, unknown>;
interface D1Statement { bind(...values: unknown[]): D1Statement; all<T = D1Row>(): Promise<{ results: T[] }>; first<T = D1Row>(): Promise<T | null>; run(): Promise<unknown>; }
interface D1Database { prepare(query: string): D1Statement; }

interface Env {
  DB: D1Database;
  PUBLIC_APP_URL: string;
  OWNER_GITHUB_LOGIN: string;
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
  SESSION_SIGNING_SECRET: string;
}

const standards = [
  ["STD-001", "Unity Asset Source and Git LFS Policy", "资产生产"],
  ["STD-002", "Codex and Git Workflow", "Git 与 Codex 协作"],
  ["STD-003", "Agent Integration and Audit Policy", "Agent 接入"]
] as const;
const text = new TextEncoder();
const approvalTransitions: Record<string, string[]> = { draft: ["in_review"], in_review: ["approved", "changes_requested"], changes_requested: ["draft"], approved: [] };
const taskTransitions: Record<string, string[]> = { draft: ["in_progress"], in_progress: ["ready_for_review"], ready_for_review: ["in_progress", "approved"], approved: ["done"], done: [] };

function json(value: unknown, status = 200, headers: HeadersInit = {}) { return Response.json(value, { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } }); }
function now() { return new Date().toISOString(); }
function id(prefix: string) { return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }
function base64url(input: Uint8Array) { return btoa(String.fromCharCode(...input)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, ""); }
function fromBase64url(input: string) { const padded = input.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(input.length / 4) * 4, "="); return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)); }

async function mac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", text.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, text.encode(value))));
}

async function seal(payload: Record<string, unknown>, secret: string) {
  const encoded = base64url(text.encode(JSON.stringify(payload)));
  return `${encoded}.${await mac(encoded, secret)}`;
}

async function open(token: string | undefined, secret: string) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || signature !== await mac(encoded, secret)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(encoded))) as { exp?: number; sub?: string; aud?: string };
    return payload.exp && payload.exp > Date.now() / 1000 ? payload : null;
  } catch { return null; }
}

function appOrigin(env: Env) { return env.PUBLIC_APP_URL.replace(/\/$/, ""); }
function cors(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("origin");
  return origin === appOrigin(env) ? { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST, PUT, PATCH, OPTIONS", "vary": "Origin" } : {};
}

async function authenticated(request: Request, env: Env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const payload = await open(token, env.SESSION_SIGNING_SECRET);
  return payload?.aud === "el-guapo" && payload.sub === env.OWNER_GITHUB_LOGIN ? payload : null;
}

async function ensureStandards(db: D1Database) {
  for (const [id, title, category] of standards) await db.prepare("INSERT OR IGNORE INTO standards (id, title, category, status, scope) VALUES (?, ?, ?, 'active', 'global')").bind(id, title, category).run();
}

async function project(db: D1Database, projectId: string) {
  return db.prepare("SELECT id, name, unity_version AS unityVersion, repository_path AS repositoryPath, platforms, created_at AS createdAt FROM projects WHERE id = ?").bind(projectId).first<D1Row>();
}
async function audit(db: D1Database, actor: string, projectId: string, action: string, recordType: string, recordId: string, details: unknown) {
  await db.prepare("INSERT INTO audit_log (id, actor, project_id, action, record_type, record_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id("AUDIT"), actor, projectId, action, recordType, recordId, JSON.stringify(details), now()).run();
}
async function body(request: Request) { return await request.json() as Record<string, unknown>; }
function string(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function validContentModule(value: string) { return ["character", "motion", "skill", "vfx", "scene", "level", "ui"].includes(value); }

async function login(request: Request, env: Env) {
  const state = await seal({ exp: Math.floor(Date.now() / 1000) + 600, aud: "github-oauth" }, env.SESSION_SIGNING_SECRET);
  const callback = new URL("/auth/callback", request.url).toString();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return Response.redirect(url.toString(), 302);
}

async function callback(request: Request, env: Env) {
  const url = new URL(request.url);
  const state = await open(url.searchParams.get("state") ?? undefined, env.SESSION_SIGNING_SECRET);
  const code = url.searchParams.get("code");
  if (!code || state?.aud !== "github-oauth") return new Response("Invalid login state", { status: 400 });
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ client_id: env.GITHUB_OAUTH_CLIENT_ID, client_secret: env.GITHUB_OAUTH_CLIENT_SECRET, code }) });
  const token = (await tokenResponse.json() as { access_token?: string }).access_token;
  if (!token) return new Response("GitHub login failed", { status: 401 });
  const profile = await fetch("https://api.github.com/user", { headers: { authorization: `Bearer ${token}`, "user-agent": "el-guapo" } });
  const user = await profile.json() as { login?: string };
  if (user.login?.toLowerCase() !== env.OWNER_GITHUB_LOGIN.toLowerCase()) return new Response("This GitHub account is not authorized for El Guapo.", { status: 403 });
  const session = await seal({ sub: env.OWNER_GITHUB_LOGIN, aud: "el-guapo", exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }, env.SESSION_SIGNING_SECRET);
  return Response.redirect(`${appOrigin(env)}#session=${encodeURIComponent(session)}`, 302);
}

async function api(request: Request, env: Env, path: string, actor: string) {
  const db = env.DB;
  await ensureStandards(db);
  const method = request.method;
  if (method === "GET" && path === "/api/standards") return json({ items: standards.map(([id, title, category]) => ({ id, title, category, status: "active", scope: "global" })) });
  if (method === "GET" && path === "/api/projects") return json({ items: (await db.prepare("SELECT id, name, unity_version AS unityVersion, repository_path AS repositoryPath, platforms, created_at AS createdAt FROM projects ORDER BY created_at DESC").all<D1Row>()).results });
  if (method === "POST" && path === "/api/projects") {
    const input = await body(request); const projectId = string(input.id).toUpperCase(); const name = string(input.name);
    if (!/^GAME-[A-Z0-9-]+$/.test(projectId) || !name) return json({ message: "项目名称不能为空，项目 ID 必须以 GAME- 开头。" }, 400);
    await db.prepare("INSERT INTO projects (id, name, unity_version, repository_path, platforms, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(projectId, name, string(input.unityVersion) || null, string(input.repositoryPath) || null, string(input.platforms) || "待定义", now()).run();
    await audit(db, actor, projectId, "create_project", "project", projectId, { name }); return json(await project(db, projectId), 201);
  }
  const match = path.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/); if (!match) return json({ message: "Not found" }, 404);
  const projectId = decodeURIComponent(match[1]); const suffix = `/${match[2] ?? ""}`.replace(/\/$/, ""); const current = await project(db, projectId);
  if (!current) return json({ message: "项目不存在。" }, 404);
  if (method === "PATCH" && suffix === "") { const input = await body(request); const platforms = string(input.platforms) || String(current.platforms); await db.prepare("UPDATE projects SET platforms = ? WHERE id = ?").bind(platforms, projectId).run(); await audit(db, actor, projectId, "update_project", "project", projectId, { platforms }); return json(await project(db, projectId)); }
  if (method === "GET" && suffix === "/gameplay-facts") { const facts = await db.prepare("SELECT project_id AS projectId, product_positioning AS productPositioning, world_setting AS worldSetting, gameplay_loop AS gameplayLoop, platform_constraints AS platformConstraints, updated_at AS updatedAt FROM gameplay_facts WHERE project_id = ?").bind(projectId).first<D1Row>(); return json(facts ?? { projectId, productPositioning: "", worldSetting: "", gameplayLoop: "", platformConstraints: "", updatedAt: "" }); }
  if (method === "PUT" && suffix === "/gameplay-facts") { const input = await body(request); const changed = now(); await db.prepare("INSERT INTO gameplay_facts (project_id, product_positioning, world_setting, gameplay_loop, platform_constraints, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET product_positioning=excluded.product_positioning, world_setting=excluded.world_setting, gameplay_loop=excluded.gameplay_loop, platform_constraints=excluded.platform_constraints, updated_at=excluded.updated_at").bind(projectId, string(input.productPositioning), string(input.worldSetting), string(input.gameplayLoop), string(input.platformConstraints), changed).run(); await audit(db, actor, projectId, "update_gameplay_facts", "gameplay_facts", projectId, { changed }); return json({ projectId, productPositioning: string(input.productPositioning), worldSetting: string(input.worldSetting), gameplayLoop: string(input.gameplayLoop), platformConstraints: string(input.platformConstraints), updatedAt: changed }); }
  if (method === "GET" && suffix === "/tasks") { const rows = (await db.prepare("SELECT id, project_id AS projectId, title, outcome, acceptance_criteria AS acceptanceCriteria, status, created_at AS createdAt, updated_at AS updatedAt FROM tasks WHERE project_id = ? ORDER BY created_at DESC").bind(projectId).all<D1Row>()).results.map((row) => ({ ...row, acceptanceCriteria: JSON.parse(String(row.acceptanceCriteria)) })); return json({ items: rows }); }
  if (method === "POST" && suffix === "/tasks") { const input = await body(request); const title = string(input.title); const outcome = string(input.outcome); const criteria = Array.isArray(input.acceptanceCriteria) ? (input.acceptanceCriteria as unknown[]).filter((item: unknown): item is string => typeof item === "string" && Boolean(item.trim())).map((item: string) => item.trim()) : []; if (!title || !outcome || !criteria.length) return json({ message: "任务必须包含标题、可观察结果和至少一条验收条件。" }, 400); const recordId = id("TASK"); const changed = now(); await db.prepare("INSERT INTO tasks (id, project_id, title, outcome, acceptance_criteria, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)").bind(recordId, projectId, title, outcome, JSON.stringify(criteria), changed, changed).run(); await audit(db, actor, projectId, "create_task", "task", recordId, { title }); return json({ id: recordId, projectId, title, outcome, acceptanceCriteria: criteria, status: "draft", createdAt: changed, updatedAt: changed }, 201); }
  const taskMatch = suffix.match(/^\/tasks\/([^/]+)\/status$/); if (method === "PATCH" && taskMatch) { const input = await body(request); const status = string(input.status); const taskId = taskMatch[1]; const task = await db.prepare("SELECT status FROM tasks WHERE id = ? AND project_id = ?").bind(taskId, projectId).first<{ status: string }>(); if (!task || !taskTransitions[task.status]?.includes(status)) return json({ message: "不允许进行该任务状态切换。" }, 400); await db.prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?").bind(status, now(), taskId).run(); await audit(db, actor, projectId, "update_task_status", "task", taskId, { from: task.status, to: status }); return json({ id: taskId, status }); }
  const resource = suffix.startsWith("/assets") ? { table: "assets", prefix: "ART", statusColumn: "approval_status", list: "SELECT id, project_id AS projectId, name, asset_type AS assetType, lfs_path AS lfsPath, rights_status AS rightsStatus, approval_status AS approvalStatus, created_at AS createdAt, updated_at AS updatedAt FROM assets WHERE project_id = ? ORDER BY updated_at DESC" } : suffix.startsWith("/content-specs") ? { table: "content_specs", prefix: "SPEC", statusColumn: "status", list: "SELECT id, project_id AS projectId, module, title, brief, handoff, status, created_at AS createdAt, updated_at AS updatedAt FROM content_specs WHERE project_id = ? ORDER BY updated_at DESC" } : null;
  if (resource && method === "GET" && (suffix === "/assets" || suffix === "/content-specs")) return json({ items: (await db.prepare(resource.list).bind(projectId).all<D1Row>()).results });
  if (resource && method === "POST" && suffix === "/assets") { const input = await body(request); const name = string(input.name), assetType = string(input.assetType), lfsPath = string(input.lfsPath), rightsStatus = string(input.rightsStatus); if (!name || !assetType || !lfsPath || !rightsStatus) return json({ message: "资产名称、类型、Git LFS 路径和权利状态均为必填项。" }, 400); const recordId = id("ART"), changed = now(); await db.prepare("INSERT INTO assets (id, project_id, name, asset_type, lfs_path, rights_status, approval_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)").bind(recordId, projectId, name, assetType, lfsPath, rightsStatus, changed, changed).run(); await audit(db, actor, projectId, "create_asset", "asset", recordId, { name, lfsPath }); return json({ id: recordId, projectId, name, assetType, lfsPath, rightsStatus, approvalStatus: "draft", createdAt: changed, updatedAt: changed }, 201); }
  if (resource && method === "POST" && suffix === "/content-specs") { const input = await body(request); const module = string(input.module), title = string(input.title), brief = string(input.brief), handoff = string(input.handoff); if (!validContentModule(module) || !title || !brief || !handoff) return json({ message: "设计包必须包含有效模块、标题、设计简报和下游交接说明。" }, 400); const recordId = id("SPEC"), changed = now(); await db.prepare("INSERT INTO content_specs (id, project_id, module, title, brief, handoff, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)").bind(recordId, projectId, module, title, brief, handoff, changed, changed).run(); await audit(db, actor, projectId, "create_content_spec", "content_spec", recordId, { module, title }); return json({ id: recordId, projectId, module, title, brief, handoff, status: "draft", createdAt: changed, updatedAt: changed }, 201); }
  const assetApproval = suffix.match(/^\/assets\/([^/]+)\/approval$/); const specStatus = suffix.match(/^\/content-specs\/([^/]+)\/status$/); if (method === "PATCH" && (assetApproval || specStatus)) { const target = assetApproval ? { table: "assets", id: assetApproval[1], column: "approval_status", type: "asset" } : { table: "content_specs", id: specStatus![1], column: "status", type: "content_spec" }; const input = await body(request); const status = string(assetApproval ? input.approvalStatus : input.status); const existing = await db.prepare(`SELECT ${target.column} AS status FROM ${target.table} WHERE id = ? AND project_id = ?`).bind(target.id, projectId).first<{ status: string }>(); if (!existing || !approvalTransitions[existing.status]?.includes(status)) return json({ message: "不允许进行该审批状态切换。" }, 400); await db.prepare(`UPDATE ${target.table} SET ${target.column} = ?, updated_at = ? WHERE id = ?`).bind(status, now(), target.id).run(); await audit(db, actor, projectId, `update_${target.type}_status`, target.type, target.id, { from: existing.status, to: status }); return json({ id: target.id, status }); }
  return json({ message: "Not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url); const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (url.pathname === "/health") return json({ status: "ok", service: "el-guapo-cloud-api" }, 200, headers);
    if (url.pathname === "/auth/login") return login(request, env);
    if (url.pathname === "/auth/callback") return callback(request, env);
    const user = await authenticated(request, env);
    if (url.pathname === "/auth/session") return user ? json({ authenticated: true, login: user.sub }, 200, headers) : json({ authenticated: false }, 401, headers);
    if (!user) return json({ message: "请先使用 GitHub 登录。" }, 401, headers);
    const response = await api(request, env, url.pathname, String(user.sub));
    const responseHeaders = new Headers(response.headers); Object.entries(headers).forEach(([key, value]) => responseHeaders.set(key, value));
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  }
};
