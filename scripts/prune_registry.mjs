/**
 * Scoate din registrul organizatiei facultatile al caror repository nu mai exista.
 *
 * GitHub nu are un trigger pentru "repository sters", deci registrul se
 * curata la cerere: pentru fiecare intrare se verifica daca repository-ul
 * mai exista. Se sterg doar raspunsurile 404; orice alta eroare (token,
 * rate limit, retea) opreste scriptul fara sa modifice registrul.
 *
 *   node scripts/prune_registry.mjs --registry ORG/REPO [--dry-run]
 *
 * Are nevoie de GH_TOKEN in mediu, cu Contents: write pe registru si acces de
 * citire la repository-urile facultatilor (un repo privat la care tokenul nu
 * are acces ar arata ca 404).
 */
import { execSync } from 'child_process';
import { parseArgs } from 'util';
import { updateRegistry } from './lib/registry.mjs';

const { values: args } = parseArgs({
  options: {
    registry: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const log = (msg) => process.stderr.write(`${msg}\n`);

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('Lipseste GH_TOKEN in mediu');

const registry = typeof args.registry === 'string' ? args.registry.trim() : '';
if (!registry) throw new Error('Lipseste --registry');

const dryRun = args['dry-run'];

// true = exista, false = sters (404). Orice altceva arunca.
function repoExists(repo) {
  try {
    execSync(`gh api "repos/${repo}" --silent`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, GH_TOKEN: token },
    });
    return true;
  } catch (e) {
    const out = `${e.stderr || ''}${e.stdout || ''}`;
    if (/HTTP 404|Not Found/i.test(out)) return false;
    throw new Error(`Nu am putut verifica ${repo}: ${out.trim() || e.message}`);
  }
}

const removed = [];

const result = updateRegistry({
  registry,
  token,
  log,
  mutate: (data) => {
    removed.length = 0;
    const total = data.universities.reduce((n, u) => n + u.faculties.length, 0);

    for (const uni of data.universities) {
      uni.faculties = uni.faculties.filter((f) => {
        if (repoExists(f.repo)) return true;
        removed.push({ university: uni.name, faculty: f.name, repo: f.repo });
        return false;
      });
    }
    data.universities = data.universities.filter((u) => u.faculties.length > 0);

    if (removed.length === 0) return null;

    // Daca "dispar" toate intrarile, e mai probabil o problema de acces decat
    // o stergere in masa; nu scriem nimic
    if (total > 1 && removed.length === total) {
      throw new Error(
        `Toate cele ${total} repository-uri apar ca sterse. Verifica accesul tokenului; nu modific registrul.`
      );
    }

    if (dryRun) return null;
    return `registru: elimina ${removed.length} ${removed.length === 1 ? 'facultate stearsa' : 'facultati sterse'}`;
  },
});

if (removed.length === 0) {
  log('Toate repository-urile din registru exista. Nimic de eliminat.');
} else {
  log(`${dryRun ? 'Ar fi eliminate' : 'Eliminate'} ${removed.length}:`);
  for (const r of removed) log(`  - ${r.faculty} (${r.university}) — ${r.repo}`);
  if (!dryRun && result === 'pushed') log('Registru actualizat.');
}
