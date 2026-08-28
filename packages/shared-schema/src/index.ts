export type AgentRole = "owner" | "reader" | "contributor" | "reviewer";

export type ProjectSummary = {
  id: string;
  name: string;
  unityVersion: string | null;
  status: "active" | "archived";
};

export type StandardSummary = {
  id: string;
  title: string;
  category: string;
  status: "draft" | "active" | "deprecated" | "superseded";
  scope: "global" | "project";
};
