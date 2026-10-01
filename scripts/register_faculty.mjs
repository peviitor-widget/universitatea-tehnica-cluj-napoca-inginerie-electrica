/**
 * Inregistreaza o facultate in repository-ul de registru al organizatiei.
 *
 * Registrul are ca sursa de adevar registry.json; fisierele markdown sunt
 * regenerate din el la fiecare rulare, deci un upsert nu depinde de parsarea
 * unui tabel scris de mana.
 *
 *   facultati-jobs-widget/
 *   ├── README.md                              (generat)
 *   ├── registry.json                          (sursa de adevar)
 *   └── universitati/
 *       └── universitatea-babes-bolyai.md      (generat)
 *
 * Se apeleaza de doua ori pentru fiecare facultate: o data la crearea
 * repository-ului (fara linkul widgetului) si o data la finalul configurarii,
 * cand widgetul e publicat.
 *
 *   node scripts/register_faculty.mjs --registry ORG/REPO \
 *     --university "..." --faculty "..." --repo ORG/NUME [--widget-url URL]
 *
 *   node scripts/register_faculty.mjs --registry ORG/REPO \
 *     --config conf/widget.json --repo ORG/NUME
 *
 * Are nevoie de GH_TOKEN in mediu, cu Contents: write pe organizatie.
 */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { parseArgs } from 'util';
import { universitySlug } from './lib/slug.mjs';
import { updateRegistry } from './lib/registry.mjs';

const STATUS_ACTIVE = 'activ';
const STATUS_PENDING = 'în configurare';

const { values: args } = parseArgs({
  options: {
    registry: { type: 'string' },
    university: { type: 'string' },
    faculty: { type: 'string' },
    repo: { type: 'string' },
    'widget-url': { type: 'string' },
    config: { type: 'string' },
  },
});

const log = (msg) => process.stderr.write(`${msg}\n`);
const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('Lipseste GH_TOKEN in mediu');

// Argumentele explicite bat valorile din conf/widget.json
let university = clean(args.university);
let faculty = clean(args.faculty);
let widgetUrl = clean(args['widget-url']);

if (args.config && existsSync(args.config)) {
  const config = JSON.parse(readFileSync(args.config, 'utf-8'));
  university = university || clean(config.university);
  faculty = faculty || clean(config.faculty);
  widgetUrl = widgetUrl || clean(config.pagesUrl);
}

const registry = clean(args.registry);
const repo = clean(args.repo);

if (!registry) throw new Error('Lipseste --registry');
if (!repo) throw new Error('Lipseste --repo');
if (!university) throw new Error('Lipseste universitatea (--university sau "university" in config)');
if (!faculty) throw new Error('Lipseste facultatea (--faculty sau "faculty" in config)');

const gh = (cmd) => execSync(`gh ${cmd}`, { encoding: 'utf-8', env: { ...process.env, GH_TOKEN: token } });

function ensureRegistryExists() {
  try {
    gh(`api "repos/${registry}" --silent`);
    return;
  } catch {
    log(`Registrul ${registry} nu exista, il creez...`);
  }
  gh(
    `repo create "${registry}" --public --add-readme ` +
      `--description "Facultatile din organizatie care au widget de joburi"`
  );
}

function upsert(data) {
  const slug = universitySlug(university);
  let entry = data.universities.find((u) => u.slug === slug);

  if (!entry) {
    log(`Universitate noua in registru: ${university}`);
    entry = { name: university, slug, faculties: [] };
    data.universities.push(entry);
  }

  let row = entry.faculties.find((f) => f.repo === repo);
  if (!row) {
    row = { name: faculty, repo };
    entry.faculties.push(row);
  }

  const snapshot = (r) => JSON.stringify([r.name, r.repo, r.widgetUrl, r.status]);
  const before = snapshot(row);

  row.name = faculty;
  // Nu retrogradam o intrare deja activa daca apelul curent nu are linkul
  if (widgetUrl) row.widgetUrl = widgetUrl;
  row.status = row.widgetUrl ? STATUS_ACTIVE : STATUS_PENDING;

  // Fara asta, orice rulare ar produce un commit chiar daca nimic nu s-a schimbat
  if (snapshot(row) !== before || !row.updatedAt) {
    row.updatedAt = new Date().toISOString();
  }

  data.universities.sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  for (const u of data.universities) {
    u.faculties.sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  }

  return data;
}

ensureRegistryExists();

const result = updateRegistry({
  registry,
  token,
  log,
  mutate: (data) => {
    upsert(data);
    return `registru: ${faculty}`;
  },
});

log(
  result === 'unchanged'
    ? `Registrul e deja la zi pentru ${faculty}`
    : `Registru actualizat: ${faculty} (${university})`
);
