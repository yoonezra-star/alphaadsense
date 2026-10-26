# Alpha AdSense

Alpha AdSense is a Korean static information site for AdSense approval preparation, content writing, policy checks, rejection recovery, and beginner monetization planning.

## Local

```powershell
npm.cmd ci
npm.cmd run assets
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

`npm ci` installs the pinned Lucide build-time icon assets. The published tools use local JavaScript and SVG files, not a third-party CDN. Regenerating the existing bitmap assets is optional when only editing content or tools.

The content workbench remains at `/tools/approval-score/` for existing links. It stores records only in the browser. The metric calculator is embedded at `/guides/rpm-cpc-basics/#rpm-calculator` and does not persist its input.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: current LTS is fine

## Domain

The domain is `alphaadsense.com`. For Cloudflare Pages, add the domain in Cloudflare, then update the Gabia nameservers to the two nameservers Cloudflare provides.

After DNS is active, add both:

- `alphaadsense.com`
- `www.alphaadsense.com`

Then register the site in Google Search Console and submit:

- `https://alphaadsense.com/sitemap.xml`

See `DEPLOYMENT.md` for the full Gabia, GitHub, and Cloudflare Pages checklist.
