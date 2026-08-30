const configurationKey = "el-guapo-github-configuration";
const dataPath = "data/el-guapo.json";

export type GitHubConfiguration = { owner: string; repository: string; token: string };
type Project = { id: string; name: string; unityVersion: string | null; repositoryPath: string | null; platforms: string; createdAt: string };
type GameplayFacts = { projectId: string; productPositioning: string; worldSetting: string; gameplayLoop: string; platformConstraints: string; updatedAt: string };
type Task = { id: string; projectId: string; title: string; outcome: string; acceptanceCriteria: string[]; status: string; createdAt: string; updatedAt: string };
type AssetStatus = "draft" | "in_review" | "approved" | "changes_requested";
type Asset = { id: string; projectId: string; name: string; assetType: string; lfsPath: string; rightsStatus: string; approvalStatus: AssetStatus; createdAt: string; updatedAt: string };
type ContentSpec = { id: string; projectId: string; module: string; title: string; brief: string; handoff: string; status: AssetStatus; createdAt: string; updatedAt: string };
type Audit = { id: string; actor: string; projectId: string; action: string; recordType: string; recordId: string; details: Record<string, unknown>; createdAt: string };
type WorkbenchData = { version: 1; projects: Project[]; gameplayFacts: Record<string, GameplayFacts>; tasks: Task[]; assets: Asset[]; contentSpecs: ContentSpec[]; audit: Audit[] };

const standards = [
  { id: "STD-001", title: "Unity Asset Source and Git LFS Policy", category: "资产生产" },
  { id: "STD-002", title: "Codex and Git Workflow", category: "Git 与 Codex 协作" },
  { id: "STD-003", title: "Agent Integration and Audit Policy", category: "Agent 接入" }
];
const approvalTransitions: Record<AssetStatus, AssetStatus[]> = { draft: ["in_review"], in_review: ["approved", "changes_requested"], changes_requested: ["draft"], approved: [] };

function emptyData(): WorkbenchData { return { version: 1, projects: [], gameplayFacts: {}, tasks: [], assets: [], contentSpecs: [], audit: [] }; }
function now() { return new Date().toISOString(); }
function recordId(prefix: string) { return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`; }
function encode(value: string) { return btoa(String.fromCharCode(...new TextEncoder().encode(value))); }
function decode(value: string) { return new TextDecoder().decode(Uint8Array.from(atob(value.replaceAll("\n", "")), (item) => item.charCodeAt(0))); }
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); }
function failure(message: string, status = 400) { return response({ message }, status); }
function project(data: WorkbenchData, projectId: string) { return data.projects.find((item) => item.id === projectId); }
function audit(data: WorkbenchData, projectId: string, action: string, recordType: string, id: string, details: Record<string, unknown>) { data.audit.unshift({ id: recordId("AUDIT"), actor: "github-owner", projectId, action, recordType, recordId: id, details, createdAt: now() }); }

export function readGitHubConfiguration(): GitHubConfiguration | null {
  try { const value = sessionStorage.getItem(configurationKey); return value ? JSON.parse(value) as GitHubConfiguration : null; } catch { return null; }
}

export function saveGitHubConfiguration(configuration: GitHubConfiguration) { sessionStorage.setItem(configurationKey, JSON.stringify(configuration)); }
export function clearGitHubConfiguration() { sessionStorage.removeItem(configurationKey); }

async function github(configuration: GitHubConfiguration, path: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, { ...init, headers: { accept: "application/vnd.github+json", authorization: `Bearer ${configuration.token}`, "x-github-api-version": "2026-03-10", ...init.headers } });
}

async function readData(configuration: GitHubConfiguration): Promise<{ data: WorkbenchData; sha: string | null }> {
  const result = await github(configuration, `/repos/${encodeURIComponent(configuration.owner)}/${encodeURIComponent(configuration.repository)}/contents/${dataPath}`);
  if (result.status === 404) return { data: emptyData(), sha: null };
  if (!result.ok) throw new Error(`无法读取 GitHub 数据仓库（${result.status}）。请检查仓库名称和令牌权限。`);
  const file = await result.json() as { content: string; sha: string };
  try { return { data: JSON.parse(decode(file.content)) as WorkbenchData, sha: file.sha }; } catch { throw new Error("数据仓库中的 data/el-guapo.json 格式无效。"); }
}

async function writeData(configuration: GitHubConfiguration, data: WorkbenchData, sha: string | null, message: string) {
  const result = await github(configuration, `/repos/${encodeURIComponent(configuration.owner)}/${encodeURIComponent(configuration.repository)}/contents/${dataPath}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, content: encode(JSON.stringify(data, null, 2)), ...(sha ? { sha } : {}) }) });
  if (result.status === 409) throw new Error("数据仓库已被其他修改更新。请刷新工作台后重试。");
  if (!result.ok) throw new Error(`无法写入 GitHub 数据仓库（${result.status}）。请检查令牌的 Contents: Read and write 权限。`);
}

