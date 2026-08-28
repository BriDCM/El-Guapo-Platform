import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

export const standards = [
  { id: "STD-001", title: "Unity Asset Source and Git LFS Policy", category: "资产生产", status: "active", scope: "global" },
  { id: "STD-002", title: "Codex and Git Workflow", category: "Git 与 Codex 协作", status: "active", scope: "global" },
  { id: "STD-003", title: "Agent Integration and Audit Policy", category: "Agent 接入", status: "active", scope: "global" }
] as const;

export type ProjectInput = {
  id: string;
  name: string;
  unityVersion?: string;
  repositoryPath?: string;
  platforms?: string;
};

export type ProjectUpdateInput = Partial<Omit<ProjectInput, "id">>;

export type StoredProject = {
  id: string;
  name: string;
  unityVersion: string | null;
  repositoryPath: string | null;
  platforms: string;
  createdAt: string;
};

export type TaskStatus = "draft" | "in_progress" | "ready_for_review" | "approved" | "done";

export type TaskInput = {
  projectId: string;
  title: string;
  outcome: string;
  acceptanceCriteria: string[];
};

export type StoredTask = {
  id: string;
  projectId: string;
  title: string;
  outcome: string;
  acceptanceCriteria: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type GameplayFacts = {
  projectId: string;
  productPositioning: string;
  worldSetting: string;
  gameplayLoop: string;
  platformConstraints: string;
  updatedAt: string;
};

export type AssetApprovalStatus = "draft" | "in_review" | "approved" | "changes_requested";
export type AssetInput = {
  projectId: string;
  name: string;
  assetType: string;
  lfsPath: string;
  rightsStatus: string;
};
export type StoredAsset = AssetInput & {
  id: string;
  approvalStatus: AssetApprovalStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContentModule = "character" | "motion" | "skill" | "vfx" | "scene" | "level" | "ui";
export type ContentSpecInput = { projectId: string; module: ContentModule; title: string; brief: string; handoff: string };
export type StoredContentSpec = ContentSpecInput & { id: string; status: AssetApprovalStatus; createdAt: string; updatedAt: string };

export type StoredAuditEvent = {
  id: string;
  actor: string;
  projectId: string;
  action: string;
  recordType: string;
  recordId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

const transitions: Record<TaskStatus, TaskStatus[]> = {
  draft: ["in_progress"],
  in_progress: ["ready_for_review"],
  ready_for_review: ["in_progress", "approved"],
  approved: ["done"],
  done: []
};

const defaultDatabasePath = fileURLToPath(new URL("../../../data/el-guapo.db", import.meta.url));

export class ElGuapoStore {
  private readonly database: Database.Database;

  constructor(databasePath = process.env.EL_GUAPO_DB_PATH || defaultDatabasePath) {
    const resolvedPath = resolve(databasePath);
    mkdirSync(dirname(resolvedPath), { recursive: true });
    this.database = new Database(resolvedPath);
    this.migrate();
  }

  close() {
    this.database.close();
  }

  private migrate() {
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unity_version TEXT,
        repository_path TEXT,
        platforms TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        title TEXT NOT NULL,
        outcome TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS gameplay_facts (
        project_id TEXT PRIMARY KEY REFERENCES projects(id),
        product_positioning TEXT NOT NULL DEFAULT '',
        world_setting TEXT NOT NULL DEFAULT '',
        gameplay_loop TEXT NOT NULL DEFAULT '',
        platform_constraints TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        lfs_path TEXT NOT NULL,
        rights_status TEXT NOT NULL,
        approval_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS content_specs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id),
        module TEXT NOT NULL,
        title TEXT NOT NULL,
        brief TEXT NOT NULL,
        handoff TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id),
        project_id TEXT NOT NULL REFERENCES projects(id),
        result TEXT NOT NULL,
        evidence TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        project_id TEXT NOT NULL,
        action TEXT NOT NULL,
        record_type TEXT NOT NULL,
        record_id TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  listProjects() {
    return this.database.prepare(`
      SELECT id, name, unity_version AS unityVersion, repository_path AS repositoryPath,
        platforms, created_at AS createdAt FROM projects ORDER BY created_at DESC
    `).all();
  }

  getProject(projectId: string): StoredProject | undefined {
    return this.database.prepare(`
      SELECT id, name, unity_version AS unityVersion, repository_path AS repositoryPath,
        platforms, created_at AS createdAt FROM projects WHERE id = ?
    `).get(projectId) as StoredProject | undefined;
  }

  createProject(input: ProjectInput, actor = "owner") {
    const id = input.id.trim().toUpperCase();
    const name = input.name.trim();
    if (!/^GAME-[A-Z0-9-]+$/.test(id) || !name) throw new Error("项目名称不能为空，项目 ID 必须以 GAME- 开头。");
    this.database.prepare(`
      INSERT INTO projects (id, name, unity_version, repository_path, platforms, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, input.unityVersion?.trim() || null, input.repositoryPath?.trim() || null, input.platforms?.trim() || "待定义", new Date().toISOString());
    this.audit(actor, id, "create_project", "project", id, { name });
    return this.getProject(id);
  }

  updateProject(projectId: string, input: ProjectUpdateInput, actor = "owner") {
    const project = this.requireProject(projectId) as ProjectInput;
    const name = input.name?.trim() || project.name;
    const unityVersion = input.unityVersion === undefined ? project.unityVersion : input.unityVersion.trim() || null;
    const repositoryPath = input.repositoryPath === undefined ? project.repositoryPath : input.repositoryPath.trim() || null;
    const platforms = input.platforms?.trim() || project.platforms || "待定义";
    this.database.prepare(`
      UPDATE projects SET name = ?, unity_version = ?, repository_path = ?, platforms = ? WHERE id = ?
    `).run(name, unityVersion, repositoryPath, platforms, projectId);
    this.audit(actor, projectId, "update_project", "project", projectId, { name, unityVersion, repositoryPath, platforms });
    return this.getProject(projectId)!;
  }

  getGameplayFacts(projectId: string): GameplayFacts {
    this.requireProject(projectId);
    const row = this.database.prepare(`
      SELECT project_id AS projectId, product_positioning AS productPositioning,
        world_setting AS worldSetting, gameplay_loop AS gameplayLoop,
        platform_constraints AS platformConstraints, updated_at AS updatedAt
      FROM gameplay_facts WHERE project_id = ?
    `).get(projectId) as GameplayFacts | undefined;
    return row ?? { projectId, productPositioning: "", worldSetting: "", gameplayLoop: "", platformConstraints: "", updatedAt: "" };
  }

  updateGameplayFacts(projectId: string, facts: Omit<GameplayFacts, "projectId" | "updatedAt">, actor = "owner") {
    this.requireProject(projectId);
    const updatedAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO gameplay_facts (project_id, product_positioning, world_setting, gameplay_loop, platform_constraints, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        product_positioning = excluded.product_positioning,
        world_setting = excluded.world_setting,
        gameplay_loop = excluded.gameplay_loop,
        platform_constraints = excluded.platform_constraints,
        updated_at = excluded.updated_at
    `).run(projectId, facts.productPositioning.trim(), facts.worldSetting.trim(), facts.gameplayLoop.trim(), facts.platformConstraints.trim(), updatedAt);
    this.audit(actor, projectId, "update_gameplay_facts", "gameplay_facts", projectId, { updatedAt });
    return this.getGameplayFacts(projectId);
  }

  listAssets(projectId: string): StoredAsset[] {
    this.requireProject(projectId);
    return this.database.prepare(`
      SELECT id, project_id AS projectId, name, asset_type AS assetType, lfs_path AS lfsPath,
        rights_status AS rightsStatus, approval_status AS approvalStatus,
        created_at AS createdAt, updated_at AS updatedAt
      FROM assets WHERE project_id = ? ORDER BY updated_at DESC
    `).all(projectId) as StoredAsset[];
  }

  createAsset(input: AssetInput, actor = "owner") {
    this.requireProject(input.projectId);
    if (!input.name.trim() || !input.assetType.trim() || !input.lfsPath.trim() || !input.rightsStatus.trim()) {
      throw new Error("资产名称、类型、Git LFS 路径和权利状态均为必填项。");
    }
    const id = `ART-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO assets (id, project_id, name, asset_type, lfs_path, rights_status, approval_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(id, input.projectId, input.name.trim(), input.assetType.trim(), input.lfsPath.trim(), input.rightsStatus.trim(), now, now);
    this.audit(actor, input.projectId, "create_asset", "asset", id, { name: input.name, lfsPath: input.lfsPath });
    return this.getAsset(id)!;
  }

  updateAssetApproval(projectId: string, assetId: string, approvalStatus: AssetApprovalStatus, actor = "owner") {
    const asset = this.getAsset(assetId);
    if (!asset || asset.projectId !== projectId) throw new Error("资产不存在或不属于该项目。");
    const permitted: Record<AssetApprovalStatus, AssetApprovalStatus[]> = {
      draft: ["in_review"], in_review: ["approved", "changes_requested"], changes_requested: ["draft"], approved: []
    };
    if (!permitted[asset.approvalStatus].includes(approvalStatus)) throw new Error("不允许进行该审批状态切换。");
    this.database.prepare("UPDATE assets SET approval_status = ?, updated_at = ? WHERE id = ?").run(approvalStatus, new Date().toISOString(), assetId);
    this.audit(actor, projectId, "update_asset_approval", "asset", assetId, { from: asset.approvalStatus, to: approvalStatus });
    return this.getAsset(assetId)!;
  }

  listContentSpecs(projectId: string): StoredContentSpec[] {
    this.requireProject(projectId);
    return this.database.prepare(`
      SELECT id, project_id AS projectId, module, title, brief, handoff, status,
        created_at AS createdAt, updated_at AS updatedAt
      FROM content_specs WHERE project_id = ? ORDER BY updated_at DESC
    `).all(projectId) as StoredContentSpec[];
  }

  createContentSpec(input: ContentSpecInput, actor = "owner") {
    this.requireProject(input.projectId);
    if (!input.title.trim() || !input.brief.trim() || !input.handoff.trim()) throw new Error("设计包必须包含标题、设计简报和下游交接说明。");
    const id = `SPEC-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO content_specs (id, project_id, module, title, brief, handoff, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(id, input.projectId, input.module, input.title.trim(), input.brief.trim(), input.handoff.trim(), now, now);
    this.audit(actor, input.projectId, "create_content_spec", "content_spec", id, { module: input.module, title: input.title });
    return this.getContentSpec(id)!;
  }

  updateContentSpecStatus(projectId: string, specId: string, status: AssetApprovalStatus, actor = "owner") {
    const spec = this.getContentSpec(specId);
    if (!spec || spec.projectId !== projectId) throw new Error("设计包不存在或不属于该项目。");
    const permitted: Record<AssetApprovalStatus, AssetApprovalStatus[]> = { draft: ["in_review"], in_review: ["approved", "changes_requested"], changes_requested: ["draft"], approved: [] };
    if (!permitted[spec.status].includes(status)) throw new Error("不允许进行该设计包状态切换。");
    this.database.prepare("UPDATE content_specs SET status = ?, updated_at = ? WHERE id = ?").run(status, new Date().toISOString(), specId);
    this.audit(actor, projectId, "update_content_spec_status", "content_spec", specId, { from: spec.status, to: status });
    return this.getContentSpec(specId)!;
  }

  listTasks(projectId: string) {
    this.requireProject(projectId);
    return this.database.prepare(`
      SELECT id, project_id AS projectId, title, outcome, acceptance_criteria AS acceptanceCriteria,
        status, created_at AS createdAt, updated_at AS updatedAt
      FROM tasks WHERE project_id = ? ORDER BY created_at DESC
    `).all(projectId).map((row) => {
      const task = row as { acceptanceCriteria: string } & Record<string, unknown>;
      return { ...task, acceptanceCriteria: JSON.parse(task.acceptanceCriteria) };
    });
  }

  createTask(input: TaskInput, actor: string) {
    this.requireProject(input.projectId);
    if (!input.title.trim() || !input.outcome.trim() || input.acceptanceCriteria.length === 0) {
      throw new Error("任务必须包含标题、可观察结果和至少一条验收条件。");
    }
    const id = `TASK-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO tasks (id, project_id, title, outcome, acceptance_criteria, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(id, input.projectId, input.title.trim(), input.outcome.trim(), JSON.stringify(input.acceptanceCriteria), now, now);
    this.audit(actor, input.projectId, "create_task", "task", id, { title: input.title });
    return this.getTask(id);
  }

  updateTaskStatus(projectId: string, taskId: string, status: TaskStatus, actor: string) {
    const task = this.getTask(taskId) as { projectId: string; status: TaskStatus } | undefined;
    if (!task || task.projectId !== projectId) throw new Error("任务不存在或不属于该项目。");
    if (!transitions[task.status].includes(status)) throw new Error(`不允许从 ${task.status} 直接切换到 ${status}。`);
    this.database.prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?").run(status, new Date().toISOString(), taskId);
    this.audit(actor, projectId, "update_task_status", "task", taskId, { from: task.status, to: status });
    return this.getTask(taskId);
  }

  recordVerification(projectId: string, taskId: string, result: "passed" | "failed", evidence: string, actor: string) {
    const task = this.getTask(taskId) as { projectId: string } | undefined;
    if (!task || task.projectId !== projectId) throw new Error("任务不存在或不属于该项目。");
    if (!evidence.trim()) throw new Error("验证记录必须包含证据。");
    const id = `VERIFY-${randomUUID().slice(0, 8).toUpperCase()}`;
    this.database.prepare(`
      INSERT INTO verifications (id, task_id, project_id, result, evidence, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, taskId, projectId, result, evidence.trim(), new Date().toISOString());
    this.audit(actor, projectId, "record_verification", "verification", id, { taskId, result });
    return { id, projectId, taskId, result, evidence: evidence.trim() };
  }

  projectContext(projectId: string) {
    const project = this.requireProject(projectId);
    return {
      project,
      standards,
      gameplayFacts: this.getGameplayFacts(projectId),
      tasks: this.listTasks(projectId),
      assets: this.listAssets(projectId),
      contentSpecs: this.listContentSpecs(projectId)
    };
  }

  listAudit(projectId: string): StoredAuditEvent[] {
    this.requireProject(projectId);
    return this.database.prepare(`
      SELECT id, actor, project_id AS projectId, action, record_type AS recordType,
        record_id AS recordId, details, created_at AS createdAt
      FROM audit_log WHERE project_id = ? ORDER BY created_at DESC
    `).all(projectId).map((row) => {
      const event = row as { details: string } & Record<string, unknown>;
      return { ...event, details: JSON.parse(event.details) } as StoredAuditEvent;
    });
  }

  private getTask(taskId: string): StoredTask | undefined {
    const row = this.database.prepare(`
      SELECT id, project_id AS projectId, title, outcome, acceptance_criteria AS acceptanceCriteria,
        status, created_at AS createdAt, updated_at AS updatedAt FROM tasks WHERE id = ?
    `).get(taskId) as ({ acceptanceCriteria: string } & Record<string, unknown>) | undefined;
    return row ? { ...row, acceptanceCriteria: JSON.parse(row.acceptanceCriteria) } as StoredTask : undefined;
  }

  private getAsset(assetId: string): StoredAsset | undefined {
    return this.database.prepare(`
      SELECT id, project_id AS projectId, name, asset_type AS assetType, lfs_path AS lfsPath,
        rights_status AS rightsStatus, approval_status AS approvalStatus,
        created_at AS createdAt, updated_at AS updatedAt FROM assets WHERE id = ?
    `).get(assetId) as StoredAsset | undefined;
  }

  private getContentSpec(specId: string): StoredContentSpec | undefined {
    return this.database.prepare(`
      SELECT id, project_id AS projectId, module, title, brief, handoff, status,
        created_at AS createdAt, updated_at AS updatedAt FROM content_specs WHERE id = ?
    `).get(specId) as StoredContentSpec | undefined;
  }

  private requireProject(projectId: string) {
    const project = this.getProject(projectId);
    if (!project) throw new Error(`项目 ${projectId} 尚未在 El Guapo 注册。`);
    return project;
  }

  private audit(actor: string, projectId: string, action: string, recordType: string, recordId: string, details: unknown) {
    this.database.prepare(`
      INSERT INTO audit_log (id, actor, project_id, action, record_type, record_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), actor, projectId, action, recordType, recordId, JSON.stringify(details), new Date().toISOString());
  }
}
