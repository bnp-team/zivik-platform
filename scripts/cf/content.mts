/**
 * Content ⇄ EmDash, for the Cloudflare build.
 *
 *   npm run cf:content -- seed    write .emdash/seed.json from src/content
 *   npm run cf:content -- check   prove the mapping loses nothing
 *   npm run cf:content -- push    bring a running EmDash up to date with the files
 *   npm run cf:content -- schema  add collections and fields the running EmDash lacks
 *
 * `seed` turns today's file content into an EmDash seed: the schema from
 * site/content/collections.ts and one published entry per record. EmDash
 * applies it on the first request to an empty database – that is how the D1
 * database is filled the first time, and how a local dev database is.
 *
 * `check` is the guarantee behind that. For every record of every
 * collection it maps the value to an EmDash row and back and requires the
 * result to deep-equal the original, and it requires every entry key to be
 * unique. The build runs it; a type gaining a field that the collection
 * description does not know about fails here rather than vanishing from the
 * site.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  COLLECTIONS,
  LIST_LABEL,
  POSITION,
  formProblems,
  fromRow,
  seedFields,
  toRow,
  type CollectionSpec,
} from "../../site/content/collections";

type Rec = Record<string, unknown>;

/**
 * The credentials of the running EmDash. A personal access token in
 * EMDASH_TOKEN, or – in a cloud session whose environment keeps the token as
 * an API credential the session never sees – nothing at all: the proxy adds
 * it to requests for that host, so the header is left off
 * (EMDASH_TOKEN_VIA_PROXY=1). A header of our own would stop the proxy.
 */
