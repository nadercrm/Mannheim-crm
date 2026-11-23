# EENS ONE – Relaunch eensmusic.com

Neue Startseite für eensmusic.com: dunkel, Schwarz/Silber/Weiß, Hero-Video (La Familia, Yacht mit EENS-Flagge),
Video-Band (Trade It All), Scroll-Reveals, sanfte Parallax, Hover auf Covern. Keine externen Skripte, keine Tracker.

## Aufbau
- `src/` – `index.html`, `site.css`, `site.js` (Platzhalter `__V__` = Cache-Version, `__SHOP__` = Shop-URL)
- `worker/worker.js` – Cloudflare Worker. Liefert `/`, `/c/...`, `/assets/*`, `/media/*` aus KV (`MEDIA`);
  alles andere (Impressum, Datenschutz, Fonts, Inner-Circle-API, Sitemap) geht unverändert an `eens-next` (`LEGACY`).
- `scripts/build-media.sh <quellordner>` – rendert Videos (WebM + MP4, stumm, Loop) und Poster/Bilder nach `dist/media`.
- `scripts/build-site.sh` – setzt Version und Shop-URL ein → `dist/site`.

## Betrieb
- **Live:** Worker `eens-relaunch` auf eensmusic.com (seit 18.11.2026).
- **Vorschau:** Worker `eens-relaunch-preview` → https://eens-relaunch-preview.nader-pahlavikhah.workers.dev (noindex).
  Achtung: Vorschau und Live lesen denselben KV-Namespace (`eens-next-video-assets`).
- **Rückfall:** In Cloudflare unter Workers → Domains `eensmusic.com` wieder auf `eens-next` stellen. `eens-next` ist unverändert.
- **Upload:** Der Upload-Endpunkt ist nur aktiv, wenn der Worker ein Secret `UPLOAD_TOKEN` hat (derzeit entfernt).
- CSS/JS liegen versioniert unter `/assets/site.<version>.css|js` (unveränderlich gecacht).

## Regeln (nicht kaputt machen)
- Videos nur Desktop, nie bei `prefers-reduced-motion` oder Datensparmodus; Mobil zeigt das Poster.
- Spotify-Player nur nach Klick (Zwei-Klick), sonst direkte Links.
- Fonts selbst gehostet (`/fonts/…`), keine Google Fonts.
- Impressum, Datenschutz, KI-Transparenz im Footer; KI-Hinweis sichtbar.
- Logo nur silbern, niemals Gold.
