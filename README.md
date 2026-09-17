# Job Widget — Filtrare inteligentă a locurilor de muncă

**Widget de joburi pentru site-ul facultății tale, populat automat cu AI**

Acest repository este un **template**. Fiecare facultate își creează propriul repository din el, rulează o singură acțiune și primește un widget gata de încorporat pe site-ul propriu.

## Ideea proiectului

Colectăm locurile de muncă de pe [peviitor.ro](https://peviitor.ro) și, pornind de la planul de învățământ al fiecărei facultăți, determinăm cu ajutorul AI ce joburi se potrivesc studenților acelei facultăți.

## Cum funcționează

Totul pornește de la o singură acțiune, care primește **numele facultății** și **linkul către planul de învățământ**:

0. Creează repository-ul facultății în organizație, din acest template
1. Descarcă planul de învățământ (PDF-uri sau pagina HTML)
2. Deduce cu AI profilul de competențe al studentului și cuvintele cheie de căutare
3. Interoghează API-ul peviitor.ro cu acele cuvinte cheie
4. Evaluează fiecare anunț cu AI și păstrează joburile potrivite în `jobs.json`
5. Activează GitHub Pages, publică widgetul și scrie codul de integrare în `EMBED.md`

Nu există fișiere de curriculum sau de agent de întreținut manual — profilul de competențe e derivat la rulare și cache-uit în `conf/widget.json`.

### Configurare, o singură dată

Acțiunea de creare are nevoie de un secret de organizație numit `WIDGET_TOKEN`: un PAT fine-grained legat de organizație, cu acces la **All repositories** și permisiunile *Administration: write*, *Contents: write*, *Pages: write*, *Actions: write*. `GITHUB_TOKEN` nu poate crea repository-uri și nici activa Pages.

## Stack tehnologic

- **GitHub Actions** — orchestrarea întregului pipeline
- **OpenCode** — rularea modelului AI pentru extragerea profilului și matching
- **peviitor.ro API** — sursa de joburi
- **React + Vite + Tailwind** — widgetul, publicat pe GitHub Pages

## Pentru facultăți

1. Din tab-ul **Actions** al acestui repository, rulează **0. Creeaza widget pentru o facultate** cu numele universității, al facultății și linkul planului de învățământ
2. Așteaptă ~15 minute și copiază `<iframe>`-ul din `EMBED.md` al repository-ului nou

Acțiunea creează singură repository-ul facultății în organizație, activează GitHub Pages, publică widgetul și adaugă facultatea în registrul organizației. Nu trebuie să creezi repository-ul manual.

Toate facultățile cu widget activ sunt listate în [`facultati-jobs-widget`](https://github.com/peviitor-widget/facultati-jobs-widget), grupate pe universități.

Ghidul complet e în [wiki](https://github.com/peviitor-widget/jobs-widget/wiki).

## Widget încorporabil

O singură linie de cod e suficientă:

```html
<iframe
  src="https://ORGANIZATIE.github.io/REPO/#/widget"
  width="100%"
  height="650px"
  style="border: none; background: transparent;"
></iframe>
```

Fără parametri, widgetul folosește titlul și culoarea din `conf/widget.json`. Le poți suprascrie direct din URL:

| Parametru | Descriere | Exemplu |
|-----------|-----------|---------|
| `title` | Titlul afișat în widget | `Joburi pentru studenți` |
| `color` | Culoarea temei, hex (`#` se scrie `%23`) | `%234f46e5` |

## Structura repository-ului

| Cale | Rol |
|------|-----|
| `.github/workflows/create-widget.yml` | Rulat în template: creează repository-ul facultății și pornește configurarea în el |
| `.github/workflows/setup.yml` | Configurarea propriu-zisă, rulată în repository-ul facultății |
| `.github/workflows/refresh-jobs.yml` | Reîmprospătarea săptămânală a joburilor |
| `.github/workflows/deploy.yml` | Build & deploy pe GitHub Pages (reutilizabil) |
| `scripts/faculty_slug.mjs` | Numele facultății → numele repository-ului |
| `scripts/generate_jobs.mjs` | Curriculă → profil de competențe → căutare → matching → `jobs.json` |
| `scripts/set_pages_url.mjs` | Salvează URL-ul de Pages și generează `EMBED.md` |
| `scripts/register_faculty.mjs` | Adaugă facultatea în registrul organizației |
| `conf/widget.json` | Configurarea widgetului (link curriculă, titlu, culoare, URL Pages, profil cache-uit) |
| `jobs.json` | Joburile potrivite — apare după prima configurare, vezi [STRUCTURE.md](STRUCTURE.md) |
| `EMBED.md` | Codul de integrare — apare după prima configurare |
| `frontend/` | Aplicația React a widgetului |

## Actualizarea joburilor

Joburile se reîmprospătează automat în fiecare luni. Poți rula manual oricând acțiunea **2. Reimprospateaza joburile**, cu opțiunea de a reciti curricula dacă planul de învățământ s-a schimbat.

`jobs.json` e importat la build time, așa că fiecare actualizare declanșează și un redeploy.

## Articole & mențiuni

- **[Asociația Oportunități și Cariere — Cluj Hackathon 2026](https://www.linkedin.com/posts/asociatia-oportunitati-si-cariere_clujhackathon-clujhackathon2026-opensource-activity-7463907374190309376--UUN)** — Postare LinkedIn despre participarea echipei la hackathon
- **[Andreea Radu — Experiența la Cluj Hackathon 2026](https://www.linkedin.com/posts/andreea-radu-379205302_clujhackathon-techforgood-voluntariat-share-7463915729734774784-4bjC/)** — Postare LinkedIn a unei studente în practică despre echipă și misiunea asociației
- **[Carina Bancila — Mândră de echipă](https://www.linkedin.com/posts/carina-bancila_clujhackathon-clujhackathon2026-opensource-share-7463910730103365634-AzH2/)** — Postare LinkedIn a HR & OD Managerului despre implicarea echipei la hackathon

## Licență

Acest proiect este distribuit sub licența **MIT**. Vezi fișierul [LICENSE](LICENSE).

## Contribuții

Contribuțiile sunt binevenite! Vezi [CONTRIBUTING.md](CONTRIBUTING.md) și [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) pentru detalii.
