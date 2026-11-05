# OpenMLTheory website

White research homepage with a bilingual interface and research articles on MLtheorybench and VALG. The team explores collaboration between LLMs and machine learning theory toward an AI → Theory → AI research cycle. Homepage sections introduce research progress, datasets, agent research, benchmarks, and broader perspectives. This site currently publishes no problem data.

```sh
npm install
npm run dev
```

Preview: http://127.0.0.1:4173

`npm run build` creates `dist/`. It copies the bilingual articles from `../blog/MLtheorybench/` and `../blog/valg/`, along with only their referenced assets. Drafts, archives, source Markdown, problem records, and credentials are excluded.

Deploy to Cloudflare Pages:

```sh
npm run deploy
```

Project: `openmltheory`. The deployment needs a Cloudflare API token with Account → Cloudflare Pages → Edit for the target account. Supply `CLOUDFLARE_API_TOKEN` through the shell or a local secret store; never put credentials in browser JavaScript or commit them. `CLOUDFLARE_ACCOUNT_ID` may be used to select the target account.

Edit `public/index.html`, `public/styles.css`, and `public/app.js` for the homepage. The article date, names, task counts and model counts are taken from the supplied blog. Rebuild after changing the original blog.
