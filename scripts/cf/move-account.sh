#!/usr/bin/env bash
# Copy НаСвітло's data – the D1 database and the R2 media bucket – from one
# Cloudflare account to another. Read-only on the source; writes only to the
# target. Run from the repository root:
#
#   scripts/cf/move-account.sh <target-db-name>
#
#   SRC_ACCOUNT   source account id   (default: Vm@bot-partners.com's Account)
#   DST_ACCOUNT   target account id   (default: botsDev)
#
# <target-db-name> is created in the target account and must not exist yet:
# a dry run goes to e.g. `nasvitlo-trial`, the real move to `nasvitlo`.
# The bucket `nasvitlo-media` is created in the target if it is missing; an
# object already there is overwritten with the source's copy.
#
# Every target command runs from a scratch directory with no wrangler.jsonc,
# so the repository's config – which names the SOURCE database – can never
# route a write to the source. See docs/MOVE-BOTSDEV.md.
set -euo pipefail

SRC_ACCOUNT="${SRC_ACCOUNT:-55d2d3b8fd8d4d615a297eb49f5622c9}"
DST_ACCOUNT="${DST_ACCOUNT:-5f1d89c39916440b30eed21bc37c1efd}"
SRC_DB=nasvitlo
BUCKET=nasvitlo-media
DST_DB="${1:?usage: scripts/cf/move-account.sh <target-db-name>}"

ROOT="$(pwd)"
WRANGLER="$ROOT/node_modules/.bin/wrangler"
[ -x "$WRANGLER" ] || { echo "run from the repository root after npm ci"; exit 1; }
WORK="$(mktemp -d)"
cd "$WORK"
src() { CLOUDFLARE_ACCOUNT_ID="$SRC_ACCOUNT" "$WRANGLER" "$@"; }
dst() { CLOUDFLARE_ACCOUNT_ID="$DST_ACCOUNT" "$WRANGLER" "$@"; }
echo "working in $WORK"

echo "== 1/5 export $SRC_DB from the source account"
if src d1 export "$SRC_DB" --remote --output dump.sql --skip-confirmation 2>&1 | tee export.log; then
  mode=full
elif grep -qi virtual export.log; then
  # D1 cannot export EmDash's FTS5 search index; export the plain tables and
  # drop the triggers that write to it. EmDash rebuilds the index itself
  # (docs/BACKUPS.md, «Відновлення»).
  src d1 execute "$SRC_DB" --remote --json --command \
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_emdash_fts_%' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name" \
    > tables.json
  args=()
  while IFS= read -r t; do args+=(--table "$t"); done < <(node -e 'for (const t of JSON.parse(require("fs").readFileSync("tables.json","utf8"))[0].results) console.log(t.name)')
  src d1 export "$SRC_DB" --remote --output dump.sql --skip-confirmation "${args[@]}"
  python3 - <<'PY'
import re
sql = open("dump.sql", encoding="utf-8").read()
sql, n = re.subn(r'CREATE TRIGGER[^;]*?"_emdash_fts_[^"]*"[\s\S]*?\bEND;\s*', "", sql)
open("dump.sql", "w", encoding="utf-8").write(sql)
print(f"stripped {n} FTS trigger(s)")
PY
  mode=tables-without-fts
else
  echo "export failed – see the log above"; exit 1
fi
cp dump.sql "$ROOT/.emdash/move-$DST_DB.sql" 2>/dev/null || { mkdir -p "$ROOT/.emdash"; cp dump.sql "$ROOT/.emdash/move-$DST_DB.sql"; }
echo "   mode: $mode, dump kept at .emdash/move-$DST_DB.sql"

echo "== 2/5 create $DST_DB in the target account"
dst d1 create "$DST_DB" --location=eeur | tee create.log
DST_ID="$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' create.log | head -1)"
[ -n "$DST_ID" ] || { echo "could not read the new database id"; exit 1; }

echo "== 3/5 import the dump into $DST_DB"
dst d1 execute "$DST_DB" --remote --file dump.sql --yes

echo "== 4/5 copy $BUCKET objects"
dst r2 bucket create "$BUCKET" --location=eeur 2>/dev/null || echo "   bucket exists"
src d1 execute "$SRC_DB" --remote --json --command "SELECT storage_key, mime_type FROM media" > media.json
n=0
while IFS=$'\t' read -r key type; do
  src r2 object get "$BUCKET/$key" --remote --file obj >/dev/null
  dst r2 object put "$BUCKET/$key" --remote --file obj --content-type "$type" >/dev/null
  n=$((n + 1)); echo "   $n. $key"
done < <(node -e 'for (const r of JSON.parse(require("fs").readFileSync("media.json","utf8"))[0].results) console.log(r.storage_key + "\t" + (r.mime_type || "application/octet-stream"))')

echo "== 5/5 compare row counts"
q="SELECT (SELECT COUNT(*) FROM ec_summaries) s, (SELECT COUNT(*) FROM ec_cases) c, (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM revisions) r, (SELECT COUNT(*) FROM media) m"
echo "   source: $(src d1 execute "$SRC_DB" --remote --json --command "$q" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(JSON.parse(s)[0].results[0])))')"
echo "   target: $(dst d1 execute "$DST_DB" --remote --json --command "$q" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(JSON.parse(s)[0].results[0])))')"
echo
echo "done. Target database: $DST_DB  id: $DST_ID  (export mode: $mode, $n media objects)"
