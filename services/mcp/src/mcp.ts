import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ElGuapoStore, standards, type TaskStatus } from "@el-guapo/data-store";

export function createElGuapoMcpServer(options: { databasePath?: string; actor?: string } = {}) {
  const server = new McpServer({ name: "el-guapo", version: "0.1.0" });
  const store = new ElGuapoStore(options.databasePath);
  const actor = options.actor || process.env.EL_GUAPO_AGENT_ID || "codex-local-agent";
  const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  const failure = (error: unknown) => ({ isError: true, content: [{ type: "text" as const, text: error instanceof Error ? error.message : "El Guapo 操作失败。" }] });

  server.tool("list_projects", "列出 El Guapo 中已注册的游戏项目。开始跨项目工作前先调用。", {}, async () => text({ projects: store.listProjects() }));

  server.tool("get_project_context", "读取指定项目的基础信息、适用标准和当前任务。", { projectId: z.string().describe("El Guapo 项目 ID，例如 GAME-03") }, async ({ projectId }) => {
    try { return text(store.projectContext(projectId)); } catch (error) { return failure(error); }
  });

  server.tool("list_standards", "列出所有项目通用的 El Guapo 标准与规范。", {}, async () => text({ standards }));

  server.tool("create_task", "为已注册项目创建带结果与验收条件的开发任务草稿。", {
    projectId: z.string(),
    title: z.string(),
    outcome: z.string(),
    acceptanceCriteria: z.array(z.string()).min(1)
  }, async (input) => {
    try { return text(store.createTask(input, actor)); } catch (error) { return failure(error); }
  });

  server.tool("update_task_status", "按 Draft→In progress→Ready for review→Approved→Done 流程更新任务状态。", {
    projectId: z.string(),
    taskId: z.string(),
    status: z.enum(["draft", "in_progress", "ready_for_review", "approved", "done"])
  }, async ({ projectId, taskId, status }) => {
    try { return text(store.updateTaskStatus(projectId, taskId, status as TaskStatus, actor)); } catch (error) { return failure(error); }
  });

  server.tool("record_verification", "为项目任务记录测试或人工验收证据。", {
    projectId: z.string(),
    taskId: z.string(),
    result: z.enum(["passed", "failed"]),
    evidence: z.string().min(1)
  }, async ({ projectId, taskId, result, evidence }) => {
    try { return text(store.recordVerification(projectId, taskId, result, evidence, actor)); } catch (error) { return failure(error); }
  });

  server.tool("list_audit_events", "读取指定项目的 Agent 写入审计事件。", { projectId: z.string() }, async ({ projectId }) => {
    try { return text({ events: store.listAudit(projectId) }); } catch (error) { return failure(error); }
  });

  return { server, store };
}
