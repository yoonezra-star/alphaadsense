const icon = (name, size = 20) => `<img src="/assets/icons/${name}.svg" alt="" width="${size}" height="${size}">`;

export function homePage({ latest, images, guides, categories, escape }) {
  const recent = latest.filter((article) => guides[article[1]]).slice(0, 6);
  return `<section class="home-intro wrap" aria-labelledby="home-title">
    <p class="eyebrow">콘텐츠·사이트 운영 자료실</p>
    <h1 id="home-title"><span>Alpha</span> AdSense</h1>
    <p class="home-lead">거절 후 콘텐츠 수정부터 도메인 연결, 검색 인증과 수익 지표까지.</p>
    <form class="home-search" role="search" action="/search/" method="get">
      <label for="home-query">문서 검색</label>
      <div><input id="home-query" type="search" name="q" maxlength="120" required placeholder="예: 인증, 낮은 가치, RPM" autocomplete="off"><button type="submit" class="home-search-submit">${icon("search")}<span>검색</span></button></div>
    </form>
  </section>
  <section class="home-paths wrap" aria-labelledby="home-path-title">
    <h2 id="home-path-title">지금 해결할 문제</h2>
    <div class="home-path-list">
      <a href="/guides/low-value-content-fix/"><span class="eyebrow">거절 이후</span><strong>‘가치가 낮은 콘텐츠’를 고치려면</strong><span>반복 문장을 찾고 글별 재작성·병합 기준 정하기</span>${icon("arrow-right")}</a>
      <a href="/guides/cloudflare-search-console-example/"><span class="eyebrow">연결과 인증</span><strong>소유권 인증이 되지 않는다면</strong><span>도메인 DNS와 URL 접두어 HTML 확인 방법 구분하기</span>${icon("arrow-right")}</a>
    </div>
  </section>
  <section class="home-library wrap" aria-labelledby="home-recent-title">
    <div class="home-section-head"><h2 id="home-recent-title">최근 업데이트된 가이드</h2><a href="/sitemap/">전체 글 목록 ${icon("arrow-right", 18)}</a></div>
    <div class="home-guide-list">${recent.map(([category, slug, title, description]) => {
      const visual = slug === "rpm-cpc-basics" ? { src: "/assets/rpm-calculator-20261027.jpg" } : images[slug];
      const date = guides[slug].updatedAt;
      return `<article class="home-guide${visual ? "" : " home-guide-text"}" data-home-guide="${slug}" data-updated="${date}">
        ${visual ? `<img class="home-guide-image" src="${visual.src}" alt="" loading="lazy" width="160" height="112">` : ""}
        <div><p class="home-guide-meta">${escape(categories[category].title)} · <time datetime="${date}">${date}</time></p><h3><a href="/guides/${slug}/">${escape(title)}</a></h3><p>${escape(description)}</p></div>
      </article>`;
    }).join("")}</div>
  </section>
  <section class="home-utilities" aria-labelledby="home-tools-title"><div class="wrap">
    <div class="home-section-head"><h2 id="home-tools-title">기록과 계산</h2><a href="/tools/">운영 도구 전체 ${icon("arrow-right", 18)}</a></div>
    <div class="home-tool-list">
      <a href="/tools/approval-score/">${icon("clipboard-list", 24)}<span><strong>콘텐츠 점검 작업표</strong><span>글별 질문·근거·수정 작업을 기록하고 CSV로 보관</span></span>${icon("arrow-right")}</a>
      <a href="/guides/rpm-cpc-basics/#rpm-calculator">${icon("calculator", 24)}<span><strong>RPM·광고 CTR 계산기</strong><span>같은 기간의 수입·조회·노출로 수익 지표 검산</span></span>${icon("arrow-right")}</a>
    </div>
  </div></section>`;
}

