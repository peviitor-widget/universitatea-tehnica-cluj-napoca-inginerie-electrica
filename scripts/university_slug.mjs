/**
 * Transforma numele unei universitati in slug-ul folosit in numele repository-ului.
 *
 *   "Universitatea Babeș-Bolyai"  ->  universitatea-babes-bolyai
 *
 *   node scripts/university_slug.mjs "Universitatea ..."
 */
import { universitySlug } from './lib/slug.mjs';
const input = process.argv[2] || '';
const slug = universitySlug(input);
if (!slug) {
  process.stderr.write(`Nu am putut deriva un slug din "${input}"\n`);
  process.exit(1);
}
process.stdout.write(slug);
