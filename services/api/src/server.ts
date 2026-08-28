import cors from "@fastify/cors";
import Fastify from "fastify";
import { ElGuapoStore, standards } from "@el-guapo/data-store";

const app = Fastify({ logger: true });
const store = new ElGuapoStore();

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok", service: "el-guapo-api" }));

app.get("/api/projects", async () => ({
  items: store.listProjects()
}));

app.post("/api/projects", async (request, reply) => {
  const body = request.body as Partial<{ id: string; name: string; unityVersion: string; repositoryPath: string; platforms: string }>;
  const id = body.id?.trim().toUpperCase();
  const name = body.name?.trim();

  if (!id || !/^GAME-[A-Z0-9-]+$/.test(id) || !name) {
    return reply.code(400).send({ message: "请填写项目名称，并使用 GAME- 开头的项目 ID。" });
  }

  try {
    const project = store.createProject({ id, name, unityVersion: body.unityVersion, repositoryPath: body.repositoryPath, platforms: body.platforms });
    return reply.code(201).send(project);
  } catch {
    return reply.code(409).send({ message: "该项目 ID 已存在。" });
  }
});

app.patch("/api/projects/:projectId", async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const body = request.body as Partial<{ name: string; unityVersion: string; repositoryPath: string; platforms: string }>;
  try {
    return store.updateProject(projectId, body);
  } catch {
    return reply.code(404).send({ message: `项目 ${projectId} 不存在。` });
  }
});

app.get("/api/standards", async () => ({
  items: standards
}));

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "127.0.0.1" });
