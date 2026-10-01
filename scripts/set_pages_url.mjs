/**
 * Salveaza URL-ul public de GitHub Pages in conf/widget.json si scrie EMBED.md,
 * fisierul din care facultatea copiaza codul de integrare.
 *
 *   node scripts/set_pages_url.mjs --url=https://org.github.io/repo
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parseArgs } from 'util';

const CONFIG_PATH = 'conf/widget.json';
const EMBED_PATH = 'EMBED.md';

const { values: args } = parseArgs({
  options: { url: { type: 'string' } },
});

const url = (args.url || '').trim().replace(/\/+$/, '');
if (!url) {
  process.stderr.write('Lipseste --url\n');
  process.exit(1);
}

const config = existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) : {};
config.pagesUrl = url;
writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');

const params = new URLSearchParams();
if (config.title) params.set('title', config.title);
if (config.color) params.set('color', config.color);
const query = params.toString() ? `?${params}` : '';

const embed = `# Cod de integrare — widget joburi

${config.faculty ? `**Facultate:** ${config.faculty}\n\n` : ''}**Pagina widgetului:** ${url}/

Copiază codul de mai jos în pagina site-ului facultății, acolo unde vrei să apară widgetul:

\`\`\`html
<iframe
  src="${url}/#/widget${query}"
  width="100%"
  height="650px"
  style="border: none; background: transparent;"
></iframe>
\`\`\`

## Parametri opționali

| Parametru | Descriere | Exemplu |
|-----------|-----------|---------|
| \`title\` | Titlul afișat în widget | \`Joburi pentru studenți\` |
| \`color\` | Culoarea temei, hex (\`#\` se scrie \`%23\`) | \`%234f46e5\` |

Fără parametri, widgetul folosește valorile din \`conf/widget.json\`.

---

Fișier generat automat de workflow-ul *1. Configurează widgetul facultății*. Nu îl edita manual — modificările se pierd la următoarea rulare.
`;

writeFileSync(EMBED_PATH, embed, 'utf-8');
process.stderr.write(`URL salvat: ${url}\n`);
