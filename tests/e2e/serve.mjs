/**
 * A static server over `dist/client` — the local stand-in for Cloudflare's
 * asset server, for `npm run test:e2e`.
 *
 * It answers the way the asset server answers the public pages and no
 * further: `/uk/about` is `uk/about.html` (the build writes `format: "file"`,
 * see astro.config.mjs), a file is served as itself, and anything else is
 * `404.html` with a 404. What only the Worker does — `/` by Accept-Language,
 * the admin, the headers from `_headers` — is deliberately not imitated here:
 * a test that passed against an imitation would prove the imitation. Those
 * checks run against the live site only (http.spec.ts).
 *
 * `/` redirects to `/uk` so that a person opening the server in a browser
 * lands somewhere; no test relies on it.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../../dist/client", import.meta.url)));
const port = Number(process.env.PORT ?? 4319);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
};

/** The file under `root` for a URL path, or null. Never outside `root`. */
async function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const rel = normalize(decoded).replace(/^([/\\])+/, "");
  for (const candidate of [rel, `${rel}.html`]) {
    if (!candidate || candidate === ".html") continue;
    const file = join(root, candidate);
    if (file !== root && !file.startsWith(root + sep)) return null;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      /* not this one */
    }
  }
  return null;
}

/* Fail at once, with the fix, rather than let Playwright wait out its
   timeout for a server that can only answer 404. */
try {
  await stat(join(root, "uk.html"));
} catch {
  console.error(`No build in ${root} — run \`npx astro build\` first (npm run test:e2e does).`);
  process.exit(1);
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname === "/") {
    res.writeHead(307, { location: "/uk" }).end();
    return;
  }
  const file = await resolveFile(pathname);
  const status = file ? 200 : 404;
  const path = file ?? join(root, "404.html");
  try {
    const body = await readFile(path);
    res.writeHead(status, {
      "content-type": types[extname(path)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500, { "content-type": "text/plain" }).end(`missing ${path} — run \`npx astro build\` first`);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`dist/client on http://127.0.0.1:${port}`);
});
