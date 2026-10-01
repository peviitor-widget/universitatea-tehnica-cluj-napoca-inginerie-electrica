/**
 * Cod comun pentru scripturile care modifica registrul organizatiei
 * (register_faculty.mjs, prune_registry.mjs).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

export const REGISTRY_JSON = 'registry.json';
export const UNIVERSITIES_DIR = 'universitati';
const PUSH_ATTEMPTS = 5;

export function loadRegistry(dir) {
  const path = join(dir, REGISTRY_JSON);
  if (!existsSync(path)) return { universities: [] };
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(data.universities) ? data : { universities: [] };
  } catch {
    console.error(`Atentie: ${REGISTRY_JSON} nu e JSON valid, il refac`);
    return { universities: [] };
  }
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

function renderIndex(data, registry) {
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

export function writeRegistry(dir, data, registry) {
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

  writeFileSync(join(dir, 'README.md'), renderIndex(data, registry), 'utf-8');
}

/**
 * Cloneaza registrul, aplica `mutate(data)` si face push. Daca push-ul e respins
 * (altcineva a scris intre timp), reia clonarea peste versiunea proaspata.
 * `mutate` primeste datele si intoarce mesajul de commit, sau null daca nu
 * are nimic de schimbat.
 */
export function updateRegistry({ registry, token, mutate, log }) {
  const cloneUrl = `https://x-access-token:${token}@github.com/${registry}.git`;

  for (let attempt = 1; attempt <= PUSH_ATTEMPTS; attempt++) {
    const dir = mkdtempSync(join(tmpdir(), 'registry-'));
    try {
      execSync(`git clone -q "${cloneUrl}" "${dir}"`, { stdio: 'pipe' });
      const data = loadRegistry(dir);
      const message = mutate(data);
      if (!message) return 'unchanged';

      writeRegistry(dir, data, registry);
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
          `commit -q -m "${message.replace(/"/g, "'")}"`
      );

      try {
        git('push -q');
        return 'pushed';
      } catch {
        log(`Push respins, altcineva a scris intre timp — reincerc (${attempt}/${PUSH_ATTEMPTS})`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  throw new Error(`Nu am putut actualiza registrul ${registry} dupa ${PUSH_ATTEMPTS} incercari`);
}
