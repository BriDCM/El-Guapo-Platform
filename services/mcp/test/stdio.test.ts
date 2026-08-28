import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("serves El Guapo tools over the installed stdio boundary", async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), "el-guapo-stdio-")), "test.db");
  const serverPath = fileURLToPath(new URL("../src/server.js", import.meta.url));
  const environment = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: { ...environment, EL_GUAPO_DB_PATH: databasePath }
  });
  const client = new Client({ name: "el-guapo-stdio-test", version: "0.1.0" });

  await client.connect(transport);
  const tools = await client.listTools();

  assert.equal(tools.tools.length, 7);
  assert.ok(tools.tools.some((tool) => tool.name === "get_project_context"));

  await client.close();
});
