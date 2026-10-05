# Mein Übersetzer

Persönliche Chrome-Erweiterung zum Übersetzen markierter Texte nach Deutsch.

## Funktionen

- Markierten Text automatisch in einer beliebigen Sprache erkennen
- Immer nach Deutsch übersetzen
- Nach erfolgreicher Übersetzung automatisch kopieren: `Text = deutsche Übersetzung`
- Dunkles, schlankes und verschiebbares Panel
- Panel-Position wird gespeichert
- Automatisches Ausblenden nach 10 Sekunden
- `Esc` schließt das Panel
- UK-Englisch wird automatisch als Englisch erkannt

## Installation

1. Repository herunterladen oder klonen
2. Ordner entpacken
3. Chrome öffnen und `chrome://extensions` aufrufen
4. Entwicklermodus aktivieren
5. Auf „Entpackte Erweiterung laden“ klicken
6. Den Ordner `mein-uebersetzer` auswählen

## Dateien

- `manifest.json` – Chrome-Erweiterungs-Konfiguration
- `background.js` – Übersetzungsanfragen
- `content.js` – Textauswahl, Panel, Position und Zwischenablage
- `panel.css` – Design des Panels

## Hinweis

Die Erweiterung nutzt derzeit einen inoffiziellen Google-Translate-Endpunkt.
Für den persönlichen Gebrauch gedacht; für eine öffentliche Veröffentlichung
sollte eine offizielle API oder die Chrome Translator API verwendet werden.
