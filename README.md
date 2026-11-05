# openmltheory-website

Source for [openmltheory.com](https://openmltheory.com/). The homepage is in `website/public/`; the published Chinese and English articles and their figures are in `blog/`.

To build locally with Node.js 24:

```sh
cd website
npm ci
npm run build
npm run preview
```

The build output is `website/dist/`. Pushing to `main` runs [the deployment workflow](.github/workflows/deploy.yml), which builds the site and uploads that output to the existing Cloudflare Pages project `openmltheory`. The workflow needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
