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
  const slugs = [...latest.matchAll(/data-home-guide="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(slugs.length, 6);
  assert.ok(slugs.every((slug) => revisedGuides[slug]));
  const dates = slugs.map((slug) => revisedGuides[slug].updatedAt);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.ok(slugs.includes("site-structure-before-apply"));
  assert.ok(slugs.includes("homepage-for-review"));
  assert.ok(slugs.includes("navigation-issue-fix"));
  assert.ok(slugs.includes("indexing-before-adsense"));
  assert.ok(read("index.html").includes('class="home-guide home-guide-text" data-home-guide="indexing-before-adsense"'));
});

test("internal links use real editorial changes and separate targets from arbitrary quotas", () => {
  const html = read("guides/internal-linking-guide/index.html");
  for (const marker of ['id="next-question"', 'id="actual-link-edit"', 'id="section-address"', 'id="maintenance-check"', "변경 전 생성 소스와 개정 결과를 비교한 기록", "방문자가 이 순서로 행동하거나 작업 시간이 줄었다는 통계는 확인하지 않았습니다", "관련 문서가 이동하면", "실제 URL 삭제·병합·리디렉션 규칙을 추가하지 않았습니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["관련 글 3개와 공식 자료 링크 제공", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
});

test("maintenance distinguishes real changes, observation dates and unmeasured outcomes", () => {
  const html = read("guides/evergreen-content-plan/index.html");
  for (const marker of ['id="information-types"', 'id="actual-maintenance"', 'id="dates-and-observations"', 'id="publish-check"', "5c6dc94", "0e21740", "본문을 고친 것처럼 수정일을 올리지 않습니다", "과거 측정 날짜까지 바꾸기", "자동 감시·예약·알림을 실행하는 것은 아닙니다", "모든 방문자의 캐시를 검사한 것은 아님"]) assert.ok(html.includes(marker), marker);
  for (const old of ["<h3>분기별 점검 항목</h3>", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
});

test("link and maintenance guides retain table semantics and valid cross-document fragments", () => {
  for (const slug of ["internal-linking-guide", "evergreen-content-plan"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), marker);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/guides/${slug}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${slug}: ${href}`);
    }
  }
  assert.ok(read("guides/internal-linking-guide/index.html").includes('aria-label="문서와 절을 연결하는 HTML 예시" tabindex="0"'));
});

test("the content plan routes to editorial linking and maintenance rather than adding fixed formats", () => {
  const html = read("tools/content-planner/index.html");
  for (const marker of ["주차는 조정 가능한 작업 묶음입니다", "유지·조사·재작성·병합 검토", "수정일·과거 관찰을 구분", "/guides/evergreen-content-plan/"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("2주차: 각 대표 글에 표, 예시, 수정 기록, 관련 글 링크를 추가합니다"));
  assert.ok(read("updates/index.html").includes("실제 허브 연결 변경과 배포 사례"));
});

test("topic planning uses evidence and explicit editorial decisions rather than approval quotas", () => {
  const html = read("guides/topic-selection-for-adsense/index.html");
  for (const marker of ['id="question-brief"', 'id="actual-selection"', 'id="decision-gates"', 'id="maintenance-cost"']) assert.ok(html.includes(marker), marker);
  for (const marker of ["이번 기획에서 조회하지 않았습니다", "처음부터 이 표대로 사이트를 기획했다는 과거 기록은 아닙니다", "핵심 주장을 검증할 수 없다면", "기존 글 보강·병합", "승인 확률이나 예상 수익을 매기지 않습니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["카테고리는 3~6개", "글 5개 뒤", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
});

test("draft verification distinguishes real source edits from fictional examples and performance claims", () => {
  const html = read("guides/avoid-ai-like-writing/index.html");
  for (const marker of ['id="claim-ledger"', 'id="real-editorial-case"', 'id="worked-verification"', 'id="fiction-and-disclosure"', "‘AI가 만든 문장’이라고 단정하지 않습니다", "실제 발행 문장이나 성공 기록이 아닙니다", "모델의 성능 시험이나 AI 생성 원문 판별 실험이 아닙니다", "12 ÷ 6,000 × 1,000 = 2 USD", "메타데이터", "발행을 보류합니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("AI 티가 나는 글을 줄이는 편집법"));
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("new writing guides retain accessible tables and searchable, uniquely linked sections", () => {
  const entries = JSON.parse(read("search-index.json"));
  for (const slug of ["topic-selection-for-adsense", "avoid-ai-like-writing"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), marker);
    const entry = entries.find(item => item.url === `/guides/${slug}/`);
    for (const section of revisedGuides[slug].sections) assert.ok(entry.description.includes(section.title));
    assert.ok(html.includes("공식 자료 확인일:"));
  }
});

test("writing hub routes through topic evidence and verification with an accurate revision date", () => {
  const html = read("writing/index.html");
  for (const marker of ["자료 기반 주제 선정", "AI 초안 사실 검증", "확보 자료를 정하고 초안의 사실·출처를 검증합니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("AI 문장감 줄이기"));
  assert.ok(html.includes("표 개수로 완료를 판단하지 않습니다"));
  assert.ok(!html.includes("표, 예시, 내부 링크를 추가해 깊이를 보강합니다"));
  const order = html.split('<ol class="read-order">')[1].split('</ol>')[0];
  const slugs = [...order.matchAll(/href="\/guides\/([^/]+)\//g)].map(match => match[1]);
  assert.deepEqual(slugs, ["topic-selection-for-adsense", "avoid-ai-like-writing", "approval-friendly-article-format", "internal-linking-guide"]);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find(item => item["@type"] === "WebPage").dateModified, "2026-10-27");
  assert.ok(read("updates/index.html").includes("주장별 근거 대조와 가상 사례 표시"));
});

test("wrapped search result titles retain a continuous link area", () => {
  assert.ok(read("styles.css").includes('.search-interface .search-result h2 a { display: block; }'));
  assert.ok(read("search/index.html").includes('href="/styles.css?v=20261027-writing"'));
});

test("navigation repair separates observed working paths from hypothetical failures", () => {
  const html = read("guides/navigation-issue-fix/index.html");
  for (const marker of ['id="classify-symptom"', 'id="reproduction-record"', 'id="worked-failure"', 'id="public-path-check"', "가상 고장 사례이며 실제 사이트에서 발생한 장애 기록이 아닙니다", "초점 대상 id도 site-audit", "이메일 발송·문의 응답은 시험하지 않음", "출발 URL", "공통 원본"]) assert.ok(html.includes(marker), marker);
  for (const old of ["대표 글까지 2번 안에", "카테고리로 1번 안에", "관련 글이 2~3개 이상", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
});

test("access repair labels real observations without claiming Google crawl or disabling protection", () => {
  const html = read("guides/site-down-unavailable/index.html");
  for (const marker of ['id="public-response-record"', 'id="security-evidence"', "12:47:24~27", "301 → https://alphaadsense.com/ → 200", "/__alpha-access-check-20261027__/", "www 리디렉션을 적용하지 않음", "일반 요청이며 Google 크롤러의 실제 접근 기록이나 승인 결과가 아닙니다", "cf-mitigated: challenge", "Ray ID", "HEAD 요청", "GET 요청"]) assert.ok(html.includes(marker), marker);
  for (const old of ["방화벽 규칙을 완화합니다", "보안 규칙은 신청 전 최소화합니다", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
  assert.ok(!existsSync(join(dist, "_redirects")));
});

test("navigation and access tables and code retain accessible structures and searchable sections", () => {
  const entries = JSON.parse(read("search-index.json"));
  for (const slug of ["navigation-issue-fix", "site-down-unavailable"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) {
      for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), marker);
    }
    const entry = entries.find(item => item.url === `/guides/${slug}/`);
    for (const section of revisedGuides[slug].sections) {
      assert.ok(entry.description.includes(section.title));
      assert.ok(html.includes(`id="${section.id}" tabindex="-1"`));
    }
  }
  assert.ok(read("guides/site-down-unavailable/index.html").includes('aria-label="Windows 읽기 전용 접근 확인 명령" tabindex="0"'));
});

test("rejection tool aligns nav and access evidence without broad security weakening", () => {
  const html = read("tools/rejection-diagnosis/index.html");
  for (const marker of ["실패 경로 재현과 목적지 확인", "예상·실제 목적지", "오류 계층과 실패 요청 확인", "보안 이벤트를 대조하며 보안 전체를 해제하지 않습니다", "일반 요청은 Google 접근 증거와 구분합니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("봇 접근을 막는 보안 규칙을 최소화합니다"));
  assert.ok(html.includes('<option value="unknown">원인 미확인·복합 문제</option>'));
  assert.ok(read("styles.css").includes('.tool-panel select { min-width: 0; width: 100%; max-width: 100%;'));
  assert.ok(read("updates/index.html").includes("공개 경로와 HTTP 응답의 실제 관찰"));
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
  assert.equal(Object.keys(revisedGuides).length, 20);
});

test("roadmap uses dependencies and separate deployment/account boundaries instead of a monthly threshold", () => {
  const html = read("guides/adsense-approval-roadmap/index.html");
  for (const marker of ['id="choose-start"', 'id="dependencies"', 'id="publish-boundary"', "병행", "14개를 개별 본문으로 바꿨고 20개", "Google이 보장하는 승인 경로나 고정 준비 기간이 아닙니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["30일 준비 예시", "한 달 정도의 준비 기간", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old), old);
  assert.ok(html.includes('href="/guides/seven-day-pre-apply-log-example/#actual-observations"'));
});

test("observation case labels real dates separately from hypothetical diagnosis and missing outcomes", () => {
  const html = read("guides/seven-day-pre-apply-log-example/index.html");
  for (const marker of ['id="actual-observations"', 'id="retest-triggers"', "고정 7일 대기를 요구하지 않습니다", "관찰하지 않은 나머지 날짜", "가상 상황이며 실제 장애 보고가 아닙니다", "df18381", "9c9148b", "1e661a4", "77d8df7", "자동 감시·예약·알림을 실행하지 않습니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["신청 직전 7일은 새 글을", "6~7일차", "<h2>자가 진단 표</h2>", 'src="/assets/seven-day-checklist.png"']) assert.ok(!html.includes(old), old);
  assert.ok(html.includes("한국시간 기준"));
});

test("linked hubs and tools no longer use a week as completion or automatic readiness evidence", () => {
  for (const path of ["approval-hub/index.html", "next-steps/index.html", "tools/rejection-diagnosis/index.html", "tools/content-planner/index.html"]) {
    const html = read(path);
    for (const old of ["7일 안정화 기록", "신청 전 7일 기록", "수정 기록과 7일 점검 로그", "일주일 점검표로 안정화", "4주차: 7일 점검 기록"]) assert.ok(!html.includes(old), `${path}: ${old}`);
    assert.ok(html.includes('/guides/seven-day-pre-apply-log-example/'));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
    assert.equal(graph.find((item) => item["@type"] === "WebPage").dateModified, "2026-10-27");
  }
  assert.ok(read("tools/content-planner/index.html").includes("편집 계획 예시이지 Google의 준비·대기 요건이 아닙니다"));
  assert.ok(!read("next-steps/index.html").includes("각 카테고리에 대표 글을 1개 이상"));
});

test("roadmap and observation tables retain explicit accessible relationships and dated sources", () => {
  for (const slug of ["adsense-approval-roadmap", "seven-day-pre-apply-log-example"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) {
      for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker));
    }
    assert.ok(html.includes("공식 자료 확인일:"));
  }
});

test("number guidance scopes its evidence and distinguishes search from advertising review", () => {
  const html = read("guides/minimum-content-myth/index.html");
  for (const marker of ['id="classify-claims"', 'id="number-claims"', "숫자 합격선을 확인하지 못했습니다", "호스트 파트너", "광고 심사의 콘텐츠·운영 조건은 AdSense 원문으로 따로 확인", "작업 현황이지 Google이 요구하는 글 수나 준비 완료 비율이 아닙니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("pre-review procedure replaces quotas with evidence and known unknowns", () => {
  const html = read("guides/pre-apply-checklist/index.html");
  for (const marker of ['id="evidence-states"', 'id="hold-or-review"', "Google 계정의 심사 상태 이름이 아닙니다", "나머지 22개", "계정에 로그인해 확인 버튼을 누르거나 연결값을 바꾸지 않았습니다", "검토 요청을 실행하지 않았습니다"]) assert.ok(html.includes(marker), marker);
  for (const old of ["대표 글 5개", "20분 점검", "주요 글이 검색엔진에 색인되어 있습니다", "<h2>자가 진단 표</h2>", 'src="/assets/seven-day-checklist.png"', "data-points"]) assert.ok(!html.includes(old), old);
  assert.ok(html.includes('src="/assets/review-evidence-workbench-20261027.jpg"'));
});

test("checklist entry links to one procedure and a record tool without an automatic readiness claim", () => {
  const html = read("checklist/index.html");
  for (const marker of ['href="/guides/pre-apply-checklist/"', 'href="/tools/approval-score/"', 'href="/guides/minimum-content-myth/"', "미완료·미확인", "이 페이지에서는 검토 요청을 실행하지 않습니다"]) assert.ok(html.includes(marker));
  assert.ok(!html.includes("카테고리별 대표 글이 고르게 있습니다"));
  const index = JSON.parse(read("search-index.json"));
  assert.equal(index.find((item) => item.url === "/checklist/").title, "재검토 전 점검 안내");
  assert.equal(index.find((item) => item.url === "/guides/pre-apply-checklist/").title, "재검토 전 근거 점검: 완료·미완료·미확인 구분");
});

test("evidence and numbers guides keep accessible table headings and dated source boundaries", () => {
  for (const slug of ["minimum-content-myth", "pre-apply-checklist"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) {
      for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker));
    }
    assert.ok(html.includes("공식 자료 확인일:"));
  }
});

test("structure checklist is a reproducible inspection rather than arbitrary approval thresholds", () => {
  const html = read("guides/site-structure-before-apply/index.html");
  for (const marker of ['id="task-walkthrough"', 'id="mobile-keyboard"', "정상·수정 필요·미확인", "메일 발송이나 답변 속도는 시험하지 않았습니다", "실제 주소를 가진", "프로젝트의 선택"]) assert.ok(html.includes(marker), marker);
  for (const old of ["최소 여러 개의 실제 글", "상단 메뉴는 주제를 분명히 보여 주어야", "<h2>자가 진단 표</h2>"]) assert.ok(!html.includes(old));
  assert.ok(html.includes('href="/guides/homepage-for-review/"'));
});

test("home case preserves real before and after images without claiming approval or user outcomes", () => {
  const html = read("guides/homepage-for-review/index.html");
  for (const marker of ['src="/assets/audit-home-20261027.jpg"', 'src="/assets/home-redesign-after-20261027.jpg"', 'width="1424" height="1640"', "최근 목록은 현재와 다를 수 있습니다", "방문자 실험·수익 개선·AdSense 승인 성공의 증거는 아닙니다", "기존 문서는 유지", 'id="decisions"']) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
  assert.ok(!html.includes("승인 심사에 유리한 홈 화면 구성"));
  assert.ok(read("guides/duplicate-content-cleanup/index.html").includes("두 문서를 해당 역할의 개별 본문으로 재작성"));
  const jpeg = readFileSync(join(dist, "assets/home-redesign-after-20261027.jpg"));
  assert.equal(jpeg.readUInt16BE(0), 0xffd8);
});

test("structure and home guides expose table regions and explicit row and column headings", () => {
  for (const slug of ["site-structure-before-apply", "homepage-for-review"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0);
    for (const [, table] of tables) {
      for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), `${slug}: ${marker}`);
    }
  }
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
