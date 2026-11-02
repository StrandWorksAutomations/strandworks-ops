import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/repo", () => ({ readRepoFile: vi.fn() }));
import { readRepoFile } from "../src/lib/repo";
import { loadProjectInventory, loadProjects } from "../src/lib/projects-load";

beforeEach(() => { vi.mocked(readRepoFile).mockReset(); });
describe("project inventory availability", () => {
  it.each([null, "", "not,a,project,register", "slug,name,path,tier\nINVALID NAME,Ward,wobble-ward,flagship", "slug,name,path,tier\nward,Ward,wobble-ward,flagship\nward,Duplicate,wobble-ward,flagship"])("does not turn missing or invalid inventory into known coverage", async (csv) => {
    vi.mocked(readRepoFile).mockResolvedValue(csv);
    expect(await loadProjectInventory()).toBeNull();
  });
  it("distinguishes a loaded empty register and retains the existing loader fallback", async () => {
    vi.mocked(readRepoFile).mockResolvedValue("slug,name,path,tier");
    expect(await loadProjectInventory()).toEqual([]);
    vi.mocked(readRepoFile).mockResolvedValue(null);
    expect(await loadProjects()).toEqual([]);
  });
  it("loads and sorts the configured inventory without losing source rows", async () => {
    vi.mocked(readRepoFile).mockResolvedValue("slug,name,path,tier\nward,Ward,wobble-ward,tier-2\ninsight,Insight,BadgeMedia,flagship");
    expect((await loadProjectInventory())?.map((project) => project.slug)).toEqual(["insight", "ward"]);
  });
});
