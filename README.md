# openmltheory-website

Source for [openmltheory.com](https://openmltheory.com/). The homepage is in `public/`; the published Chinese and English articles and their figures are in `blog/`.

To build locally with Node.js 24:

```sh
npm ci
npm run build
npm run preview
```

The build output is `dist/`. Pushing to `main` runs [the deployment workflow](.github/workflows/deploy.yml), which builds the site and uploads that output to the existing Cloudflare Pages project `openmltheory`. The workflow needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Edit `public/index.html`, `public/styles.css`, and `public/app.js` for the homepage. Edit the original Chinese and English article HTML under `blog/`, then rebuild.
