/**
 * Slug-uri pentru nume de facultati si universitati.
 * Folosit si la numele repository-urilor, si la numele fisierelor din registru.
 */

const MAX_LENGTH = 60;

// Cuvinte care nu adauga informatie in numele unui repository
const FACULTY_STOPWORDS = new Set([
  'facultatea',
  'facultate',
  'universitatea',
  'universitate',
  'de',
  'din',
  'ale',
  'al',
  'a',
  'si',
]);

// La universitati pastram "universitatea", e parte din nume
const UNIVERSITY_STOPWORDS = new Set(['de', 'din', 'ale', 'al', 'a', 'si']);

function words(text) {
  return String(text)
    // NFD desparte diacriticele romanesti (ă â î ș ț) de litera de baza
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function slugify(text, stopwords = new Set(), maxLength = MAX_LENGTH) {
  let slug = words(text)
    .filter((w) => !stopwords.has(w))
    .join('-');

  // Taiem la limita unui cuvant, nu in mijlocul lui
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(/-[^-]*$/, '');
  }

  return slug;
}

export const facultySlug = (name) => slugify(name, FACULTY_STOPWORDS);
export const universitySlug = (name) => slugify(name, UNIVERSITY_STOPWORDS);
