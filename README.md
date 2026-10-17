# Lumio – Mobile Image & Graphic Studio

Offline-first mobile image / graphic editor built with React, Vite and Tailwind CSS v4.
Independent text, shape and image layers, live effect previews, and PNG / JPG / layered PSD export.
Projects, fonts and settings are stored locally in IndexedDB – no backend, no API keys.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the dev server                      |
| `npm run build`   | Production build into `dist/`             |
| `npm run preview` | Preview the production build              |
| `npm test`        | Run the unit tests (`node:test`)          |
| `npm run lint`    | Type-check with `tsc --noEmit`            |

## Deploy

`.github/workflows/build.yml` runs the tests, builds the app and (on pushes to `main`)
deploys `dist/` to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions** once.
