# Contribuții

Mulțumim că vrei să contribui la acest proiect! 🎉

## Cum poți contribui

### 1. Adaugi un agent nou pentru o facultate / persoană

Vezi `INSTRUCTIONS.md` și `AGENTS.md` pentru ghidul complet.

Pe scurt:
1. Creează fișierul de profil în `filter/NUME.md` (competențele persoanei/curiculum)
2. Creează agentul în opencode
3. Rulezi scriptul de matching
4. Verifici tag-urile generate

### 2. Corectezi tag-uri existente

Dacă găsești un job greșit etichetat în `jobs.json`:
1. Fă un fork al repository-ului
2. Corectează `f_tag`-ul
3. Deschide un Pull Request

### 3. Raportezi o problemă

Deschide un [Issue](../../issues) cu:
- descrierea problemei
- cum poate fi reprodusă
- capturi de ecran (dacă e cazul)

### 4. Îmbunătățești documentația

Orice clarificare în `README.md`, `AGENTS.md`, `STRUCTURE.md` sau `INSTRUCTIONS.md` e binevenită.

## Rules

- Respectă structura existentă a fișierelor JSON
- Nu șterge câmpuri obligatorii din `jobs.json` (vezi `STRUCTURE.md`)
- Verifică întotdeauna că URL-urile returnă HTTP 200 înainte de commit
- Folosește nume sugestive pentru branch-uri (`fix/typo-jobs`, `feat/new-agent-upt`)
- Toate PR-urile trec prin code review
