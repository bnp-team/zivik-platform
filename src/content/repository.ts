/**
 * Content access boundary.
 *
 * The UI depends only on `ContentRepository`, never on where content is stored.
 * Today it's backed by typed files; when Payload CMS lands we add a
 * `payloadRepository` implementing the same interface and swap it in
 * `getContentRepository()` – no component changes required. All methods are
 * async so file-backed and CMS-backed implementations are interchangeable.
 */
import { about } from "./about";
import { registryProceedings } from "./cases";
import { institutions } from "./institutions";
import { partners } from "./partners";
import { stats } from "./stats";
import type {
  AboutContent,
  Institution,
  Partner,
  RegistryCase,
  Stat,
} from "./types";

export interface ContentRepository {
  getInstitutions(): Promise<Institution[]>;
  getCases(): Promise<RegistryCase[]>;
  getStats(): Promise<Stat[]>;
  getPartners(): Promise<Partner[]>;
  getAbout(): Promise<AboutContent>;
}

/** File-backed implementation used until Payload CMS is wired up. */
export const fileRepository: ContentRepository = {
  async getInstitutions() {
    return [...institutions].sort((a, b) => a.order - b.order);
  },
  async getCases() {
    /* Proceedings, not every record. The acts folded into one – the six ICC
       warrants – travel on their parent's row; see `partOf` in types.ts. */
    return registryProceedings;
  },
  async getStats() {
    return stats;
  },
  async getPartners() {
    return partners;
  },
  async getAbout() {
    return about;
  },
};

/**
 * Returns the active content repository. Swap the implementation here (e.g. read
 * `process.env.CONTENT_SOURCE`) once `payloadRepository` exists.
 */
export function getContentRepository(): ContentRepository {
  return fileRepository;
}

/** Registry cases grouped by institution id, preserving file order. */
export async function getCasesByInstitution(
  repo: ContentRepository = fileRepository,
): Promise<Map<string, RegistryCase[]>> {
  const cases = await repo.getCases();
  const byInstitution = new Map<string, RegistryCase[]>();
  for (const c of cases) {
    const list = byInstitution.get(c.institutionId);
    if (list) list.push(c);
    else byInstitution.set(c.institutionId, [c]);
  }
  return byInstitution;
}
