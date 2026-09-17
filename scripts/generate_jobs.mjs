/**
 * Genereaza jobs.json pornind direct de la linkul planului de invatamant.
 *
 *   curricula (PDF/HTML) -> profil de competente -> cautare peviitor.ro -> matching -> jobs.json
 *
 * Profilul de competente nu se salveaza ca fisier separat; e cache-uit in
 * conf/widget.json ca sa nu recitim curricula la fiecare rulare.
 *
 * Utilizare:
 *   node scripts/generate_jobs.mjs --curriculum=URL [--faculty=...] [--title=...] [--color=...]
 *   node scripts/generate_jobs.mjs                    # refolosind conf/widget.json
 *   node scripts/generate_jobs.mjs --rebuild-profile  # forteaza recitirea curriculei
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';

const CONFIG_PATH = 'conf/widget.json';
const OUTPUT_PATH = 'jobs.json';
const SEARCH_API = 'https://api.peviitor.ro/v1/search/';
const TARGET_MATCHED = 30;
const BATCH = 25;
const MAX_PDFS = 12;
const MAX_CURRICULUM_CHARS = 40000;
const UA = 'Mozilla/5.0 Chrome/120';

const { values: args } = parseArgs({
  options: {
    curriculum: { type: 'string' },
    faculty: { type: 'string' },
    university: { type: 'string' },
    title: { type: 'string' },
    color: { type: 'string' },
    'rebuild-profile': { type: 'boolean', default: false },
  },
});

const log = (msg) => process.stderr.write(`${msg}\n`);
const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

// ── config ──────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    log(`Atentie: ${CONFIG_PATH} nu e JSON valid, pornesc de la zero`);
    return {};
  }
}

function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

// ── opencode ────────────────────────────────────────────────────────────────

function runOpencode(prompt, timeout = 900000) {
  const stdout = execSync(
    'opencode run --model opencode/big-pickle --format json --dangerously-skip-permissions',
    { input: prompt, timeout, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true }
  );

  let text = '';
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line);
      if (ev.type === 'text') text += ev.part?.text || '';
    } catch {
      // linii care nu sunt evenimente JSON
    }
  }
  return text.trim();
}

function extractJson(text, shape = 'object') {
  const stripped = text.replace(/```(?:json)?/gi, '');
  const match = stripped.match(shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ── curricula ───────────────────────────────────────────────────────────────

async function fetchText(url, timeoutMs = 30000) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} pentru ${url}`);
  return await r.text();
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPdfUrls(html, source) {
  const found = new Set();
  const toAbsolute = (href) => {
    try {
      return new URL(href, source).href;
    } catch {
      return null;
    }
  };

  // Intai PDF-urile care par a fi planuri de invatamant
  const priority = /href="([^"]*\b(?:licenta|master|planuri?|curricul|disciplin|programa)\b[^"]*\.pdf)"/gi;
  for (const m of html.matchAll(priority)) {
    const abs = toAbsolute(m[1]);
    if (abs) found.add(abs);
  }

  if (found.size === 0) {
    for (const m of html.matchAll(/href="([^"]*\.pdf)"/gi)) {
      const abs = toAbsolute(m[1]);
      if (abs) found.add(abs);
    }
  }

  return [...found].slice(0, MAX_PDFS);
}

async function extractPdfTexts(urls, destDir) {
  const texts = [];
  for (const [i, url] of urls.entries()) {
    const safeName = `doc_${i}`;
    const pdfPath = join(destDir, `${safeName}.pdf`);
    const txtPath = join(destDir, `${safeName}.txt`);
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1000) throw new Error('fisier prea mic');
      writeFileSync(pdfPath, buf);

      execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { timeout: 60000, shell: true });
      const text = existsSync(txtPath) ? readFileSync(txtPath, 'utf-8').trim() : '';
      if (text.length > 50) texts.push(text);
    } catch (e) {
      log(`  PDF ignorat (${url}): ${e.message}`);
    }
  }
  return texts;
}

async function readCurriculum(url) {
  log(`Descarc curricula: ${url}`);
  const html = await fetchText(url);

  const tmpDir = mkdtempSync(join(tmpdir(), 'curric-'));
  try {
    const pdfUrls = findPdfUrls(html, url);
    log(`Am gasit ${pdfUrls.length} PDF-uri`);

    if (pdfUrls.length > 0) {
      const texts = await extractPdfTexts(pdfUrls, tmpDir);
      if (texts.length > 0) {
        const joined = texts.join('\n\n---\n\n');
        log(`Extras ${joined.length} caractere din PDF-uri`);
        return joined;
      }
    }

    const text = stripHtml(html);
    log(`Fara text din PDF, folosesc HTML-ul paginii (${text.length} caractere)`);
    if (text.length < 200) throw new Error('Nu am putut extrage text din curricula');
    return text;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── profil de competente ────────────────────────────────────────────────────

function buildProfile(curriculumText, facultyHint) {
  const prompt = `Analizeaza planul de invatamant de mai jos si extrage profilul profesional al unui student de la aceasta facultate.

Raspunde DOAR cu JSON valid, fara alt text:
{
  "faculty": "numele facultatii si al universitatii",
  "domains": ["3-6 domenii de activitate potrivite"],
  "skills": ["15-25 de competente concrete deduse din materiile efective"],
  "keywords": ["25-35 de cuvinte cheie pentru cautarea de joburi in Romania"]
}

Reguli:
- Deduci competentele din materiile care apar efectiv in text, nu inventa
- Fiecare keyword are 1-3 cuvinte, asa cum ar aparea intr-un anunt de job romanesc
- Include si termeni de nivel entry: "internship", "junior", "entry level", "student"
- Include atat termeni specifici profilului, cat si categorii largi in care ar putea lucra un absolvent
${facultyHint ? `- Facultatea este "${facultyHint}"; foloseste exact acest nume la "faculty"` : '- Deduci numele facultatii din text; daca nu apare, pune ""'}

Text:
${curriculumText.substring(0, MAX_CURRICULUM_CHARS)}`;

  const profile = extractJson(runOpencode(prompt));
  if (!profile || !Array.isArray(profile.keywords) || profile.keywords.length === 0) {
    throw new Error('Nu am putut genera profilul de competente din curricula');
  }

  return {
    faculty: clean(profile.faculty) || facultyHint || '',
    domains: (profile.domains || []).filter(Boolean),
    skills: (profile.skills || []).filter(Boolean),
    keywords: profile.keywords.filter(Boolean),
  };
}

function renderProfile(profile) {
  return `Esti un student la ${profile.faculty || 'o facultate din Romania'} care cauta un loc de munca (internship / junior / mid).

Domenii in care te poti angaja:
${profile.domains.map((d) => `- ${d}`).join('\n')}

Competentele tale, deduse din planul de invatamant:
${profile.skills.map((s) => `- ${s}`).join('\n')}`;
}

// ── joburi ──────────────────────────────────────────────────────────────────

async function searchJobs(keywords) {
  const seen = new Set();
  const jobs = [];

  for (const q of keywords) {
    try {
      const r = await fetch(`${SEARCH_API}?q=${encodeURIComponent(q)}&page=1`, {
        signal: AbortSignal.timeout(20000),
      });
      const data = await r.json();
      for (const doc of data.response?.docs || []) {
        const key = doc.url || doc.title || JSON.stringify(doc);
        if (seen.has(key)) continue;
        seen.add(key);
        jobs.push(doc);
      }
    } catch (e) {
      log(`  Eroare la cautarea "${q}": ${e.message}`);
    }
  }

  return jobs;
}

async function getDesc(job) {
  try {
    const url = job.job_link || job.url;
    const r = await fetch(Array.isArray(url) ? url[0] : url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();

    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        if (ld.description) return ld.description;
      } catch {
        // ld+json invalid, mergem mai departe
      }
    }

    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (metaMatch) return metaMatch[1];

    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const idx = text.search(/about.?the.?job|descrierea.?postului|descriere/i);
    return idx > 0 ? text.slice(idx, idx + 2000) : text.slice(0, 1500);
  } catch (e) {
    log(`    Nu am putut citi descrierea pentru "${job.title}": ${e.message}`);
    return '';
  }
}

function evaluateBatch(profileText, batch, descs) {
  const jobList = batch
    .map(
      (j, i) => `${i + 1}. ${j.title} @ ${j.company}
   Loc: ${JSON.stringify(j.location)} | Salariu: ${JSON.stringify(j.salary)}
   ${(descs[i] || '(fara descriere)').slice(0, 1200)}`
    )
    .join('\n');

  const prompt = `${profileText}

Pentru fiecare job de mai jos, decide daca e potrivit pentru tine.
Raspunde DOAR cu un JSON array, cate un obiect per job, in aceeasi ordine:
[{"title":"...","match":true,"matchPercentage":0,"reason":"...","tags":["competenta","competenta"]}]

Unde "tags" sunt maximum 2 competente scurte (1-2 cuvinte) din lista ta care au dus la potrivire.

---
${jobList}`;

  return extractJson(runOpencode(prompt), 'array') || [];
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();

  config.curriculumUrl = clean(args.curriculum) || config.curriculumUrl || '';
  config.title = clean(args.title) || config.title || 'Joburi pentru studenți';
  config.color = clean(args.color) || config.color || '#4f46e5';
  // Universitatea nu se deduce din curricula — vine ca input, ca sa nu se
  // fragmenteze registrul cu variante scrise diferit ale aceluiasi nume
  config.university = clean(args.university) || config.university || '';
  const facultyHint = clean(args.faculty) || config.faculty || '';

  if (!config.curriculumUrl) {
    throw new Error(
      `Lipseste linkul curriculei. Ruleaza workflow-ul de configurare sau completeaza "curriculumUrl" in ${CONFIG_PATH}.`
    );
  }

  // Profilul se reface daca lipseste, daca s-a schimbat curricula sau daca e cerut explicit
  const cached = config.profile;
  const needsProfile =
    args['rebuild-profile'] ||
    !cached ||
    !Array.isArray(cached.keywords) ||
    cached.keywords.length === 0 ||
    cached.sourceUrl !== config.curriculumUrl;

  let profile;
  if (needsProfile) {
    const curriculumText = await readCurriculum(config.curriculumUrl);
    log('Generez profilul de competente...');
    profile = buildProfile(curriculumText, facultyHint);
    profile.sourceUrl = config.curriculumUrl;
  } else {
    log('Refolosesc profilul de competente din config');
    profile = { ...cached, faculty: facultyHint || cached.faculty };
  }

  config.faculty = profile.faculty || facultyHint || '';
  config.profile = profile;

  log(`Facultate: ${config.faculty || '(nedeterminata)'}`);
  log(`${profile.skills.length} competente, ${profile.keywords.length} cuvinte cheie`);

  const profileText = renderProfile(profile);

  log('Caut joburi pe peviitor.ro...');
  const allJobs = await searchJobs(profile.keywords);
  log(`${allJobs.length} joburi unice gasite`);

  const matched = [];
  for (let start = 0; start < allJobs.length && matched.length < TARGET_MATCHED; start += BATCH) {
    const batch = allJobs.slice(start, start + BATCH);
    log(`\nBatch ${start / BATCH + 1}: citesc ${batch.length} descrieri...`);
    const descs = await Promise.all(batch.map((j) => getDesc(j)));

    log(`  Evaluez ${batch.length} joburi...`);
    const results = evaluateBatch(profileText, batch, descs);

    for (let i = 0; i < Math.min(results.length, batch.length); i++) {
      if (!results[i]?.match || matched.length >= TARGET_MATCHED) continue;
      matched.push({
        url: batch[i].url,
        title: batch[i].title,
        company: batch[i].company,
        location: batch[i].location,
        salary: batch[i].salary,
        date: batch[i].date,
        status: batch[i].status,
        _version_: batch[i]._version_,
        _root_: batch[i]._root_,
        tags: (results[i].tags || []).slice(0, 2),
        matchPercentage: results[i].matchPercentage,
        reason: results[i].reason,
      });
    }
    log(`  Potrivite pana acum: ${matched.length}/${TARGET_MATCHED}`);
  }

  config.updatedAt = new Date().toISOString();

  writeFileSync(OUTPUT_PATH, JSON.stringify(matched, null, 2) + '\n', 'utf-8');
  saveConfig(config);

  log(`\nGata: ${matched.length} joburi salvate in ${OUTPUT_PATH}`);
}

main().catch((err) => {
  log(`Eroare: ${err.message}`);
  process.exit(1);
});
