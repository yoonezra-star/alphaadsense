export const searchPage = `<div class="search-interface">
<form class="search-box" id="site-search-form" role="search" action="/search/" method="get">
  <label for="site-search">검색어</label>
  <div><input id="site-search" name="q" type="search" maxlength="120" placeholder="예: 인증, 낮은 가치, RPM" autocomplete="off" aria-controls="search-results"><button id="search-submit" class="button primary" type="submit" disabled><img src="/assets/icons/search.svg" alt="" width="18" height="18">검색</button></div>
</form>
<nav class="search-topics" aria-label="주요 검색어"><a href="/search/?q=%EC%9D%B8%EC%A6%9D">인증</a><a href="/search/?q=%EB%82%AE%EC%9D%80+%EA%B0%80%EC%B9%98">낮은 가치</a><a href="/search/?q=RPM">RPM</a></nav>
<p id="search-summary" class="search-status" role="status" aria-live="polite" tabindex="-1">문서를 불러오는 중입니다.</p>
<p id="search-error" class="search-error" role="alert" hidden></p>
<button id="search-retry" class="tool-command" type="button" hidden><img src="/assets/icons/rotate-ccw.svg" alt="" width="18" height="18">다시 불러오기</button>
<div id="search-results" class="search-results" aria-busy="true"></div>
<nav id="search-pagination" class="search-pagination" aria-label="검색 결과 페이지" hidden><button id="search-previous" class="tool-command" type="button"><img src="/assets/icons/arrow-left.svg" alt="" width="18" height="18">이전</button><span id="search-page-number">1 / 1</span><button id="search-next" class="tool-command" type="button">다음<img src="/assets/icons/arrow-right.svg" alt="" width="18" height="18"></button></nav>
<p class="search-alternatives"><a href="/sitemap/">전체 글 목록</a> · <a href="/contact/">문의</a></p>
<noscript><p>검색 결과를 불러오려면 JavaScript가 필요합니다. 전체 글 목록에서 문서를 찾을 수 있습니다.</p></noscript>
</div><script type="module" src="/assets/site-search.mjs"></script>`;

export const searchStyles = `
.search-interface [hidden] { display: none; }
.search-interface .search-box input { min-width: 0; border-radius: 4px; }
.search-interface .search-box .button { font: inherit; gap: 8px; justify-content: center; border-radius: 4px; color: var(--white); cursor: pointer; }
.search-interface .search-box .button img { filter: invert(1); }
.search-interface .search-box .button:disabled { opacity: .5; cursor: wait; }
.search-interface .search-box .button:hover:not(:disabled) { background: var(--ink); border-color: var(--ink); }
.search-interface .search-box .button:active:not(:disabled) { box-shadow: inset 0 0 0 2px var(--white); }
.search-topics { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 20px; }
.search-topics a { display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; }
.search-status { color: var(--muted); font-size: 14px; scroll-margin-top: 180px; }
.search-status:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
.search-error { color: #b42318; border-left: 3px solid currentColor; padding: 10px 12px; }
.search-interface .search-results { margin-top: 16px; }
.search-interface .search-result { padding: 20px 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; }
.search-interface .search-result h2 { margin-top: 0; word-break: keep-all; overflow-wrap: anywhere; }
.search-interface .search-result p { overflow-wrap: anywhere; }
.search-pagination { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px; margin: 24px 0; }
.search-pagination span { min-width: 64px; text-align: center; font-size: 14px; }
.search-alternatives { margin-top: 28px; font-size: 14px; }
`;
