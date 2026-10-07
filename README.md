# Futureway Workshop Repository Template

Dieses Repository ist das technologie- und KI-anbieterunabhängige Master-Template für einen geführten Futureway-Workshop. Die konkrete Projektidee wird erst nach dem Klonen in einem daraus erzeugten Teilnehmer-Repository definiert.

Coding-Agenten müssen vor jeder Änderung die Workshop-Dateien lesen. Projektplanung, Fortschritt und wichtige Entscheidungen werden zentral im Repository dokumentiert, damit jederzeit zwischen kompatiblen Coding-Agenten gewechselt werden kann. Eine vorherige Chat-Historie ist nicht erforderlich.

## Für Coding-Agenten

- Codex: Lies zuerst `AGENTS.md`.
- Claude Code: Lies zuerst `CLAUDE.md`.
- Andere Coding-Agenten: Lies zuerst `.agents/generic/INSTRUCTIONS.md`.

Danach gelten für alle Agenten dieselben autoritativen Dateien unter `.workshop/`.

## Verwendung

Dieses Repository wird als Master-Template gepflegt. Erst in einem abgeleiteten Teilnehmer-Repository werden Projektidee, Workshop-Typ, Technologie, Starter-Code und projektspezifische Rahmenbedingungen festgelegt.

## Workshop Repository Standard v1.1

Der Standard trennt den zentralen Projektzustand unter `.workshop/` von den schlanken, tool-spezifischen Adaptern. Roadmap, Task-Verifikation und abgeleiteter Fortschritt bleiben dadurch auch bei einem Agentenwechsel nachvollziehbar. Das Dashboard arbeitet mit dem synchronisierten Repository-Stand; lokale, noch nicht synchronisierte Änderungen sind dort nicht automatisch sichtbar.

Dieses Master-Template wird später in konkrete Workshop-Repositories abgeleitet. Workshop-Typ, Technologien, Starter-Code, Setup, technische Constraints, Quality Gate und erlaubte Tools oder Libraries werden dort primär unter `.workshop/specialization/` ergänzt. Der zentrale Workflow in `.workshop/AGENT_PROTOCOL.md` bleibt davon unabhängig und darf durch die Spezialisierung nicht überschrieben werden.

## Erwarteter Erststart

Wenn ein frisch erzeugtes Teilnehmerrepository noch nicht initialisiert ist und der Nutzer beispielsweise `starte` eingibt, lautet die erwartete Agent-Antwort: `Was möchtest du entwickeln?`

Danach wartet der Agent auf die Projektidee.

## Entwicklung (Website Stephan Graf Bentzel-Sturmfeder)

Stack: Vite, React, TypeScript (strict), Tailwind, React Router, react-i18next, Jost lokal über `@fontsource/jost`. Alle UI-Texte stehen in `src/i18n/de.json`.

```bash
npm install          # Abhängigkeiten installieren
npm run dev          # Dev-Server
npm run build        # Typprüfung und Produktions-Build
npm run lint         # Linting (oxlint)
npm run typecheck    # TypeScript-Prüfung
npm run format       # Prettier auf src/
```

Hinweis: Enthält der Ordnerpfad Doppelpunkte (z. B. `Kunst 2024:25:26`), finden `npm run`-Skripte ihre Programme nicht, weil `:` den PATH trennt. Dann die Programme direkt aufrufen, z. B. `node_modules/.bin/tsc -b`, `node_modules/.bin/oxlint`, `node node_modules/vite/bin/vite.js`. Besser: das Projekt in einen Ordner ohne Doppelpunkte verschieben.

Struktur: `src/components`, `src/pages`, `src/data` (Platzhalterdaten bis Phase 2), `src/i18n`, `src/styles`.
