// Server-side loader: registers/projects.csv → ProjectDef[]. Pure parsing lives
// in ./projects (unit-testable); this is the only place the register is read.
import { readRepoFile } from "./repo";
import { parseProjects, tierRank, type ProjectDef } from "./projects";
import { parseCsv } from "./csv";

export async function loadProjects(): Promise<ProjectDef[]> {
  return (await loadProjectInventory()) ?? [];
}

export async function loadProjectInventory(): Promise<ProjectDef[] | null> {
  const csv = await readRepoFile("registers/projects.csv");
  if (csv === null) return null;
  const table = parseCsv(csv);
  if (!["slug", "name", "path", "tier"].every((header) => table.headers.includes(header))) return null;
  const projects = parseProjects(csv);
  if (projects.length !== table.rows.length || new Set(projects.map((project) => project.slug)).size !== projects.length) return null;
  return projects.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || a.name.localeCompare(b.name));
}