export const homeStyles = `
.home-intro { padding: 36px 0 28px; }
.home-intro h1 { font-size: 42px; margin-bottom: 12px; }
.home-intro h1 span { color: var(--blue); }
.home-lead { color: var(--muted); max-width: 720px; font-size: 17px; word-break: keep-all; overflow-wrap: anywhere; }
.home-search { max-width: 720px; margin-top: 24px; }
.home-search label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.home-search > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.home-search input { min-width: 0; min-height: 48px; width: 100%; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; font: inherit; background: var(--white); color: var(--ink); }
.home-search-submit { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 10px 16px; border: 1px solid var(--blue); border-radius: 4px; background: var(--blue); color: var(--white); font: inherit; font-weight: 700; cursor: pointer; }
.home-search-submit img { filter: invert(1); }
.home-search-submit:hover { background: var(--ink); border-color: var(--ink); }
.home-search-submit:active { box-shadow: inset 0 0 0 2px var(--white); }
.home-paths { padding: 24px 0; border-top: 1px solid var(--line); }
.home-paths h2, .home-section-head h2 { font-size: 24px; margin: 0; }
.home-path-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; margin-top: 18px; }
.home-path-list > a { position: relative; padding: 8px 36px 12px 0; min-width: 0; }
.home-path-list > a > span { display: block; }
.home-path-list .eyebrow { margin-bottom: 6px; }
.home-path-list strong { display: block; font-size: 18px; line-height: 1.5; word-break: keep-all; overflow-wrap: anywhere; }
.home-path-list > a > span:last-of-type { color: var(--muted); font-size: 14px; margin-top: 6px; word-break: keep-all; overflow-wrap: anywhere; }
.home-path-list > a > img { position: absolute; right: 0; top: 40px; }
.home-library { padding: 28px 0 36px; border-top: 1px solid var(--line); }
.home-section-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px 24px; align-items: center; margin-bottom: 20px; }
.home-section-head > a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; color: var(--muted); font-size: 14px; }
.home-guide-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 32px; }
.home-guide { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; min-width: 0; padding: 20px 0; border-bottom: 1px solid var(--line); align-items: start; }
.home-guide.home-guide-text { grid-template-columns: minmax(0, 1fr); }
.home-guide-image { display: block; width: 120px; height: 90px; object-fit: cover; border: 1px solid var(--line); border-radius: 4px; background: var(--soft); }
.home-guide h3 { font-size: 17px; line-height: 1.5; margin-bottom: 8px; word-break: keep-all; overflow-wrap: anywhere; }
.home-guide p { color: var(--muted); font-size: 14px; line-height: 1.6; margin: 0; overflow-wrap: anywhere; }
.home-guide .home-guide-meta { font-size: 12px; margin-bottom: 6px; }
.home-utilities { background: #f3faf7; border-block: 1px solid var(--line); padding: 28px 0; }
.home-tool-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
.home-tool-list > a { display: grid; grid-template-columns: 24px minmax(0, 1fr) 20px; align-items: center; gap: 12px; padding: 12px 0; }
.home-tool-list strong, .home-tool-list span span { display: block; }
.home-tool-list strong { font-size: 17px; }
.home-tool-list span span { font-size: 14px; color: var(--muted); margin-top: 6px; word-break: keep-all; overflow-wrap: anywhere; }
@media (max-width: 860px) { .home-guide-list { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) { .home-intro { padding: 24px 0; } .home-intro h1 { font-size: 34px; } .home-lead { font-size: 16px; } .home-path-list, .home-tool-list { grid-template-columns: minmax(0, 1fr); gap: 8px; } .home-path-list > a + a { border-top: 1px solid var(--line); padding-top: 18px; } .home-paths h2, .home-section-head h2 { font-size: 21px; } .home-guide { grid-template-columns: 88px minmax(0, 1fr); gap: 12px; } .home-guide-image { width: 88px; height: 76px; } .home-guide h3 { font-size: 16px; } .home-guide p:not(.home-guide-meta) { font-size: 13px; } }
`;
