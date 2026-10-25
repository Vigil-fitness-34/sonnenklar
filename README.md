# Sonnenklar

Kleiner Alltagshelfer als Web-App (PWA) für iPhone, Mac und Windows. Kostenlos, ohne Konto, alle Daten bleiben auf dem Gerät.

- **Heute:** Morgen- oder Abendroutine (wechselt automatisch, Standard ab 15 Uhr), Top 3 des Tages, Essen laut Wochenplan, Wasser, Serie
- **Fokus-Modus:** Routine Schritt für Schritt mit Timer, Bildschirm bleibt an
- **Aufgaben:** Heute / Später / Erledigt plus Fokus-Block-Timer (25, 50, 90 Min)
- **Essen:** Tagebuch (kcal, Protein), Wochenplan, Rezepte mit Portionsrechner, automatische Einkaufsliste
- **Einfügen:** eigenen Ernährungsplan als Text reinkopieren (Format in der App unter Rezepte, Einfügen)
- **Widgets:** Mini-Widget (schwebendes Fenster in Chrome/Edge), iPhone-Widget über Scriptable, auf dem Mac ab Sonoma als iPhone-Widget

## Lokal starten

```bash
npx --yes http-server sonnenklar -p 5177 -c-1
```

## Update veröffentlichen

Dateien hochladen und in `sw.js` die Zahl in `CACHE` hochzählen (`sonnenklar-v1` auf `sonnenklar-v2`), sonst behalten installierte Apps die alte Version.

## Hinweise

- Daten liegen im Browser (localStorage). Umzug zwischen Geräten: Einstellungen, Exportieren / Importieren.
- iPhone: Die Home-Bildschirm-App hat einen eigenen Speicher, getrennt von Safari. Also immer über das App-Icon öffnen.
- Nährwerte der Start-Rezepte sind grobe Schätzungen.
