import { FormEvent, useEffect, useState } from "react";

const publicDemo = import.meta.env.VITE_PUBLIC_DEMO === "true";

type Project = {
  id: string;
  name: string;
  unityVersion: string | null;
  repositoryPath: string | null;
  platforms: string;
};

type Standard = { id: string; title: string; category: string };
type GameplayFacts = { productPositioning: string; worldSetting: string; gameplayLoop: string; platformConstraints: string };
type Task = { id: string; title: string; outcome: string; acceptanceCriteria: string[]; status: string };

const emptyForm = { id: "GAME-", name: "", unityVersion: "", repositoryPath: "", platforms: "Windows" };

const artflowModules = [
  ["01", "玩法设计", "产品定位、世界观、核心循环、范围与目标平台"],
  ["02", "详细玩法", "状态机、输入、战斗、成长、联机、异常与验收"],
  ["03", "主视觉", "风格圣经、镜头、色彩、材质与视觉门禁"],
  ["04", "内容生产", "角色、动作、技能、特效、场景、关卡、UI 与叙事"],
  ["05", "资产与交付", "Git LFS、审批、预览、构建、发布与回滚"],
  ["06", "标准与 Agent", "跨项目规范、例外、任务审计和受限 Agent 接入"]
];

function PublicDemo() {
  return <main className="public-demo">
    <header>
      <p className="eyebrow">PUBLIC DEMO · LOCAL-FIRST GAME DEVELOPMENT WORKBENCH</p>
      <h1>El Guapo</h1>
      <p className="intro">将 ArtFlow 的设计生产链扩展为可复用的 Unity 项目管理工作台。</p>
      <div className="notice"><b>公开演示模式</b><span>此站仅展示能力与示例结构；真实项目、资源、任务和 Agent 写入需要受保护登录。</span></div>
    </header>
    <section className="demo-flow" aria-label="El Guapo 生产流程">
      <p className="label">从定义到发布</p>
      <div>{artflowModules.map(([number, title]) => <span key={number}>{number} {title}</span>)}</div>
    </section>
    <section className="module-grid" aria-label="工作台模块">
      {artflowModules.map(([number, title, description]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p><small>公开演示 · 真实项目中按角色与项目权限访问</small></article>)}
    </section>
    <section className="public-access">
      <p className="label">访问模型</p>
      <h2>公开了解，受权协作</h2>
      <div><article><b>未登录访客</b><p>查看 El Guapo 能力、标准框架和演示项目。</p></article><article><b>项目成员</b><p>登录后访问获授权项目的需求、资源、测试和发布记录。</p></article><article><b>Agent</b><p>使用项目范围内的受限接口创建任务、记录验证和读取上下文。</p></article></div>
    </section>
  </main>;
}

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [platformsDraft, setPlatformsDraft] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [facts, setFacts] = useState<GameplayFacts>({ productPositioning: "", worldSetting: "", gameplayLoop: "", platformConstraints: "" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({ title: "", outcome: "", acceptanceCriteria: "" });
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

  const loadProjectWorkspace = async (projectId: string) => {
    setSelectedProjectId(projectId);
    if (!projectId) { setTasks([]); return; }
    const [factsResponse, tasksResponse] = await Promise.all([fetch(`/api/projects/${projectId}/gameplay-facts`), fetch(`/api/projects/${projectId}/tasks`)]);
    if (!factsResponse.ok || !tasksResponse.ok) { setMessage("无法读取项目工作区。"); return; }
    setFacts(await factsResponse.json() as GameplayFacts);
    setTasks((await tasksResponse.json() as { items: Task[] }).items);
  };

  const saveGameplayFacts = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    const response = await fetch(`/api/projects/${selectedProjectId}/gameplay-facts`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(facts) });
    setMessage(response.ok ? "玩法基础已保存。" : "玩法基础保存失败。");
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId) return;
    const acceptanceCriteria = taskForm.acceptanceCriteria.split("\n").map((item) => item.trim()).filter(Boolean);
    const response = await fetch(`/api/projects/${selectedProjectId}/tasks`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...taskForm, acceptanceCriteria }) });
    const result = await response.json() as { message?: string };
    if (!response.ok) { setMessage(result.message ?? "任务创建失败。"); return; }
    setTaskForm({ title: "", outcome: "", acceptanceCriteria: "" });
    setMessage("任务已创建，状态为 Draft。");
    await loadProjectWorkspace(selectedProjectId);
  };

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

  if (publicDemo) return <PublicDemo />;

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
      <section className="gameplay-workspace">
        <p className="label">玩法与需求工作区</p><h2>把项目事实转为可验收任务</h2>
        {projects.length === 0 ? <p>先注册一个项目，才能创建玩法记录和任务。</p> : <><label>当前项目<select value={selectedProjectId} onChange={(event) => void loadProjectWorkspace(event.target.value)}><option value="">选择项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.id} · {project.name}</option>)}</select></label>{selectedProjectId && <div className="gameplay-columns"><form className="facts-form" onSubmit={saveGameplayFacts}><h3>玩法设计基础</h3><label>产品定位<textarea value={facts.productPositioning} onChange={(event) => setFacts({ ...facts, productPositioning: event.target.value })} placeholder="目标玩家、核心体验、明确不做什么" /></label><label>世界观与体验语境<textarea value={facts.worldSetting} onChange={(event) => setFacts({ ...facts, worldSetting: event.target.value })} placeholder="时代、地点、玩家身份、核心冲突" /></label><label>核心循环与玩法边界<textarea value={facts.gameplayLoop} onChange={(event) => setFacts({ ...facts, gameplayLoop: event.target.value })} placeholder="玩家反复执行的行为、反馈与长期驱动力" /></label><label>平台与技术边界<textarea value={facts.platformConstraints} onChange={(event) => setFacts({ ...facts, platformConstraints: event.target.value })} placeholder="性能、输入、联网、屏幕和审核限制" /></label><button>保存玩法基础</button></form><div><form className="task-form" onSubmit={createTask}><h3>创建可执行任务</h3><label>任务标题<input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required /></label><label>可观察结果<textarea value={taskForm.outcome} onChange={(event) => setTaskForm({ ...taskForm, outcome: event.target.value })} required /></label><label>验收条件（每行一条）<textarea value={taskForm.acceptanceCriteria} onChange={(event) => setTaskForm({ ...taskForm, acceptanceCriteria: event.target.value })} required /></label><button>创建 Draft 任务</button></form><h3>当前任务</h3>{tasks.length === 0 ? <p>尚无任务。</p> : <ul className="task-list">{tasks.map((task) => <li key={task.id}><b>{task.status}</b><div>{task.title}<small>{task.outcome}</small></div></li>)}</ul>}</div></div>}</>}
      </section>
    </main>
  );
}
