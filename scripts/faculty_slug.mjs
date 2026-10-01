/**
 * Transforma numele unei facultati in numele repository-ului.
 *
 *   "Facultatea de Matematică și Informatică, UBB"  ->  matematica-informatica-ubb
 *
 *   node scripts/faculty_slug.mjs "Facultatea de ..."
 */
import { facultySlug } from './lib/slug.mjs';

const input = process.argv[2] || '';
const slug = facultySlug(input);

if (!slug) {
  process.stderr.write(`Nu am putut deriva un nume de repository din "${input}"\n`);
  process.exit(1);
}

process.stdout.write(slug);
