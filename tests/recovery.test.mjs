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
  const html = read("guides/domain-and-trust/index.html");
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

test("post-approval guide separates account states, consent, previews and hypothetical outcomes", () => {
  const html = read("guides/after-approval-first-settings/index.html");
  for (const marker of ['id="status-boundaries"', 'id="consent-and-implementation"', 'id="preview-and-apply"', 'id="hypothetical-change"', "현재 계정 화면 보고서가 아닙니다", "광고 코드도 추가하지 않았습니다", "EEA·영국·스위스", "모든 개인정보 법률 준수를 인증해 주는 것은 아닙니다", "실제 광고가 게재되거나 정책 위반이 발생했다는 보고가 아닙니다", "미리보기와 저장·실제 공개 적용을 구분"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("첫 주에는 광고 수익보다"));
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("placement guide uses noninteractive conceptual examples without activating advertisements", () => {
  const html = read("guides/ad-placement-principles/index.html");
  const diagram = html.match(/<figure class="placement-diagram">([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(diagram);
  assert.ok(!/<(?:a|button|input|select|iframe|ins)\b/.test(diagram));
  assert.ok(!/adsbygoogle|ca-pub-|data-ad-slot=|<iframe/.test(html));
  for (const marker of ['id="policy-risks"', 'id="layout-examples"', 'id="tool-surface-case"', 'id="interaction-check"', "오른쪽 구성도 정책 통과나 안전을 인증하는 예시는 아닙니다", "이 도구에 광고를 추가하거나 광고 인접 배치를 실험한 기록은 아닙니다"]) {
    assert.ok(html.includes(marker), marker);
  }
  assert.ok(html.includes("광고는 테스트 목적으로 클릭하지 않습니다"));
});

test("ad guidance retains table semantics, current dates and cross-document fragments", () => {
  for (const slug of ["after-approval-first-settings", "ad-placement-principles"]) {
    const html = read(`guides/${slug}/index.html`);
    for (const [, table] of html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker));
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/guides/${slug}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${slug}: ${href}`);
    }
    assert.ok(html.includes("공식 자료 확인일:"));
  }
});

test("monetization hub follows status, placement and comparable metrics rather than pre-apply stages", () => {
  const html = read("monetization/index.html");
  const order = html.split('<ol class="read-order">')[1].split('</ol>')[0];
  assert.deepEqual([...order.matchAll(/href="\/guides\/([^/]+)\//g)].map(match => match[1]), ["after-approval-first-settings", "ad-placement-principles", "rpm-cpc-basics", "traffic-quality"]);
  for (const marker of ["승인 후 상태·설정 확인", "광고 배치 검사", "지표 비교 조건", "광고를 클릭하지 않고 본문·도구·모바일 이용을 검사"]) assert.ok(html.includes(marker), marker);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find(item => item["@type"] === "WebPage").dateModified, "2026-10-27");
  assert.ok(read("updates/index.html").includes("실제 광고가 아닌 가상 배치도"));
});

test("traffic review distinguishes observations from invalidity and account outcomes", () => {
  const html = read("guides/traffic-quality/index.html");
  for (const marker of ['id="distinguish-signals"', 'id="hypothetical-comparison"', 'id="targeted-response"', 'id="account-notice"', "검색·SNS·직접 방문·유료 홍보라는 유입 경로 이름만으로", "설명용 가상 데이터", "10,000", "1,000", "0.5%", "1.5%", "광고를 직접 눌러 목적지를 확인하는 시험도 하지 않습니다", "특정 일수 뒤 반드시 해제", "자동 감시·유입 수집·차단·광고 클릭·계정 제출을 실행하지 않습니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("검색 유입은 느리지만 장기적으로 가장 안정적인 기반"));
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("content policy review distinguishes restrictions and rejects review-only concealment", () => {
  const html = read("guides/prohibited-content-check/index.html");
  for (const marker of ['id="policy-classes"', 'id="page-context"', 'id="hypothetical-cases"', 'id="before-and-after-review"', "출처를 적는 것과 사용 허락은 다릅니다", "작은 면책으로 유지하지 않음", "심사 기간에만 문제 내용을 숨기거나 승인 뒤 원래 상태로 되돌릴 계획은 실질적인 개선이 아닙니다", "실제 위반 사례·승인 성공 기록이 아닙니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("신청 이후 별도 검토 대상으로 미루는 것이 안전합니다"));
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("traffic and policy tables and fragments remain accessible and valid", () => {
  for (const slug of ["traffic-quality", "prohibited-content-check"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length >= 2);
    for (const [, table] of tables) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), `${slug}: ${marker}`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/guides/${slug}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${slug}: ${href}`);
    }
    assert.ok(html.includes("공식 자료 확인일:"));
    assert.ok(!/adsbygoogle|ca-pub-|data-ad-slot=|<iframe/.test(html));
  }
});

test("policy hub and diagnosis use evidence-based classification without disclaimer workarounds", () => {
  const html = read("policy/index.html");
  const order = html.split('<ol class="read-order">')[1].split('</ol>')[0];
  assert.deepEqual([...order.matchAll(/href="\/guides\/([^/]+)\//g)].map(match => match[1]), ["prohibited-content-check", "privacy-policy-for-adsense", "cookie-notice-basics", "disclaimer-page-guide"]);
  for (const marker of ["문서의 존재나 면책 문구만으로 준수가 인증되지는 않습니다", "실제 처리", "동의 조건", 'href="/guides/prohibited-content-check/#policy-classes"']) assert.ok(html.includes(marker), marker);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find(item => item["@type"] === "WebPage").dateModified, "2026-10-27");
  const diagnosis = read("tools/rejection-diagnosis/index.html");
  assert.ok(diagnosis.includes("위반·광고 제한·미확인을 근거로 구분"));
  assert.ok(diagnosis.includes("공식 조항·확인일과 계정 안내 유형"));
  assert.ok(!diagnosis.includes("면책 고지 기준으로 낮춥니다"));
  assert.ok(read("updates/index.html").includes("승인 때만 숨기는 안내를 제거"));
});

test("privacy guidance documents real storage and request boundaries without a complete-audit claim", () => {
  const html = read("guides/privacy-policy-for-adsense/index.html");
  for (const marker of ['id="processing-inventory"', 'id="observed-and-unknown"', 'id="deletion-boundaries"', 'id="remaining-operator-checks"', "alphaadsense.content-audit.v1", "모두 200 응답", "이 세 응답에는 Set-Cookie 헤더가 없었고", "모든 페이지·지역·시간·상태에서 쿠키나 로그가 없다는 증거가 아닙니다", "브라우저 저장 삭제로 메일함·서버 로그까지 삭제되지 않음", "실제 문의 보관 기간·삭제 기준"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("cookie guidance separates notice, consent, NPA and unimplemented rollout tests", () => {
  const html = read("guides/cookie-notice-basics/index.html");
  for (const marker of ['id="four-separate-actions"', 'id="google-consent-conditions"', 'id="consent-test-paths"', 'id="hypothetical-rollout"', "법적으로 요구되는 경우", "개인 맞춤이 아닌 광고도", "법률 준수를 인증하는 것은 아닙니다", "광고 도입 시 수행할 검사 계획이며 이번 실행 결과가 아닙니다", "작동하지 않는 ‘모두 거부’나 ‘동의 완료’ 버튼을 만들지 않았습니다", "실제 광고를 눌러 시험하지 않습니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
  assert.ok(!/adsbygoogle|ca-pub-|data-ad-slot=|<iframe/.test(html));
});

test("privacy and cookie documents retain accessible tables and valid cross-page targets", () => {
  for (const path of ["guides/privacy-policy-for-adsense", "guides/cookie-notice-basics", "privacy", "cookie-policy"]) {
    const html = read(`${path}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0, path);
    for (const [, table] of tables) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), `${path}: ${marker}`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/${path}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${path}: ${href}`);
    }
  }
});

test("published notices and search disclose actual data paths without fake consent controls", () => {
  const privacy = read("privacy/index.html");
  const cookie = read("cookie-policy/index.html");
  const search = read("search/index.html");
  for (const marker of ['id="search-requests" tabindex="-1"', 'id="local-tools" tabindex="-1"', "검색어가 요청 URL에 포함될 수 있습니다", "Cloudflare 계정의 활성 보안·분석 기능", "도구가 고정 자동 만료일을 설정하지는 않습니다"]) assert.ok(privacy.includes(marker), marker);
  for (const marker of ['id="advertising-consent" tabindex="-1"', "현재 이 사이트가 별도 광고 동의·철회 기능을 제공한다고 표시하지 않습니다", "동의를 수집했거나 필요한 요청 제어를 구현했다는 뜻이 아닙니다"]) assert.ok(cookie.includes(marker), marker);
  assert.ok(search.includes('href="/privacy/#search-requests"'));
  assert.ok(search.includes("검색어는 주소·방문 기록에 남습니다"));
  assert.ok(read("styles.css").includes(".article > h2[id] { scroll-margin-top: 150px; }"));
  assert.ok(read("styles.css").includes(".article > h2[id], .metric-tool, .workbench { scroll-margin-top: 180px; }"));
  assert.ok(privacy.includes("문의 이메일의 구체적인 보관 기한과 정기 삭제 기준은 미정입니다"));
  assert.ok(read("guides/privacy-policy-for-adsense/index.html").includes("문의 이메일의 보관·삭제 기준이 아직 미정이라고 답했습니다"));
  const hub = read("policy/index.html");
  assert.ok(hub.includes('href="/guides/privacy-policy-for-adsense/#processing-inventory"'));
  assert.ok(hub.includes('href="/guides/cookie-notice-basics/#consent-test-paths"'));
  assert.ok(read("updates/index.html").includes("검색에 민감정보 주의 안내를 추가"));
});

test("disclaimer guidance separates narrow explanation from correcting underlying problems", () => {
  const html = read("guides/disclaimer-page-guide/index.html");
  for (const marker of ['id="limits-not-a-fix"', 'id="scope-next-to-evidence"', 'id="hypothetical-rewrites"', 'id="correction-and-open-work"', "잘못된 본문을 고치는 작업의 대체물이 아닙니다", "설명용 가정이며 실제 고객 사례가 아닙니다", "법적 면책 효력이나 계약의 유효성을 판단하는 법률 자문이 아닙니다", "문의 이메일의 보관·삭제 기준은 운영자 확인상 아직 미정"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("policy case records actual prior wording, decisions, screenshot and unresolved operations", () => {
  const html = read("guides/privacy-cookie-page-example/index.html");
  for (const marker of ['id="before-source"', 'id="actual-edit-decisions"', 'id="published-evidence"', 'id="open-operational-work"', "문의 내용은 처리 목적이 달성된 뒤 불필요하게 장기간 보관하지 않습니다", "개정 직전 쿠키 정책의 실제 도입", "확인되지 않은 기준이 이미 정해진 것처럼", "보관 정책이 완성됐다는 것은 다릅니다", "기존 URL을 삭제·병합하지 않았습니다", 'src="/assets/privacy-notice-case-after-20261027.jpg"', 'width="860" height="950"', "이후 본문은 달라질 수 있으며 적법성·동의 수집·승인 결과를 인증하는 화면은 아닙니다"]) assert.ok(html.includes(marker), marker);
  assert.equal(readFileSync(join(dist, "assets/privacy-notice-case-after-20261027.jpg")).readUInt16BE(0), 0xffd8);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
  assert.ok(!html.includes("승인 관점의 의미"));
});

test("disclaimer and policy case tables and cross-document destinations are valid", () => {
  for (const slug of ["disclaimer-page-guide", "privacy-cookie-page-example"]) {
    const html = read(`guides/${slug}/index.html`);
    const tables = [...html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)];
    assert.ok(tables.length > 0, slug);
    for (const [, table] of tables) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker), `${slug}: ${marker}`);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/guides/${slug}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${slug}: ${href}`);
    }
    assert.ok(!/adsbygoogle|ca-pub-|data-ad-slot=|<iframe/.test(html));
  }
});

test("published disclaimer and terms distinguish correction, viewing and consent", () => {
  const html = read("disclaimer/index.html");
  for (const marker of ['id="evidence-types" tabindex="-1"', 'id="correction-route" tabindex="-1"', "자체 요약·연결 설명에 오류가 발견되면 검토·정정 대상", "작업표의 ‘확인 완료’는 사용자가 근거·확인일을 기록한 상태", "보관·삭제 기준은 현재 미정", "일괄 배제하거나 개인정보·권리·정책 문제를 해결했다고 주장하지 않습니다"]) assert.ok(html.includes(marker), marker);
  const terms = read("terms/index.html");
  assert.ok(terms.includes("사이트 방문이나 문서 열람을 별도로 필요한 개인정보·쿠키 동의를 받은 것으로 취급하지 않습니다"));
  assert.ok(!terms.includes("내용을 확인한 것으로 봅니다"));
  const graph = JSON.parse(terms.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find(item => item["@type"] === "WebPage").dateModified, "2026-10-27");
  assert.ok(read("approval-hub/index.html").includes("정책 페이지 실제 사례"));
  assert.ok(read("updates/index.html").includes("공통 면책과 열람·동의의 차이"));
});

test("calendar separates hypothetical time budgets from production and approval outcomes", () => {
  const html = read("guides/content-calendar-30-days/index.html");
  for (const marker of ['id="worked-budget"', 'id="editable-plan"', "6 × 4 − 4 = 20시간", "작업 합계는 24시간으로 4시간 초과", "실측 생산성·승인 성공 기록이 아닙니다", "실제 소요 시간을 자동 예측하지 않습니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("glossary distinguishes units, denominators and search from approval", () => {
  const html = read("guides/glossary-for-beginners/index.html");
  for (const marker of ['id="counts-and-units"', 'id="metrics"', 'id="worked-numbers"', 'id="search-terms"', "페이지 CTR", "0.5%", "크롤링됐다고 항상 색인되는 것은 아니며", "설명용 가상 데이터", "무효 트래픽", "설정을 일괄 변경하지 않습니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(!html.includes("<h2>자가 진단 표</h2>"));
});

test("planning tool exposes safe initial states, ephemeral disclosure and assets", () => {
  const html = read("tools/content-planner/index.html");
  for (const marker of ['id="editorial-planner"', 'id="plan-fields" class="tool-fields" disabled', 'id="plan-export" disabled', 'id="plan-error" class="tool-error" role="alert" tabindex="-1" hidden', '/assets/editorial-planner.mjs', '/assets/icons/plus.svg', "새로고침하면 사라집니다"]) assert.ok(html.includes(marker), marker);
  assert.ok(read("privacy/index.html").includes("RPM 계산기와 발행 작업 시간표"));
  assert.ok(read("cookie-policy/index.html").includes("발행 작업 시간표 입력은 저장하지 않습니다"));
  assert.ok(read("tools/index.html").includes("콘텐츠 발행 계획·시간표"));
});

test("calendar and glossary retain table semantics, valid fragments and resource dates", () => {
  for (const slug of ["content-calendar-30-days", "glossary-for-beginners"]) {
    const html = read(`guides/${slug}/index.html`);
    for (const [, table] of html.matchAll(/<div class="article-table-scroll"([\s\S]*?)<\/div>/g)) for (const marker of ['role="region"', 'tabindex="0"', '<caption>', 'scope="col"', 'scope="row"']) assert.ok(table.includes(marker));
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href, `https://alphaadsense.com/guides/${slug}/`);
      if (url.origin !== "https://alphaadsense.com" || !url.hash) continue;
      const target = read(join(decodeURIComponent(url.pathname).replace(/^\//, ""), "index.html"));
      assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${slug}: ${href}`);
    }
  }
  const graph = JSON.parse(read("resources/index.html").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];
  assert.equal(graph.find(item => item["@type"] === "WebPage").dateModified, "2026-10-27");
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
  assert.ok(read("search/index.html").includes('href="/styles.css?v=20261027-privacy-notice"'));
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
  assert.equal(Object.keys(revisedGuides).length, 30);
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
