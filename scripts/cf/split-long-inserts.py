#!/usr/bin/env python3
"""
Rewrite a `wrangler d1 export` dump so no statement exceeds D1's 100 KB limit.

D1 rejects any single SQL statement over 100 KB, and an import with one such
statement fails as a whole (`D1_RESET_DO`). Review entries and their revisions
are bigger than that: the review text alone is ~97 KB, and Cyrillic counts
two bytes a character. An oversized

    INSERT INTO "t" ("id","a","b") VALUES('x','<long>',...);

becomes an INSERT with the long text values cut to their first piece, followed
by `UPDATE "t" SET "a" = "a" || '<piece>' WHERE "id" = 'x';` for the rest. The
table ends up byte-for-byte the same – checked by loading both dumps into
SQLite and comparing every table.

It also puts every CREATE TABLE before the first INSERT, and indexes last. A
dump made table by table (the FTS fallback in move-account.sh and the nightly
backup) comes out in alphabetical order, so `media` is filled before
`media_folders` exists – and D1, which enforces foreign keys, stops at the
first row with «no such table: main.media_folders».

    split-long-inserts.py in.sql out.sql
"""
import re
import sys

LIMIT = 90_000          # bytes; D1's limit is 100 KB
PIECE = 30_000          # characters per piece – at most ~90 KB even if all 3-byte

INSERT = re.compile(r'^INSERT INTO ("(?:[^"]|"")+") \(([^)]*)\) VALUES\((.*)\);$', re.S)


def values(s):
    """Split a VALUES(...) body into literal tokens, keeping quoting as is."""
    out, i, n = [], 0, len(s)
    while i < n:
        if s[i] == "'":
            j = i + 1
            while True:
                j = s.index("'", j)
                if j + 1 < n and s[j + 1] == "'":
                    j += 2
                    continue
                break
            out.append(s[i:j + 1])
            i = j + 1
        else:
            j = i
            while j < n and s[j] != ",":
                j += 1
            out.append(s[i:j].strip())
            i = j
        while i < n and s[i] in ", ":
            i += 1
    return out


def text(token):
    return token[1:-1].replace("''", "'")


def quote(t):
    return "'" + t.replace("'", "''") + "'"


def split(stmt):
    m = INSERT.match(stmt)
    if not m:
        raise SystemExit(f"cannot split a {len(stmt.encode())}-byte statement that is not a plain INSERT:\n{stmt[:200]}")
    table, cols_s, vals_s = m.groups()
    cols = [c.strip() for c in cols_s.split(",")]
    vals = values(vals_s)
    if len(cols) != len(vals):
        raise SystemExit(f"{table}: {len(cols)} columns but {len(vals)} values")
    key = cols.index('"id"')
    where = f'WHERE "id" = {vals[key]}'
    first, rest = list(vals), []
    for i, v in enumerate(vals):
        if v.startswith("'") and len(v.encode()) > PIECE:
            t = text(v)
            pieces = [t[k:k + PIECE] for k in range(0, len(t), PIECE)]
            first[i] = quote(pieces[0])
            rest += [f'UPDATE {table} SET {cols[i]} = {cols[i]} || {quote(p)} {where};' for p in pieces[1:]]
    head = f'INSERT INTO {table} ({cols_s}) VALUES({",".join(first)});'
    out = [head] + rest
    for s in out:
        if len(s.encode()) > LIMIT:
            raise SystemExit(f"{table}: a piece is still {len(s.encode())} bytes")
    return out


def main(src, dst):
    lines = [l for l in open(src, encoding="utf-8").read().split("\n") if l.strip()]
    pragma = [l for l in lines if l.startswith("PRAGMA")]
    tables = [l for l in lines if l.startswith("CREATE TABLE")]
    late = [l for l in lines if re.match(r"CREATE (UNIQUE )?INDEX|CREATE TRIGGER|CREATE VIEW", l)]
    rows = [l for l in lines if l not in pragma and l not in tables and l not in late]
    out, n = pragma + tables, 0
    for line in rows:
        if len(line.encode()) > LIMIT:
            out += split(line)
            n += 1
        else:
            out.append(line)
    out += late
    open(dst, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"split {n} oversized statement(s); {len(tables)} tables first, {len(late)} indexes/triggers last")


if __name__ == "__main__":
    main(*sys.argv[1:3])