function requireProject(data: WorkbenchData, projectId: string) { const value = project(data, projectId); if (!value) throw new Error("项目不存在。"); return value; }
function input(init?: RequestInit) { return init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {}; }
function value(input: Record<string, unknown>, key: string) { return typeof input[key] === "string" ? input[key].trim() : ""; }

export async function githubApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const configuration = readGitHubConfiguration();
  if (!configuration) return failure("请先连接 GitHub 私有数据仓库。", 401);
  try {
    const method = init?.method ?? "GET";
    if (path === "/api/standards" && method === "GET") return response({ items: standards });
    const { data, sha } = await readData(configuration);
    if (path === "/api/projects" && method === "GET") return response({ items: data.projects });
    if (path === "/api/projects" && method === "POST") {
      const body = input(init); const id = value(body, "id").toUpperCase(); const name = value(body, "name");
      if (!/^GAME-[A-Z0-9-]+$/.test(id) || !name) return failure("项目名称不能为空，项目 ID 必须以 GAME- 开头。");
      if (project(data, id)) return failure("项目 ID 已存在。", 409);
      const created: Project = { id, name, unityVersion: value(body, "unityVersion") || null, repositoryPath: value(body, "repositoryPath") || null, platforms: value(body, "platforms") || "待定义", createdAt: now() };
      data.projects.unshift(created); audit(data, id, "create_project", "project", id, { name }); await writeData(configuration, data, sha, `el-guapo: register ${id}`); return response(created, 201);
    }
    const match = path.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/); if (!match) return failure("Not found", 404);
    const projectId = decodeURIComponent(match[1]); const suffix = `/${match[2] ?? ""}`.replace(/\/$/, ""); const current = requireProject(data, projectId);
    if (method === "PATCH" && suffix === "") { const platforms = value(input(init), "platforms") || current.platforms; current.platforms = platforms; audit(data, projectId, "update_project", "project", projectId, { platforms }); await writeData(configuration, data, sha, `el-guapo: update ${projectId}`); return response(current); }
    if (suffix === "/gameplay-facts" && method === "GET") return response(data.gameplayFacts[projectId] ?? { projectId, productPositioning: "", worldSetting: "", gameplayLoop: "", platformConstraints: "", updatedAt: "" });
    if (suffix === "/gameplay-facts" && method === "PUT") { const body = input(init); const facts: GameplayFacts = { projectId, productPositioning: value(body, "productPositioning"), worldSetting: value(body, "worldSetting"), gameplayLoop: value(body, "gameplayLoop"), platformConstraints: value(body, "platformConstraints"), updatedAt: now() }; data.gameplayFacts[projectId] = facts; audit(data, projectId, "update_gameplay_facts", "gameplay_facts", projectId, {}); await writeData(configuration, data, sha, `el-guapo: update gameplay facts for ${projectId}`); return response(facts); }
    if (suffix === "/tasks" && method === "GET") return response({ items: data.tasks.filter((item) => item.projectId === projectId) });
    if (suffix === "/tasks" && method === "POST") { const body = input(init); const title = value(body, "title"), outcome = value(body, "outcome"); const acceptanceCriteria = Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : []; if (!title || !outcome || !acceptanceCriteria.length) return failure("任务必须包含标题、可观察结果和至少一条验收条件。"); const created: Task = { id: recordId("TASK"), projectId, title, outcome, acceptanceCriteria, status: "draft", createdAt: now(), updatedAt: now() }; data.tasks.unshift(created); audit(data, projectId, "create_task", "task", created.id, { title }); await writeData(configuration, data, sha, `el-guapo: create task ${created.id}`); return response(created, 201); }
    if (suffix === "/assets" && method === "GET") return response({ items: data.assets.filter((item) => item.projectId === projectId) });
    if (suffix === "/assets" && method === "POST") { const body = input(init); const name = value(body, "name"), assetType = value(body, "assetType"), lfsPath = value(body, "lfsPath"), rightsStatus = value(body, "rightsStatus"); if (!name || !assetType || !lfsPath || !rightsStatus) return failure("资产名称、类型、Git LFS 路径和权利状态均为必填项。"); const created: Asset = { id: recordId("ART"), projectId, name, assetType, lfsPath, rightsStatus, approvalStatus: "draft", createdAt: now(), updatedAt: now() }; data.assets.unshift(created); audit(data, projectId, "create_asset", "asset", created.id, { name, lfsPath }); await writeData(configuration, data, sha, `el-guapo: create asset ${created.id}`); return response(created, 201); }
    if (suffix === "/content-specs" && method === "GET") return response({ items: data.contentSpecs.filter((item) => item.projectId === projectId) });
    if (suffix === "/content-specs" && method === "POST") { const body = input(init); const module = value(body, "module"), title = value(body, "title"), brief = value(body, "brief"), handoff = value(body, "handoff"); if (!["character", "motion", "skill", "vfx", "scene", "level", "ui"].includes(module) || !title || !brief || !handoff) return failure("设计包必须包含有效模块、标题、设计简报和下游交接说明。"); const created: ContentSpec = { id: recordId("SPEC"), projectId, module, title, brief, handoff, status: "draft", createdAt: now(), updatedAt: now() }; data.contentSpecs.unshift(created); audit(data, projectId, "create_content_spec", "content_spec", created.id, { module, title }); await writeData(configuration, data, sha, `el-guapo: create content spec ${created.id}`); return response(created, 201); }
    const assetApproval = suffix.match(/^\/assets\/([^/]+)\/approval$/); const specStatus = suffix.match(/^\/content-specs\/([^/]+)\/status$/);
    if (method === "PATCH" && assetApproval) { const item = data.assets.find((entry) => entry.id === assetApproval[1] && entry.projectId === projectId); const status = value(input(init), "approvalStatus") as AssetStatus; if (!item || !approvalTransitions[item.approvalStatus]?.includes(status)) return failure("不允许进行该审批状态切换。"); item.approvalStatus = status; item.updatedAt = now(); audit(data, projectId, "update_asset_approval", "asset", item.id, { to: status }); await writeData(configuration, data, sha, `el-guapo: update ${item.id} approval`); return response(item); }
    if (method === "PATCH" && specStatus) { const item = data.contentSpecs.find((entry) => entry.id === specStatus[1] && entry.projectId === projectId); const status = value(input(init), "status") as AssetStatus; if (!item || !approvalTransitions[item.status]?.includes(status)) return failure("不允许进行该审批状态切换。"); item.status = status; item.updatedAt = now(); audit(data, projectId, "update_content_spec_status", "content_spec", item.id, { to: status }); await writeData(configuration, data, sha, `el-guapo: update ${item.id} approval`); return response(item); }
    return failure("Not found", 404);
  } catch (error) { return failure(error instanceof Error ? error.message : "GitHub 数据操作失败。", 500); }
}
