import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { before, test } from "node:test";
import guide from "../content/guides/low-value-content-fix.mjs";
import revisedGuides from "../content/guides/index.mjs";
import { metricExample } from "../content/guides/rpm-cpc-basics.mjs";
import { searchDocuments } from "../public/assets/search-engine.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = resolve(root, "dist");
const revisedPath = "guides/low-value-content-fix/index.html";
const verification = "_hP9RZUOUGh31ZUx04wMj46IdWLrOwO18FopYY4hpY4";
const read = (path) => readFileSync(join(dist, path), "utf8");

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : extname(path) === ".html" ? [path] : [];
  });
}

before(() => {
  assert.equal(dirname(dist), resolve(root));
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("the inventory covers every existing guide exactly once", () => {
  const inventory = readFileSync(join(root, "docs/guide-content-inventory.md"), "utf8");
  const ids = [...inventory.matchAll(/^\| \d+ \| `([^`]+)`/gm)].map((match) => match[1]);
  const actual = readdirSync(join(dist, "guides"));
  assert.equal(ids.length, 34);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), actual.sort());
});

test("the revised guide uses its own content instead of automatic filler", () => {
  const html = read(revisedPath);
  assert.ok(html.includes(guide.intro));
  for (const section of guide.sections) assert.ok(html.includes(section.html));
  for (const legacy of [
    "이 글은 애드센스 승인을 준비하는 초보 운영자가 실제로 점검할 수 있도록 작성했습니다.",
    "먼저 현재 사이트에서 이 주제와 관련된 페이지를 모두 열어 봅니다.",
    "<h2>자가 진단 표</h2>",
    "<h2>수정 기록으로 남길 것</h2>"
  ]) assert.ok(!html.includes(legacy), `Legacy filler remained: ${legacy}`);
  assert.ok(html.includes("개선 범위:"));
  assert.ok(html.includes("가상 값"));
});

test("contents links and table semantics remain accessible", () => {
  const html = read(revisedPath);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const section of guide.sections) {
    assert.match(section.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(html.includes(`href="#${section.id}"`));
    assert.ok(html.includes(`id="${section.id}" tabindex="-1"`));
  }
  assert.ok(html.includes('aria-label="이 글의 목차"'));
  for (const match of html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)) {
    assert.ok(match[1].includes('role="region"'));
    assert.ok(match[1].includes('tabindex="0"'));
    assert.ok(match[1].includes("<caption>"));
    assert.ok(match[1].includes('scope="col"'));
    assert.ok(match[1].includes('scope="row"'));
  }
});

test("visible and structured modification dates agree without changing publication dates", () => {
  const html = read(revisedPath);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  for (const type of ["Article", "WebPage"]) {
    const item = schema["@graph"].find((entry) => entry["@type"] === type);
    assert.equal(item.dateModified, guide.updatedAt);
    assert.equal(item.datePublished, "2026-07-13");
  }
  assert.ok(html.includes(`업데이트: ${guide.updatedAt}`));
  assert.ok(html.includes(guide.reviewSummary));
});

test("an untouched guide keeps its previous modification date", () => {
  const html = read("guides/ad-placement-principles/index.html");
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema["@graph"].find((entry) => entry["@type"] === "Article").dateModified, "2026-07-13");
  assert.ok(html.includes("업데이트: 2026-07-13"));
});

test("the latest list and search index include the revised article", () => {
  const latest = read("index.html");
  assert.ok(latest.includes('data-home-guide="low-value-content-fix"'));
  assert.ok(!latest.includes('data-home-guide="adsense-approval-roadmap"'));
  const entries = JSON.parse(read("search-index.json"));
  const revised = entries.find((entry) => entry.url === "/guides/low-value-content-fix/");
  for (const section of guide.sections) assert.ok(revised.description.includes(section.title));
});

test("all pages retain verification, valid schema, local links and assets", () => {
  const files = htmlFiles(dist);
  assert.equal(files.length, 63);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    assert.ok(html.includes(verification), `Missing verification: ${file}`);
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
    for (const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      const url = new URL(match[1], "https://alphaadsense.com");
      if (url.origin !== "https://alphaadsense.com") continue;
      const path = decodeURIComponent(url.pathname);
      const target = join(dist, path, path.endsWith("/") ? "index.html" : "");
      assert.ok(existsSync(target), `Broken target ${path} in ${file}`);
    }
  }
});

test("existing guide URLs remain in the sitemap and no redirects were introduced", () => {
  const sitemap = read("sitemap.xml");
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 62);
  for (const slug of readdirSync(join(dist, "guides"))) assert.ok(sitemap.includes(`/guides/${slug}/`));
  assert.ok(!existsSync(join(dist, "_redirects")));
});

test("every revised guide has its own sections, current metadata and valid related guides", () => {
  const search = JSON.parse(read("search-index.json"));
  for (const [slug, content] of Object.entries(revisedGuides)) {
    const html = read(`guides/${slug}/index.html`);
    assert.ok(html.includes(content.intro));
    assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
    const legacy = "먼저 현재 사이트에서 이 주제와 관련된 페이지를 모두 열어 봅니다.";
    const authored = content.intro + content.sections.map((section) => section.html).join("");
    assert.equal(html.split(legacy).length - 1, authored.split(legacy).length - 1, `Unexpected automatic paragraph in ${slug}`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, slug);
    for (const section of content.sections) {
      assert.ok(html.includes(section.html));
      assert.ok(html.includes(`href="#${section.id}"`));
      assert.ok(html.includes(`id="${section.id}" tabindex="-1"`));
      assert.ok(search.find((entry) => entry.url === `/guides/${slug}/`).description.includes(section.title));
    }
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
    for (const type of ["Article", "WebPage"]) assert.equal(graph.find((item) => item["@type"] === type).dateModified, content.updatedAt);
    for (const related of content.relatedSlugs) assert.ok(existsSync(join(dist, "guides", related, "index.html")));
  }
});

test("metric examples calculate consistently and distinguish the denominators", () => {
  const html = read("guides/rpm-cpc-basics/index.html");
  const { revenue, pageviews, adImpressions, adClicks } = metricExample;
  assert.equal(revenue / pageviews * 1000, 2);
  assert.equal(revenue / adImpressions * 1000, 1);
  assert.equal(adClicks / adImpressions * 100, 0.5);
  assert.ok(html.includes("2.00 USD"));
  assert.ok(html.includes("1.00 USD"));
  assert.ok(html.includes("0.50%"));
  assert.ok(html.includes("24 ÷ 8,000 × 1,000"));
  assert.equal((12 + 12) / (6000 + 2000) * 1000, 3);
  assert.ok(html.includes("분모가 0"));
  assert.ok(html.includes("가상 데이터"));
});

test("verification and domain guides distinguish public observations from account access", () => {
  const verificationHtml = read("guides/cloudflare-search-console-example/index.html");
  assert.ok(verificationHtml.includes("점검 환경에서 TXT 레코드 데이터 없음 응답"));
  assert.ok(verificationHtml.includes("계정 인증 완료를 뜻하지 않습니다"));
  assert.ok(verificationHtml.includes("자리표시자"));
  const domainHtml = read("guides/cloudflare-gabia-domain-guide/index.html");
  for (const term of ["MX", "SPF", "DKIM", "DMARC", "DNSSEC"]) assert.ok(domainHtml.includes(term));
  assert.ok(domainHtml.includes("실제 계정 설정을 변경하지는 않았습니다"));
});

test("the editing case distinguishes real changes from approval claims", () => {
  const html = read("guides/approval-friendly-article-format/index.html");
  for (const term of ["개정 전", "편집 판단", "정의의 정확성", "검증 기록", "실제 수익"]) assert.ok(html.includes(term));
  assert.ok(html.includes('href="/guides/rpm-cpc-basics/#worked-calculation"'));
  assert.ok(html.includes("승인 성공 사례는 아닙니다"));
});

test("the structure audit separates its original snapshot from follow-up changes", () => {
  const html = read("guides/site-structure-audit-example/index.html");
  assert.ok(html.includes("문서를 개정하기 전 시점의 기록"));
  assert.ok(html.includes("200 응답"));
  assert.ok(html.includes("공통 푸터를 바꾸지 않았습니다"));
  assert.ok(html.includes('id="follow-up-navigation"'));
  assert.ok(html.includes("나머지 28개"));
  assert.ok(html.includes("계정 내부의 심사·색인·방문 통계"));
  assert.ok(html.includes('src="/assets/audit-home-20261027.jpg"'));
  assert.ok(html.includes('width="1425" height="976"'));
  const jpeg = readFileSync(join(dist, "assets/audit-home-20261027.jpg"));
  assert.equal(jpeg.readUInt16BE(0), 0xffd8);
});

test("newly revised documents lead the latest list by their real modification dates", () => {
  const latest = read("index.html").split('<div class="home-guide-list">')[1];
  assert.ok(latest.indexOf("/guides/approval-friendly-article-format/") < latest.indexOf("/guides/low-value-content-fix/"));
  assert.ok(latest.indexOf("/guides/site-structure-audit-example/") < latest.indexOf("/guides/low-value-content-fix/"));
  const slugs = [...latest.matchAll(/data-home-guide="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(slugs.length, 6);
  assert.ok(slugs.every((slug) => revisedGuides[slug]));
  assert.ok(slugs.includes("duplicate-content-cleanup"));
  assert.ok(slugs.includes("indexing-before-adsense"));
  assert.ok(read("index.html").includes('class="home-guide home-guide-text" data-home-guide="indexing-before-adsense"'));
});

test("duplicate cleanup separates editorial decisions from unapplied URL moves", () => {
  const html = read("guides/duplicate-content-cleanup/index.html");
  for (const marker of ["공통 화면 요소", "고유한 답", "실제 URL 병합·삭제·리디렉션 추가는 하지 않았습니다", "미적용 예시", "Functions", "Location", "기본값은 302"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
  assert.ok(!existsSync(join(dist, "_redirects")));
});

test("indexing guidance separates account data, public access and hypothetical outcomes", () => {
  const html = read("guides/indexing-before-adsense/index.html");
  for (const marker of ["실시간 검사", "개정 전 공개 HTTPS 응답", "계정 결과를 확인하거나 색인 요청을 실행하지 않았습니다", "가상 사례", "Google-Extended", "Mediapartners-Google", "반복 제출이 크롤링을 더 빠르게 하지는 않습니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["신청 준비 신호", "대표 글 10개 중 대부분", "신청 타이밍을 판단"]) assert.ok(!html.includes(old));
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("both new guides have accessible tables and publish no active redirect or robots rules", () => {
  for (const slug of ["duplicate-content-cleanup", "indexing-before-adsense"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length >= 3);
    for (const [, table] of tables) {
      for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker));
    }
    assert.ok(html.includes(`<link rel="canonical" href="https://alphaadsense.com/guides/${slug}/"`));
    assert.ok(!/<meta name="robots"[^>]*content="noindex/.test(html));
  }
  assert.equal(Object.keys(revisedGuides).length, 8);
});

test("every page exposes direct trust navigation and a working search entry", () => {
  for (const file of htmlFiles(dist)) {
    const html = readFileSync(file, "utf8");
    const footer = html.split('aria-label="운영 및 정책"')[1].split("</nav>")[0];
    assert.ok(footer.includes('href="/about/"'));
    assert.ok(footer.includes('href="/contact/"'));
    assert.ok(html.includes('href="/search/"'));
    assert.ok(html.includes('<main id="content" tabindex="-1">'));
  }
  assert.ok(read("about/index.html").includes('href="/about/" aria-current="page"'));
  assert.ok(read("search/index.html").includes('href="/search/" aria-current="page"'));
});

test("search ranks the real verification document first and exposes fallbacks", () => {
  const items = JSON.parse(read("search-index.json"));
  assert.equal(searchDocuments(items, "인증")[0].url, "/guides/cloudflare-search-console-example/");
  const html = read("search/index.html");
  for (const marker of ['id="search-error"', 'id="search-retry"', 'aria-busy="true"', 'aria-label="검색 결과 페이지"', '<noscript>', 'src="/assets/site-search.mjs"']) assert.ok(html.includes(marker));
  assert.ok(!readFileSync(join(root, "public/assets/site-search.mjs"), "utf8").includes("innerHTML"));
});

test("score page is replaced by a privacy-disclosed workbench with safe initial controls", () => {
  const html = read("tools/approval-score/index.html");
  for (const old of ["data-points", "85점 이상", 'id="score-tool"']) assert.ok(!html.includes(old));
  assert.ok(html.includes('id="audit-fields" aria-label="점검 항목 입력" disabled'));
  assert.ok(html.includes('src="/assets/content-audit.mjs"'));
  assert.ok(html.includes("URL의 본문을 자동으로 읽거나"));
  assert.ok(html.includes('href="/privacy/#local-tools"'));
  assert.ok(read("privacy/index.html").includes('id="local-tools"'));
  assert.ok(read("guides/rpm-cpc-basics/index.html").includes('id="rpm-calculator"'));
});
