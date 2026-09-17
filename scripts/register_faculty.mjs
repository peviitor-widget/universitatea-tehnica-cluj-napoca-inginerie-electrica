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
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';
import { universitySlug } from './lib/slug.mjs';

const REGISTRY_JSON = 'registry.json';
const UNIVERSITIES_DIR = 'universitati';
const PUSH_ATTEMPTS = 5;
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

function loadRegistry(dir) {
  const path = join(dir, REGISTRY_JSON);
  if (!existsSync(path)) return { universities: [] };
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(data.universities) ? data : { universities: [] };
  } catch {
    log(`Atentie: ${REGISTRY_JSON} nu e JSON valid, il refac`);
    return { universities: [] };
  }
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

function renderUniversity(entry) {
  let md = `# ${entry.name}\n\n`;
  md += `${entry.faculties.length} ${entry.faculties.length === 1 ? 'facultate' : 'facultăți'} cu widget de joburi.\n\n`;
  md += `| Facultate | Repository | Widget |\n`;
  md += `|-----------|------------|--------|\n`;

  for (const f of entry.faculties) {
    const name = f.repo.split('/')[1];
    const repoLink = `[${name}](https://github.com/${f.repo})`;
    const widget = f.widgetUrl ? `[live](${f.widgetUrl})` : f.status;
    md += `| ${f.name} | ${repoLink} | ${widget} |\n`;
  }

  md += `\n---\n\nFișier generat automat. Nu îl edita manual.\n`;
  return md;
}

function renderIndex(data) {
  const totalFaculties = data.universities.reduce((n, u) => n + u.faculties.length, 0);

  let md = `# Facultăți cu widget de joburi\n\n`;
  md += `${totalFaculties} ${totalFaculties === 1 ? 'facultate' : 'facultăți'} `;
  md += `din ${data.universities.length} ${data.universities.length === 1 ? 'universitate' : 'universități'}.\n\n`;
  md += `| Universitate | Facultăți |\n`;
  md += `|--------------|-----------|\n`;

  for (const u of data.universities) {
    md += `| [${u.name}](${UNIVERSITIES_DIR}/${u.slug}.md) | ${u.faculties.length} |\n`;
  }

  md += `\n---\n\n`;
  md += `Fișiere generate automat de workflow-urile din `;
  md += `[template](https://github.com/${registry.split('/')[0]}/jobs-widget). Nu le edita manual.\n`;
  return md;
}

function write(dir, data) {
  writeFileSync(join(dir, REGISTRY_JSON), JSON.stringify(data, null, 2) + '\n', 'utf-8');

  const uniDir = join(dir, UNIVERSITIES_DIR);
  mkdirSync(uniDir, { recursive: true });

  // Regeneram tot, ca o schimbare de format sa se propage peste tot
  const expected = new Set(data.universities.map((u) => `${u.slug}.md`));
  for (const file of readdirSync(uniDir)) {
    if (file.endsWith('.md') && !expected.has(file)) rmSync(join(uniDir, file));
  }
  for (const u of data.universities) {
    writeFileSync(join(uniDir, `${u.slug}.md`), renderUniversity(u), 'utf-8');
  }

  writeFileSync(join(dir, 'README.md'), renderIndex(data), 'utf-8');
}

function commitAndPush(dir) {
  const git = (cmd) => execSync(`git -C "${dir}" ${cmd}`, { encoding: 'utf-8' });

  git('add -A');
  try {
    git('diff --cached --quiet');
    return 'unchanged';
  } catch {
    // exit code != 0 inseamna ca avem modificari
  }

  git(
    `-c user.name="github-actions[bot]" ` +
      `-c user.email="github-actions[bot]@users.noreply.github.com" ` +
      `commit -q -m "registru: ${faculty}"`
  );

  try {
    git('push -q');
    return 'pushed';
  } catch {
    return 'conflict';
  }
}

ensureRegistryExists();

const cloneUrl = `https://x-access-token:${token}@github.com/${registry}.git`;

for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
  const dir = mkdtempSync(join(tmpdir(), 'registry-'));
  try {
    execSync(`git clone -q "${cloneUrl}" "${dir}"`, { stdio: 'pipe' });
    write(dir, upsert(loadRegistry(dir)));

    const result = commitAndPush(dir);
    if (result === 'unchanged') {
      log(`Registrul e deja la zi pentru ${faculty}`);
      process.exit(0);
    }
    if (result === 'pushed') {
      log(`Registru actualizat: ${faculty} (${university})`);
      process.exit(0);
    }

    log(`Push respins, altcineva a scris intre timp — reincerc (${attempt}/${PUSH_ATTEMPTS})`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

log(`Nu am putut actualiza registrul ${registry} dupa ${PUSH_ATTEMPTS} incercari`);
process.exit(1);
