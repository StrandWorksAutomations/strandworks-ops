// Server-side loader: registers/projects.csv → ProjectDef[]. Pure parsing lives
// in ./projects (unit-testable); this is the only place the register is read.
import { readRepoFile } from "./repo";
import { parseProjects, tierRank, type ProjectDef } from "./projects";

export async function loadProjects(): Promise<ProjectDef[]> {
  const csv = await readRepoFile("registers/projects.csv");
  return parseProjects(csv).sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.name.localeCompare(b.name));
}
