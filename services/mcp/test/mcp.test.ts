import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ElGuapoStore } from "@el-guapo/data-store";
import { createElGuapoMcpServer } from "../src/mcp.js";

test("exposes project-scoped MCP tools and audits task writes", async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), "el-guapo-mcp-")), "test.db");
  const ownerStore = new ElGuapoStore(databasePath);
  ownerStore.createProject({ id: "GAME-03", name: "Game 03" });
  ownerStore.close();

  const { server, store } = createElGuapoMcpServer({ databasePath, actor: "mcp-test-agent" });
  const client = new Client({ name: "el-guapo-test", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
    "create_task", "get_project_context", "list_audit_events", "list_projects",
    "list_standards", "record_verification", "update_task_status"
  ]);

  const created = await client.callTool({
    name: "create_task",
    arguments: { projectId: "GAME-03", title: "Build prototype", outcome: "Playable scene", acceptanceCriteria: ["Scene launches"] }
  });
  assert.equal(created.isError, undefined);
  assert.equal(store.listTasks("GAME-03").length, 1);
  assert.equal(store.listAudit("GAME-03").at(0)?.actor, "mcp-test-agent");

  await client.close();
  store.close();
});
