# EENS ONE – Relaunch eensmusic.com

Neue Startseite für eensmusic.com: dunkel, Schwarz/Silber/Weiß, Hero-Video (La Familia, Yacht mit EENS-Flagge),
Video-Band (Trade It All), Scroll-Reveals, sanfte Parallax, Hover auf Covern. Keine externen Skripte, keine Tracker.

## Aufbau
- `src/` – `index.html`, `site.css`, `site.js` (Platzhalter `__V__` = Cache-Version, `__SHOP__` = Shop-URL)
- `worker/worker.js` – Cloudflare Worker. Liefert `/`, `/c/...`, `/assets/*`, `/media/*` aus KV (`MEDIA`);
  alles andere (Impressum, Datenschutz, Fonts, Inner-Circle-API, Sitemap) geht unverändert an `eens-next` (`LEGACY`).
- `scripts/build-media.sh <quellordner>` – rendert Videos (WebM + MP4, stumm, Loop) und Poster/Bilder nach `dist/media`.
- `scripts/build-site.sh` – setzt Version und Shop-URL ein → `dist/site`.

## Vorschau
Worker `eens-relaunch-preview` → https://eens-relaunch-preview.nader-pahlavikhah.workers.dev (noindex).
Live (`eens-next` auf eensmusic.com) ist unverändert.

## Regeln (nicht kaputt machen)
- Videos nur Desktop, nie bei `prefers-reduced-motion` oder Datensparmodus; Mobil zeigt das Poster.
- Spotify-Player nur nach Klick (Zwei-Klick), sonst direkte Links.
- Fonts selbst gehostet (`/fonts/…`), keine Google Fonts.
- Impressum, Datenschutz, KI-Transparenz im Footer; KI-Hinweis sichtbar.
- Logo nur silbern, niemals Gold.
