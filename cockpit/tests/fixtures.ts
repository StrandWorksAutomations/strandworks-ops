// Tests read the REAL projects register, so the register schema and the parser
// are proven against each other on every run.
import fs from "node:fs";
import path from "node:path";
import { parseProjects, projectBySlug as bySlug, type ProjectDef } from "@/lib/projects";

export const PROJECTS: ProjectDef[] = parseProjects(
  fs.readFileSync(path.resolve(__dirname, "../../registers/projects.csv"), "utf-8"),
);
export function projectBySlug(slug: string): ProjectDef | undefined {
  return bySlug(PROJECTS, slug);
}
