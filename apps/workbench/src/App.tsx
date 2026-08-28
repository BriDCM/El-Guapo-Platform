import { FormEvent, useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  unityVersion: string | null;
  repositoryPath: string | null;
  platforms: string;
};

type Standard = { id: string; title: string; category: string };

const emptyForm = { id: "GAME-", name: "", unityVersion: "", repositoryPath: "", platforms: "Windows" };

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [platformsDraft, setPlatformsDraft] = useState("");
  const [message, setMessage] = useState("正在读取本地工作台…");

  const load = async () => {
    const [projectsResponse, standardsResponse] = await Promise.all([fetch("/api/projects"), fetch("/api/standards")]);
    const projectData = await projectsResponse.json() as { items: Project[] };
    const standardData = await standardsResponse.json() as { items: Standard[] };
    setProjects(projectData.items);
    setStandards(standardData.items);
    setMessage("");
  };

  useEffect(() => { void load().catch(() => setMessage("无法连接本地 API。请运行 npm run dev。")); }, []);

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("正在注册项目…");
    const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json() as { message?: string };
    if (!response.ok) { setMessage(result.message ?? "项目注册失败。"); return; }
    setForm(emptyForm);
    setMessage("项目已注册。接下来可进入需求、资产和构建模块。" );
    await load();
  };

  const updatePlatforms = async (projectId: string) => {
    setMessage("正在更新目标平台…");
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platforms: platformsDraft })
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) { setMessage(result.message ?? "项目更新失败。"); return; }
    setEditingProjectId(null);
    setMessage("项目已更新。");
    await load();
  };

  return (
    <main>
      <header>
        <p className="eyebrow">LOCAL-FIRST GAME DEVELOPMENT WORKBENCH</p>
        <h1>El Guapo</h1>
        <p className="intro">管理多个 Unity 项目的本地开发工作台。</p>
      </header>
      <section className="summary" aria-label="工作台摘要">
        <article><span>已注册项目</span><strong>{projects.length}</strong><p>每个项目保持独立 Unity 仓库。</p></article>
        <article><span>全局标准</span><strong>{standards.length}</strong><p>跨项目复用，并允许记录审批例外。</p></article>
        <article><span>Agent 模式</span><strong>受限接入</strong><p>按项目与角色范围记录审计事件。</p></article>
      </section>
      <section className="workspace">
        <article className="panel">
          <div className="section-heading"><div><p className="label">项目注册中心</p><h2>接入一个 Unity 项目</h2></div></div>
          <form onSubmit={createProject}>
            <label>项目 ID<input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} placeholder="GAME-MY-FIRST-GAME" required /></label>
            <label>项目名称<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="我的第一个游戏" required /></label>
            <label>Unity 版本<input value={form.unityVersion} onChange={(event) => setForm({ ...form, unityVersion: event.target.value })} placeholder="例如 2022.3 LTS" /></label>
            <label>本地仓库路径<input value={form.repositoryPath} onChange={(event) => setForm({ ...form, repositoryPath: event.target.value })} placeholder="/Users/you/Projects/my-unity-game" /></label>
            <label>目标平台<input value={form.platforms} onChange={(event) => setForm({ ...form, platforms: event.target.value })} placeholder="Windows, macOS" /></label>
            <button type="submit">注册项目</button>
          </form>
          {message && <p className="message" role="status">{message}</p>}
        </article>
        <article className="panel">
          <p className="label">标准与规范中心</p><h2>当前全局标准</h2>
          <ul>{standards.map((standard) => <li key={standard.id}><b>{standard.id}</b><div>{standard.title}<small>{standard.category} · 已生效</small></div></li>)}</ul>
        </article>
      </section>
      <section className="projects"><p className="label">受管项目</p><h2>项目列表</h2>{projects.length === 0 ? <p>尚未注册项目。请使用上方表单创建第一个项目。</p> : <div className="project-list">{projects.map((project) => <article key={project.id}><b>{project.id}</b><h3>{project.name}</h3><p>Unity {project.unityVersion ?? "待定义"} · {project.platforms}</p><code>{project.repositoryPath ?? "未设置本地仓库路径"}</code>{editingProjectId === project.id ? <div><label>编辑目标平台<input aria-label={`${project.id} 目标平台`} value={platformsDraft} onChange={(event) => setPlatformsDraft(event.target.value)} /></label><button type="button" onClick={() => void updatePlatforms(project.id)}>保存目标平台</button></div> : <button type="button" onClick={() => { setEditingProjectId(project.id); setPlatformsDraft(project.platforms); }}>编辑项目</button>}</article>)}</div>}</section>
    </main>
  );
}
