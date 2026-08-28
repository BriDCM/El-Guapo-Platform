import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ElGuapoStore } from "../src/index.js";

test("creates project tasks, enforces lifecycle and audits writes", () => {
  const store = new ElGuapoStore(join(mkdtempSync(join(tmpdir(), "el-guapo-")), "test.db"));
  store.createProject({ id: "GAME-03", name: "Game 03" });
  const updatedProject = store.updateProject("GAME-03", { platforms: "iOS 18+ and equivalent Android" }, "test-agent");
  assert.equal(updatedProject.platforms, "iOS 18+ and equivalent Android");
  const task = store.createTask({ projectId: "GAME-03", title: "First task", outcome: "Visible result", acceptanceCriteria: ["Works"] }, "test-agent");
  assert.ok(task);
  assert.equal(task.status, "draft");
  assert.throws(() => store.updateTaskStatus("GAME-03", task.id, "approved", "test-agent"), /不允许/);
  store.updateTaskStatus("GAME-03", task.id, "in_progress", "test-agent");
  store.recordVerification("GAME-03", task.id, "passed", "Unit test passed", "test-agent");
  assert.equal(store.listAudit("GAME-03").length, 5);
  store.close();
});