function emdashAuth(what: string): { base: string; headers: Record<string, string> } {
  const base = process.env.EMDASH_URL?.replace(/\/$/, "");
  const token = process.env.EMDASH_TOKEN;
  const viaProxy = process.env.EMDASH_TOKEN_VIA_PROXY === "1";
  if (!base || (!token && !viaProxy)) throw new Error(`${what} needs EMDASH_URL and EMDASH_TOKEN (or EMDASH_TOKEN_VIA_PROXY=1)`);
  return {
    base,
    headers: { ...(token && !viaProxy ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
  };
}

export async function loadSource(spec: CollectionSpec): Promise<[string, Rec][]> {
  const mod = (await import(resolve(spec.source.file))) as Record<string, unknown>;
  const value = mod[spec.source.export];
  if (value === undefined) throw new Error(`${spec.source.file} does not export ${spec.source.export}`);
  switch (spec.shape) {
    case "array":
      return (value as Rec[]).map((v, i) => [spec.key!(v, i), v]);
    case "record":
      return Object.entries(value as Record<string, Rec>);
    case "single":
      return [[spec.key!(value as Rec, 0), value as Rec]];
  }
}

/** JSON-level equality: what survives a trip through D1 is what JSON can carry. */
const plain = (v: unknown) => JSON.parse(JSON.stringify(v)) as unknown;

async function check(): Promise<number> {
  let failures = 0;
  for (const spec of COLLECTIONS) {
    for (const problem of formProblems(spec)) {
      console.error(`✗ ${problem}`);
      failures++;
    }
    const limited = seedFields(spec).filter((f) => (f.validation as { maxLength?: number } | undefined)?.maxLength);
    const entries = await loadSource(spec);
    const keys = new Set<string>();
    for (const [key, value] of entries) {
      if (!key) {
        console.error(`✗ ${spec.slug}: an entry has an empty key`);
        failures++;
      }
      if (keys.has(key)) {
        console.error(`✗ ${spec.slug}: duplicate key "${key}"`);
        failures++;
      }
      keys.add(key);
      /* A limit the admin enforces must hold for what is already there, or
         the first save of that entry fails on a field nobody touched. */
      const row = toRow(spec, value);
      for (const f of limited) {
        const v = row[String(f.slug)];
        const max = (f.validation as { maxLength: number }).maxLength;
        if (typeof v === "string" && v.length > max) {
          console.error(`✗ ${spec.slug}/${key}: ${f.slug} is ${v.length} characters, the form allows ${max}`);
          failures++;
        }
      }
      /* Through JSON on the way in too: a row is stored, not handed over. */
      const back = fromRow(spec, plain(toRow(spec, value)) as Rec);
      if (!isDeepStrictEqual(plain(back), plain(value))) {
        failures++;
        const a = plain(value) as Rec;
        const b = plain(back) as Rec;
        const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
          (k) => !isDeepStrictEqual(a[k], b[k]),
        );
        console.error(`✗ ${spec.slug}/${key}: round trip changes ${diff.map((k) => `\`${k}\``).join(", ")}`);
      }
    }
    console.log(`  ${spec.slug}: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`);
  }
  return failures;
}

async function seed(out: string) {
  const collections = [];
  const content: Record<string, unknown[]> = {};
  let order = 0;
  for (const spec of COLLECTIONS) {
    collections.push({
      slug: spec.slug,
      label: spec.label,
      labelSingular: spec.labelSingular,
      supports: ["drafts", "revisions", "search"],
      routable: false,
      group: spec.group,
      urlPattern: spec.urlPattern,
      sortOrder: order++,
      titleField: spec.titleField,
      ...(spec.listColumns ? { admin: { listColumns: spec.listColumns } } : {}),
      /* The seed format has no sortOrder: the array order is the order. */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fields: seedFields(spec).map(({ sortOrder, ...f }) => f),
    });
    const entries = await loadSource(spec);
    content[spec.slug] = entries.map(([key, value], i) => ({
      id: `${spec.slug}:${key}`,
      slug: key,
      status: "published",
      data: {
        ...toRow(spec, value),
        ...(spec.shape === "array" ? { [POSITION]: (i + 1) * 10 } : {}),
        ...(spec.listLabel ? { [LIST_LABEL]: spec.listLabel(value, key) } : {}),
      },
    }));
  }

  const seedFile = {
    $schema: "https://emdashcms.com/seed.schema.json",
    version: "1",
    meta: {
      name: "НаСвітло",
      description: "Бібліотека відповідальності та правосуддя для України",
    },
    settings: { title: "НаСвітло", timezone: "Europe/Kyiv" },
    collections,
    content,
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(seedFile, null, 2) + "\n");
  const n = Object.values(content).reduce((a, b) => a + b.length, 0);
  console.log(`  seed: ${collections.length} collections, ${n} entries → ${out}`);
}

/**
 * `push`: the files → a running EmDash, for the transition period.
 *
 * Until the switch, main keeps editing src/content, and the admin already
 * holds a copy seeded from an older version of it. This compares every file
 * record with the entry in EmDash and, for the ones that differ or are
 * missing, writes the file's version and publishes it. Entries that exist
 * only in EmDash are listed, never deleted.
 *
 * It overwrites editors' work, so by default it only reports; `--yes` writes.
 * After the switch – once EmDash is where content is edited – do not run it.
 *
 *   EMDASH_URL=https://… EMDASH_TOKEN=… npm run cf:content -- push [--yes]
 *
 * To bring only a NEW collection in – «Тексти сайту», the legal pages, the
 * map's cities – without touching anything an editor has written anywhere,
 * name it and ask for the missing entries only:
 *
 *   … npm run cf:content -- push --only ui_texts,legal_documents,map_places --missing [--yes]
 *
 * `--only` limits the run to those collections; `--missing` creates the entries
 * EmDash does not have and never updates one it has; `--draft` leaves what it
 * creates unpublished, so it starts no rebuild (see the note in `push`).
 *
 * The token is a personal access token from the admin (Settings → API
 * tokens) with content read, write and publish scopes.
 */
async function push(write: boolean, only?: Set<string>, missingOnly = false, asDraft = false) {
  const { base, headers } = emdashAuth("push");
  const api = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${base}/_emdash/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { item?: { data: Rec; id: string } } };
    return { status: res.status, item: json.data?.item };
  };

  let changed = 0;
  /* With --draft the entries are created and left unpublished: a publish is
     a rebuild of the site, and a few hundred of them at once is a few hundred
     builds. A draft costs none, and for a list an editor edits row by row –
     «Тексти сайту» – it is enough: only a row somebody changed and published
     reaches the site. Several requests at a time, because a few hundred one
     after another is a long wait. */
  const work: (() => Promise<void>)[] = [];
  for (const spec of COLLECTIONS) {
    if (only && !only.has(spec.slug)) continue;
    const entries = await loadSource(spec);
    for (const [i, [key, value]] of entries.entries()) {
      const data: Rec = {
        ...toRow(spec, value),
        ...(spec.shape === "array" ? { [POSITION]: (i + 1) * 10 } : {}),
        ...(spec.listLabel ? { [LIST_LABEL]: spec.listLabel(value, key) } : {}),
      };
      const task = async () => {
        const got = await api("GET", `/content/${spec.slug}/${encodeURIComponent(key)}`);
        /* Only a 404 means «not there». An auth failure, a rate limit or a
           dropped connection is not, and treating it as one would try to
           create an entry that exists. */
        if (!got.item && got.status !== 404) throw new Error(`push: reading ${spec.slug}/${key} failed (${got.status})`);
        if (missingOnly && got.item) return;
        const same =
          got.item &&
          isDeepStrictEqual(plain(fromRow(spec, got.item.data)), plain(value)) &&
          (spec.shape !== "array" || Number(got.item.data[POSITION]) === data[POSITION]);
        if (same) return;
        changed++;
        console.log(`  ${got.item ? "update" : "create"} ${spec.slug}/${key}`);
        if (!write) return;
        const saved = got.item
          ? await api("PUT", `/content/${spec.slug}/${got.item.id}`, { data })
          : await api("POST", `/content/${spec.slug}`, { slug: key, data });
        if (!saved.item) throw new Error(`push: saving ${spec.slug}/${key} failed (${saved.status})`);
        if (asDraft) return;
        const pub = await api("POST", `/content/${spec.slug}/${saved.item.id}/publish`);
        if (pub.status >= 300) throw new Error(`push: publishing ${spec.slug}/${key} failed (${pub.status})`);
      };
      work.push(task);
    }
  }
  const lanes = asDraft ? 6 : 1;
  let next = 0;
  await Promise.all(
    Array.from({ length: lanes }, async () => {
      while (next < work.length) await work[next++]();
    }),
  );
  console.log(
    changed === 0
      ? "cf:content push: EmDash already matches src/content."
      : write
        ? `cf:content push: wrote ${asDraft ? "as drafts" : "and published"} ${changed} entr${changed === 1 ? "y" : "ies"}.`
        : `cf:content push: ${changed} entr${changed === 1 ? "y differs" : "ies differ"} – run with --yes to write.`,
  );
}

/**
 * `schema`: bring the running EmDash's collections and fields in line with
 * collections.ts, through its schema API.
 *
 *   EMDASH_URL=https://… EMDASH_TOKEN=… npm run cf:content -- schema [--yes]
 *
 * The seed shapes a database only once, on its first request, so every later
 * schema change – a new field such as `seo_title`, a new collection such as
 * the blog, the admin form's order and labels – had to be clicked into
 * Content types by hand, field by field. This does it from the same
 * description the seed uses:
 *
 *   + a collection or field that is missing is created;
 *   ~ a field whose label, position, length limit or editor differs is updated;
 *   ~ a collection whose admin list columns differ is updated.
 *
 * It never renames a slug or changes a type. It removes nothing unless asked:
 * with `--prune`, a field the running EmDash has and collections.ts no longer
 * describes is deleted – its column and every value in it, in every entry,
 * so take a backup first (docs/BACKUPS.md). Without `--yes` it only reports.
 * The token needs Schema Read and Schema Write (Settings → API tokens).
 *
 *   … cf:content -- schema --prune [--yes]
 */
type RemoteField = {
  slug: string;
  widget?: string | null;
  label: string;
  sortOrder: number;
  validation?: Record<string, unknown> | null;
  options?: Record<string, unknown> | null;
};

async function schema(write: boolean, prune: boolean) {
  const { base, headers } = emdashAuth("schema");
  const api = async (method: string, path: string, body?: unknown) => {
    /* A cold Worker or a busy D1 answers the odd 5xx; one or two retries
       keep a run of dozens of calls from stopping half-way. */
    let res!: Response;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${base}/_emdash/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.status < 500) break;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    const json = (await res.json().catch(() => ({}))) as {
      data?: { item?: { fields?: RemoteField[]; admin?: { listColumns?: string[] } } };
      error?: { message?: string };
    };
    if (res.status >= 400 && res.status !== 404) {
      throw new Error(`${method} ${path}: ${res.status} ${json.error?.message ?? ""}`);
    }
    return { status: res.status, item: json.data?.item };
  };

  let added = 0;
  let updated = 0;
  let removed = 0;
  for (const [order, spec] of COLLECTIONS.entries()) {
    const got = await api("GET", `/schema/collections/${spec.slug}?includeFields=true`);
    const fields = seedFields(spec);
    if (got.status === 404) {
      added++;
      console.log(`  + collection ${spec.slug} (${spec.label}) with ${fields.length} fields`);
      if (!write) continue;
      await api("POST", "/schema/collections", {
        slug: spec.slug,
        label: spec.label,
        labelSingular: spec.labelSingular,
        supports: ["drafts", "revisions", "search"],
        routable: false,
        group: spec.group,
        urlPattern: spec.urlPattern,
        sortOrder: order,
        ...(spec.listColumns ? { admin: { listColumns: spec.listColumns } } : {}),
      });
      for (const f of fields) await api("POST", `/schema/collections/${spec.slug}/fields`, f);
      await api("PUT", `/schema/collections/${spec.slug}`, { titleField: spec.titleField });
      continue;
    }
    const have = new Map((got.item?.fields ?? []).map((f) => [f.slug, f]));
    for (const f of fields) {
      const slug = String(f.slug);
      const remote = have.get(slug);
      if (!remote) {
        added++;
        console.log(`  + field ${spec.slug}.${slug} (${f.label})`);
        if (write) await api("POST", `/schema/collections/${spec.slug}/fields`, f);
        continue;
      }
      const wantMax = (f.validation as { maxLength?: number } | undefined)?.maxLength;
      const haveMax = remote.validation?.maxLength as number | undefined;
      const changes: string[] = [];
      if (remote.label !== f.label) changes.push(`label «${f.label}»`);
      if (remote.sortOrder !== f.sortOrder) changes.push(`position ${remote.sortOrder} → ${f.sortOrder}`);
      if (wantMax !== haveMax) changes.push(`max length ${haveMax ?? "–"} → ${wantMax ?? "–"}`);
      /* A select's choices: «Приховати розділи» gained six, and a field that
         keeps the choices it was created with would never offer them. */
      const wantOpts = (f.validation as { options?: unknown[] } | undefined)?.options;
      const haveOpts = remote.validation?.options as unknown[] | undefined;
      const optsChanged = Boolean(wantOpts) && JSON.stringify(wantOpts) !== JSON.stringify(haveOpts);
      if (optsChanged) changes.push(`options ${haveOpts?.length ?? 0} → ${wantOpts!.length}`);
      const wantWidget = (f.widget as string | undefined) ?? "";
      if ((remote.widget ?? "") !== wantWidget) changes.push(`editor ${remote.widget || "–"} → ${wantWidget || "–"}`);
      if (!changes.length) continue;
      updated++;
      console.log(`  ~ field ${spec.slug}.${slug}: ${changes.join(", ")}`);
      if (!write) continue;
      /* `validation` is required by the update and replaces the stored one,
         so the stored value goes back with only maxLength changed – sending
         null would drop a select's options or a repeater's sub-fields. */
      const validation = { ...(remote.validation ?? {}) };
      if (wantMax === undefined) delete validation.maxLength;
      else validation.maxLength = wantMax;
      if (optsChanged) validation.options = wantOpts;
      await api("PUT", `/schema/collections/${spec.slug}/fields/${slug}`, {
        label: f.label,
        sortOrder: f.sortOrder,
        ...(wantWidget ? { widget: wantWidget } : {}),
        validation: Object.keys(validation).length ? validation : null,
      });
    }
    if (prune) {
      const want = new Set(fields.map((f) => String(f.slug)));
      for (const slug of have.keys()) {
        if (want.has(slug)) continue;
        removed++;
        console.log(`  - field ${spec.slug}.${slug} (${have.get(slug)!.label}) – deletes its values`);
        if (write) await api("DELETE", `/schema/collections/${spec.slug}/fields/${slug}`);
      }
    }
    const wantCols = spec.listColumns ?? [];
    const haveCols = got.item?.admin?.listColumns ?? [];
    if (wantCols.join() !== haveCols.join()) {
      updated++;
      console.log(`  ~ collection ${spec.slug}: list columns ${haveCols.join(", ") || "–"} → ${wantCols.join(", ") || "–"}`);
      if (write) await api("PUT", `/schema/collections/${spec.slug}`, { admin: { listColumns: wantCols } });
    }
  }
  const n = added + updated + removed;
  if (!n) console.log("  cf:content schema: the running EmDash matches collections.ts.");
  else if (!write)
    console.log(`  cf:content schema: ${added} to add, ${updated} to update, ${removed} to delete – run again with --yes to apply.`);
  else console.log(`  cf:content schema: added ${added}, updated ${updated}, deleted ${removed}.`);
}

const [cmd = "check", ...rest] = process.argv.slice(2);
if (cmd === "check") {
  const failures = await check();
  if (failures) {
    console.error(`\ncf:content check: ${failures} problem(s). See site/content/collections.ts.`);
    process.exit(1);
  }
  console.log("cf:content check: every record survives the trip through EmDash unchanged.");
} else if (cmd === "seed") {
  await seed(resolve(rest[0] ?? ".emdash/seed.json"));
} else if (cmd === "push") {
  const onlyArg = rest.find((a) => a.startsWith("--only="))?.slice(7) ?? rest[rest.indexOf("--only") + 1];
  const only = rest.some((a) => a === "--only" || a.startsWith("--only=")) && onlyArg
    ? new Set(onlyArg.split(",").map((x) => x.trim()).filter(Boolean))
    : undefined;
  if (only) {
    const known = new Set(COLLECTIONS.map((c) => c.slug));
    for (const slug of only) if (!known.has(slug)) throw new Error(`push --only: no collection "${slug}"`);
  }
  await push(rest.includes("--yes"), only, rest.includes("--missing"), rest.includes("--draft"));
} else if (cmd === "schema") {
  await schema(rest.includes("--yes"), rest.includes("--prune"));
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(2);
}
