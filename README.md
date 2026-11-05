# OpenMLTheory Website

[![Deploy OpenMLTheory](https://github.com/knowzou/openmltheory-website/actions/workflows/deploy.yml/badge.svg)](https://github.com/knowzou/openmltheory-website/actions/workflows/deploy.yml)

This repository is the source for **[openmltheory.com](https://openmltheory.com/)**. It contains the homepage, Blog, About page, and published research articles. The site is available in English and Chinese.

## Pages

| Page | URL | Source |
| --- | --- | --- |
| Home | [openmltheory.com](https://openmltheory.com/) | [`public/index.html`](public/index.html) |
| Blog index | [/blog/](https://openmltheory.com/blog/) | [`public/blog/index.html`](public/blog/index.html) |
| About us | [/about/](https://openmltheory.com/about/) | [`public/about/index.html`](public/about/index.html) |
| MLtheorybench | [/blog/MLtheorybench](https://openmltheory.com/blog/MLtheorybench) | [`blog/MLtheorybench/`](blog/MLtheorybench/) |
| VALG | [/blog/valg](https://openmltheory.com/blog/valg) | [`blog/valg/`](blog/valg/) |

## Local development

Requires Node.js 24 and npm.

```sh
npm ci
npm run build
npm run preview
```

The preview is served at `http://127.0.0.1:4173`. Set `PORT` to use another port, for example `PORT=4174 npm run preview`. After editing source files, run `npm run build` again and refresh the browser. `npm run dev` combines the initial build and preview; it does not watch for changes.

## Repository layout

```text
public/                  Home, Blog index, About page, shared CSS and JavaScript
blog/MLtheorybench/      Chinese and English article sources and figures
blog/valg/              Chinese and English article sources and figures
scripts/build.mjs        Builds the publishable site in dist/
scripts/serve.mjs        Serves dist/ for local preview
.github/workflows/       GitHub Actions deployment workflow
wrangler.toml            Cloudflare Pages project configuration
```

The build copies `public/`, generates the two article routes, and copies assets referenced by the articles. It also generates redirects and response headers. `dist/` and `node_modules/` are local output and are not committed.

## Editing content

- Edit the homepage, Blog index, or About page in `public/`. Shared styles are in [`public/styles.css`](public/styles.css); English and Chinese interface text and language switching are in [`public/app.js`](public/app.js).
- Edit an article's Chinese `index.html` and English `index.en.html` in its folder under `blog/`. Keep article images and other linked files under that article's `assets/` directory.
- Article language switching is handled by [`public/article.js`](public/article.js). The selected language is saved in the browser and reused across the site.
- Run `npm run build` and check the affected pages in the local preview before pushing changes.

## Deployment

Pushing to `main` runs [`Deploy OpenMLTheory`](.github/workflows/deploy.yml). The workflow installs dependencies, builds `dist/`, and deploys it to the existing Cloudflare Pages project `openmltheory`, which serves openmltheory.com. It can also be started manually from the GitHub Actions tab.

The repository needs these GitHub Actions secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with permission to edit Pages in the target account |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID that owns the Pages project |

Never commit tokens or account credentials. This repository contains only the website and published article assets; research code and datasets belong in their respective project repositories.
