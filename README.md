# Contract PDF Generator (Vite + React)

Client-side form → signature → PDF download (using `pdf-lib` + `signature_pad`).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

This repo is configured for `GW-Contract`:

- `vite.config.js` sets `base: "/GW-Contract/"`
- `package.json` includes `deploy` via `gh-pages`

Deploy:

```bash
npm run deploy
```

If you fork/rename the repo, update `base` in `vite.config.js`.
