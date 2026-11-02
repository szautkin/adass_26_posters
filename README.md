# ADASS XXXVI poster browser

A static site for the posters at ADASS XXXVI in Perth, Western Australia. Text comes from the Pretalx schedule. Photographs are cropped from phone pictures of the poster boards, where we have them.

## Scripts

- `npm run dev` starts the local site.
- `npm test` checks filtering, grouping, and pagination.
- `npm run build` writes the Netlify output to `dist`.
- `npm run sync` downloads the Pretalx schedule and rewrites `src/data/posters.json`. If `src/data/photo-map.json` exists, poster photos are joined in.

## Netlify

Connect the GitHub repository `szautkin/adass_26_posters`. The build command is `npm run build` and the publish directory is `dist`. No environment variables are required. `netlify.toml` already sends every path to `index.html` so poster links keep working.

## Refreshing the schedule

Run `npm run sync` and commit `src/data/posters.json`. The production build uses that file, so a deploy does not call Pretalx.

## Photographs

Phone originals stay in `raw/photos` and are not part of the git history. `scripts/crop-posters.py` cuts each poster sheet out of the photo. `scripts/match-posters.py` lines those crops up with Pretalx and copies the chosen WebP files into `public/posters`.

The crop script can use a small macOS helper:

```sh
swiftc -O -o scripts/detect-rect scripts/detect-rect.swift
swiftc -O -o scripts/ocr scripts/ocr.swift
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/crop-posters.py
.venv/bin/python scripts/match-posters.py
npm run sync
```
