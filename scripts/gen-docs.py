"""Regenerates docs/architecture/ERD.md, SCHEMA.md and API.md from the Prisma schema and the controllers.
Run from the repository root: python3 scripts/gen-docs.py"""
import glob
import re

s = open('apps/backend/prisma/schema.prisma').read()
models = {}
for m in re.finditer(r'^model (\w+) \{(.*?)^\}', s, re.S | re.M):
    name, body = m.group(1), m.group(2)
    table = re.search(r'@@map\("(\w+)"\)', body).group(1)
    fields = []
    for line in body.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        parts = line.split()
        if len(parts) >= 2:
            fields.append((parts[0], parts[1], ' '.join(parts[2:])))
    models[name] = (table, fields)

scalar = {'Int', 'String', 'Boolean', 'DateTime', 'Float', 'Decimal'}
base = lambda t: t.rstrip('?').rstrip('[]')

out = ['erDiagram']
for n, (t, f) in models.items():
    for fn, ft, rest in f:
        if base(ft) in models and '@relation(fields' in rest:
            out.append(f'  {models[base(ft)][0].upper()} {"o|" if ft.endswith("?") else "||"}--o{{ {t.upper()} : "{fn}"')
for n, (t, f) in models.items():
    out.append(f'  {t.upper()} {{')
    for fn, ft, rest in f:
        if base(ft) in models:
            continue
        out.append(f'    {base(ft) if base(ft) in scalar else "enum"} {fn}{" PK" if "@id" in rest else ""}')
    out.append('  }')
open('docs/architecture/ERD.md', 'w').write(
    f'# Entity relationship diagram\n\nGenerated from `apps/backend/prisma/schema.prisma` ({len(models)} tables) by `scripts/gen-docs.py`. '
    'Chain of custody: Shipment -> WeighingRecord -> Batch -> OrderItem -> FactoryOrder. `points_ledger` is append-only.\n\n```mermaid\n'
    + '\n'.join(out) + '\n```\n')

d = ['# Database dictionary\n', f'{len(models)} tables, generated from `apps/backend/prisma/schema.prisma` by `scripts/gen-docs.py`. '
     'Constraints Prisma cannot express (CHECKs, the `points_ledger` trigger) are in `apps/backend/prisma/migrations/*_constraints`.\n']
for n, (t, f) in models.items():
    d.append(f'\n## {t}\n\n| Column | Type | Notes |\n| --- | --- | --- |')
    for fn, ft, rest in f:
        if base(ft) in models:
            continue
        notes = []
        if '@id' in rest: notes.append('primary key')
        if '@unique' in rest: notes.append('unique')
        dm = re.search(r'@default\(.*?\)(?=\s|$)', rest)
        if dm: notes.append(dm.group(0))
        if ft.endswith('?'): notes.append('optional')
        d.append(f'| `{fn}` | {ft} | {", ".join(notes)} |')
open('docs/architecture/SCHEMA.md', 'w').write('\n'.join(d) + '\n')

rows = []
for p in sorted(glob.glob('apps/backend/src/**/*.controller.ts', recursive=True)):
    c = open(p).read()
    m = re.search(r"@Controller\('?([^')]*)'?\)", c)
    basepath = m.group(1) if m else ''
    cls = re.search(r"@Roles\(([^)]*)\)\s*\n(?:@\w+\([^\n]*\)\s*\n)*@Controller", c)
    for mm in re.finditer(r"((?:\s*@(?:Roles|Public|HttpCode|Throttle)\([^\n]*\)\n)*)\s*@(Get|Post|Put|Patch|Delete)\(([^)]*)\)\n(?:\s*@ApiOperation\(\{ summary: ['\"`](.*?)['\"`] \}\)\n)?", c):
        pre, verb, path, summ = mm.groups()
        r = re.search(r"@Roles\(([^)]*)\)", pre)
        roles = (r or cls)
        roles = roles.group(1).replace("'", '') if roles else ('public' if '@Public' in pre else 'any logged in')
        rows.append(('/' + '/'.join(x for x in [basepath, path.strip("'\"")] if x), verb.upper(), roles, summ or ''))
rows.sort(key=lambda r: (r[0], r[1]))
a = ['# API reference (summary)\n', 'Generated from the controllers by `scripts/gen-docs.py`. Full shapes: Swagger at `/docs` when `SWAGGER_ENABLED=true`.\n',
     '| Method | Path | Who | What |', '| --- | --- | --- | --- |']
a += [f'| {v} | `{p}` | {r} | {s_} |' for p, v, r, s_ in rows]
open('docs/architecture/API.md', 'w').write('\n'.join(a) + '\n')
print(len(models), 'tables', len(rows), 'endpoints')
