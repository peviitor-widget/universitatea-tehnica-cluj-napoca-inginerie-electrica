# Structura fișierelor de date

Repository-ul are două fișiere de date, ambele scrise de acțiunile din `.github/workflows/`. Nu le edita manual — modificările se pierd la următoarea rulare.

- [`jobs.json`](#jobsjson) — joburile potrivite, consumate de widget. **Nu există în template**: apare la prima rulare a acțiunii de configurare
- [`conf/widget.json`](#confwidgetjson) — configurarea widgetului și profilul de competențe. Există în template, cu valori goale

---

## `jobs.json`

Array JSON cu joburile pe care AI-ul le-a considerat potrivite pentru studenții facultății. Fiecare obiect e un anunț agregat din API-ul peviitor.ro, îmbogățit cu rezultatul evaluării.

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `url` | `string[]` | da | Link-ul către anunțul original (array cu un singur element) |
| `title` | `string` | da | Titlul postului |
| `company` | `string` | da | Numele companiei angajatoare |
| `location` | `string[]` | da | Lista de orașe/locații |
| `salary` | `string[]` | nu | Salariul exprimat ca string (ex: `"4000-6000 RON"`) |
| `date` | `string` (ISO 8601) | nu | Data publicării anunțului |
| `status` | `string` | da | Starea anunțului (ex: `"activ"`, `"published"`) |
| `_version_` | `number` | nu | Identificatorul intern din API-ul peviitor; widgetul îl folosește ca cheie de listă |
| `_root_` | `string` | nu | URL-ul de aplicare; widgetul îl preferă în locul lui `url` |
| `tags` | `string[]` | da | Competențele care au dus la potrivire — vezi mai jos |
| `matchPercentage` | `number` | da | Scorul de potrivire (0-100) dat de AI |
| `reason` | `string` | da | Explicația AI-ului pentru potrivire |

### Exemplu

```json
{
  "url": ["https://www.bestjobs.eu/loc-de-munca/..."],
  "title": "Internship Insurance Officer",
  "company": "TOYOTA STAR SRL",
  "location": ["Voluntari, Romania"],
  "salary": ["de la 785 până la 865 EUR/lună"],
  "date": "2026-05-14T00:00:00Z",
  "status": "activ",
  "_version_": 1834729384729,
  "_root_": "https://www.bestjobs.eu/loc-de-munca/...",
  "tags": ["Comunicare", "Negociere"],
  "matchPercentage": 55,
  "reason": "Rol implică interacțiune cu clienți, comunicare și negociere — skill-uri din aria mea."
}
```

### Câmpul `tags`

Maximum 2 competențe scurte, alese de AI din profilul studentului, care au determinat potrivirea. Widgetul le afișează ca badge-uri pe cardul jobului.

Sunt specifice fiecărui job, nu facultății: două anunțuri din același repository pot avea `tags` complet diferite. Dacă AI-ul nu identifică nicio competență clară, array-ul rămâne gol și cardul se afișează fără badge-uri.

> **Notă pentru versiunile vechi:** câmpul `f_tag` (tag-ul unic al facultății, ex: `UBBFPSE`) nu mai există. Fiecare facultate are propriul repository cu propriul `jobs.json`, deci nu mai e nevoie de un tag care să separe joburile între facultăți.

---

## `conf/widget.json`

Starea widgetului: ce s-a configurat, unde e publicat și profilul de competențe cache-uit.

| Câmp | Tip | Descriere |
|------|-----|-----------|
| `university` | `string` | Numele universității; determină în ce fișier ajunge facultatea în registrul organizației |
| `faculty` | `string` | Numele facultății, dat ca input sau dedus din curriculă |
| `curriculumUrl` | `string` | Linkul planului de învățământ; sursa întregului pipeline |
| `title` | `string` | Titlul implicit afișat în widget |
| `color` | `string` | Culoarea implicită a temei, hex |
| `pagesUrl` | `string` | URL-ul public de GitHub Pages, completat după primul deploy |
| `profile` | `object \| null` | Profilul de competențe derivat din curriculă |
| `updatedAt` | `string` (ISO 8601) | Când au fost generate ultima dată joburile |

### Câmpul `profile`

```json
{
  "faculty": "Facultatea de Matematică și Informatică, UBB",
  "domains": ["IT", "Analiză de date"],
  "skills": ["Programare orientată pe obiecte", "Baze de date", "..."],
  "keywords": ["junior developer", "internship", "data analyst", "..."],
  "sourceUrl": "https://..."
}
```

- `domains` și `skills` formează promptul cu care AI-ul evaluează fiecare anunț
- `keywords` sunt interogările trimise către API-ul peviitor.ro
- `sourceUrl` reține curricula din care a fost derivat profilul

Profilul se regenerează doar dacă lipsește, dacă `curriculumUrl` s-a schimbat față de `sourceUrl`, sau dacă se rulează acțiunea de refresh cu opțiunea **reface_profil**. Altfel e refolosit, ca să nu recitim curricula la fiecare actualizare de joburi.

---

## Generare

Ambele fișiere sunt scrise de [`scripts/generate_jobs.mjs`](scripts/generate_jobs.mjs), care:

1. Citește `conf/widget.json` și îl completează cu argumentele primite din workflow
2. Descarcă planul de învățământ de la `curriculumUrl` (PDF-uri via `pdftotext`, altfel textul paginii HTML)
3. Derivă profilul de competențe printr-un singur apel opencode
4. Interoghează `https://api.peviitor.ro/v1/search/` cu fiecare keyword și deduplică rezultatele
5. Citește descrierile anunțurilor și le evaluează în batch-uri de 25, până la 30 de joburi potrivite
6. Scrie `jobs.json` și actualizează `conf/widget.json`

Câmpul `pagesUrl` e completat separat de [`scripts/set_pages_url.mjs`](scripts/set_pages_url.mjs), care generează și `EMBED.md`.

---

## Registrul organizației

Separat de repository-ul fiecărei facultăți, organizația are un repository `facultati-jobs-widget` cu toate facultățile care au widget:

```
facultati-jobs-widget/
├── README.md                              (generat — index de universități)
├── registry.json                          (sursa de adevăr)
└── universitati/
    └── universitatea-babes-bolyai.md      (generat — facultățile universității)
```

Fișierele markdown sunt regenerate integral din `registry.json` la fiecare scriere, deci actualizarea unei intrări nu depinde de parsarea unui tabel scris de mână. Numele fișierului vine din numele universității, fără diacritice — `Universitatea Babeș-Bolyai` → `universitatea-babes-bolyai.md`.

Fiecare facultate e scrisă de două ori de [`scripts/register_faculty.mjs`](scripts/register_faculty.mjs):

1. la crearea repository-ului, cu status `în configurare`
2. la finalul configurării, cu linkul live al widgetului și status `activ`

Identitatea unei intrări e `repo`, nu numele — redenumirea facultății actualizează rândul existent în loc să adauge unul nou. Scrierile concurente sunt rezolvate prin reîncercare: dacă push-ul e respins, se reia clonarea și upsert-ul peste versiunea proaspătă.
