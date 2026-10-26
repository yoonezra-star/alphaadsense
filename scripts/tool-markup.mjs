const icon = (name) => `<img class="tool-icon" src="/assets/icons/${name}.svg" alt="" width="18" height="18">`;

export const contentWorkbench = `
<p>이 작업표는 입력한 글의 수정 내역을 기록합니다. URL의 본문을 자동으로 읽거나 승인 가능성을 점수로 판정하지 않습니다.</p>
<p class="tool-disclosure">작업표는 이 브라우저에 저장됩니다. 입력값은 이 도구의 코드에서 서버로 전송하지 않습니다. 공용 기기에서는 사용 후 삭제하고, 비밀번호·인증 코드·개인정보를 적지 마세요. <a href="/privacy/#local-tools">저장 범위</a></p>
<section class="workbench" id="content-workbench" aria-label="콘텐츠 점검 작업표" aria-busy="true">
  <p id="storage-status" class="tool-status" role="status">작업표를 불러오는 중입니다.</p>
  <form id="audit-form" novalidate class="tool-form">
    <h2 id="audit-editor-title">점검 항목 추가</h2>
    <fieldset class="tool-fields" id="audit-fields" aria-label="점검 항목 입력" disabled>
    <div class="tool-form-grid">
      <label class="tool-field">글 URL (필수)<input name="url" type="url" required maxlength="2048" autocomplete="off"></label>
      <label class="tool-field">독자의 질문 (필수)<input name="question" required maxlength="300"></label>
      <label class="tool-field">확인 근거<textarea name="evidence" rows="2" maxlength="2000"></textarea></label>
      <label class="tool-field">수정 작업 (필수)<textarea name="task" required rows="2" maxlength="1500"></textarea></label>
      <label class="tool-field full">중복 후보 URL<input name="duplicate" type="url" maxlength="2048" autocomplete="off"></label>
      <label class="tool-field">작업 상태<select name="status"><option value="todo">대기</option><option value="editing">수정 중</option><option value="verified">확인 완료</option></select></label>
      <label class="tool-field">확인일<input name="reviewedAt" type="date"></label>
    </div>
    <p class="tool-error" id="audit-error" role="alert" hidden></p>
    <div class="tool-actions"><button class="tool-command primary" type="submit" id="audit-save">${icon("save")}<span>저장</span></button><button class="tool-command" type="button" id="audit-cancel" hidden>${icon("x")}편집 취소</button></div>
    </fieldset>
  </form>
  <section aria-labelledby="audit-list-title" class="tool-records">
    <h2 id="audit-list-title">작업 목록</h2>
    <p id="audit-summary" class="tool-status" aria-live="polite">0개 항목</p>
    <div class="tool-toolbar"><label class="tool-field">목록 검색<input type="search" id="audit-search"></label><label class="tool-field">상태 필터<select id="audit-filter"><option value="all">전체</option><option value="todo">대기</option><option value="editing">수정 중</option><option value="verified">확인 완료</option></select></label><button class="tool-command" type="button" id="audit-export" disabled>${icon("download")}CSV 내보내기</button><button class="tool-command danger" type="button" id="audit-clear">${icon("trash-2")}전체 삭제</button></div>
    <div class="audit-table-scroll" role="region" aria-label="콘텐츠 작업 목록" tabindex="0"><table class="audit-table"><caption>직접 입력한 점검과 수정 기록</caption><thead><tr><th scope="col">글과 질문</th><th scope="col">근거·수정 작업</th><th scope="col">중복 후보</th><th scope="col">상태·확인일</th><th scope="col">관리</th></tr></thead><tbody id="audit-rows"><tr><td colspan="5">저장된 항목이 없습니다.</td></tr></tbody></table></div>
  </section>
  <dialog id="audit-delete-dialog" aria-labelledby="delete-title"><h2 id="delete-title">기록 삭제</h2><p id="delete-message"></p><div class="tool-actions"><button class="tool-command" id="delete-cancel" type="button">취소</button><button class="tool-command danger" id="delete-confirm" type="button">${icon("trash-2")}삭제</button></div></dialog>
</section>
<noscript><p>작업표를 사용하려면 JavaScript가 필요합니다. <a href="/guides/low-value-content-fix/">콘텐츠 점검 기준</a>은 기능을 켜지 않아도 읽을 수 있습니다.</p></noscript>
<h2>확인 완료와 승인 결과의 차이</h2><p>확인 완료는 사용자가 근거와 확인일을 기록한 상태입니다. Google의 심사 통과나 이 사이트의 독립 검증을 의미하지 않습니다. 저장 자료를 지우면 이 도구에서 복구할 수 없으며, 브라우저 데이터 삭제·시크릿 모드 종료 시에도 사라질 수 있습니다. CSV에는 전체 항목이 포함되며 외부 업로드는 실행되지 않습니다.</p>
<p><a href="/guides/low-value-content-fix/">저가치 콘텐츠 점검</a> · <a href="/guides/approval-friendly-article-format/">실제 편집 사례</a></p>
<script type="module" src="/assets/content-audit.mjs"></script>`;

export const rpmCalculator = `<section class="metric-tool" id="rpm-calculator" aria-label="RPM과 광고 CTR 계산기">
  <p>같은 기간·범위의 값을 입력하세요. 계산은 이 페이지 안에서 처리하며 입력값은 저장하거나 서버로 전송하지 않습니다. 예시 값은 가상 데이터입니다.</p>
  <form id="metrics-form" novalidate class="tool-form">
    <fieldset class="tool-fields" id="metrics-fields" aria-label="계산 값 입력" disabled>
    <div class="tool-form-grid">
      <label class="tool-field">통화<select name="currency"><option value="USD">USD</option><option value="KRW">KRW</option></select></label>
      <label class="tool-field">예상 수입 (필수)<input name="revenue" type="number" min="0" max="1000000000000" step="any" required inputmode="decimal"></label>
      <label class="tool-field">페이지 조회수 (필수)<input name="pageviews" type="number" min="1" max="1000000000000" step="1" required inputmode="numeric"></label>
      <label class="tool-field">광고 노출수<input name="impressions" type="number" min="1" max="1000000000000" step="1" inputmode="numeric"></label>
      <label class="tool-field">광고 클릭수<input name="clicks" type="number" min="0" max="1000000000000" step="1" inputmode="numeric"></label>
    </div>
    <p class="tool-error" id="metrics-error" role="alert" hidden></p>
    <div class="tool-actions"><button class="tool-command primary" type="submit">${icon("calculator")}계산</button><button class="tool-command" id="metrics-example" type="button">${icon("file-input")}예시 값</button><button class="tool-command" id="metrics-reset" type="button">${icon("rotate-ccw")}초기화</button><button class="tool-command" id="metrics-export" type="button" disabled>${icon("download")}CSV</button></div>
    </fieldset>
  </form>
  <div id="metrics-output" role="status" aria-live="polite"><dl class="metric-results"><div><dt>페이지 RPM</dt><dd id="result-page">--</dd></div><div><dt>광고 RPM</dt><dd id="result-ad">--</dd></div><div><dt>광고 CTR</dt><dd id="result-ctr">--</dd></div></dl><p id="metrics-summary">계산 결과 없음</p></div>
</section><noscript><p>JavaScript를 사용할 수 없어 계산기는 비활성 상태입니다. 아래의 수식과 계산 예시를 참고하세요.</p></noscript><script type="module" src="/assets/rpm-calculator.mjs"></script>`;

export const toolStyles = `
.workbench, .metric-tool { --tool-danger: #b42318; border-block: 1px solid var(--line); padding: 20px 0; margin: 24px 0; scroll-margin-top: 150px; }
.article .workbench h2 { font-size: 20px; }
.tool-fields { border: 0; margin: 0; padding: 0; min-width: 0; }
.tool-form { margin: 20px 0; }
.tool-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.tool-field { display: grid; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; }
.tool-field.full { grid-column: 1 / -1; }
.tool-field input, .tool-field textarea, .tool-field select { width: 100%; max-width: 100%; min-width: 0; min-height: 44px; border: 1px solid var(--line); border-radius: 4px; padding: 10px 12px; font: inherit; font-weight: 400; color: var(--ink); background: var(--white); }
.tool-field textarea { resize: vertical; }
.tool-actions, .tool-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin: 16px 0; }
.tool-toolbar .tool-field:first-child { flex: 1 1 220px; }
.tool-toolbar .tool-field { flex: 0 1 140px; }
.tool-command { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--white); color: var(--ink); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
.tool-command img { display: block; width: 18px; height: 18px; flex: 0 0 18px; }
.tool-command.primary { background: var(--blue); color: var(--white); border-color: var(--blue); }
.tool-command.primary img { filter: invert(1); }
.tool-command.danger { color: var(--tool-danger); }
.tool-command.icon-only { width: 44px; padding: 10px; margin: 0 4px 4px 0; }
.tool-command:hover:not(:disabled) { background: var(--soft); border-color: var(--muted); }
.tool-command.primary:hover:not(:disabled) { background: var(--ink); }
.tool-command:active:not(:disabled) { box-shadow: inset 0 0 0 2px var(--line); }
.tool-command:disabled { opacity: .5; cursor: not-allowed; }
.workbench :focus-visible, .metric-tool :focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
.workbench [hidden], .metric-tool [hidden] { display: none; }
.tool-status, .tool-disclosure { font-size: 14px; color: var(--muted); overflow-wrap: anywhere; }
.tool-error { border-left: 3px solid var(--tool-danger); padding: 10px 12px; color: var(--tool-danger); margin-top: 16px; }
.audit-table-scroll { max-width: 100%; overflow-x: auto; }
.article .audit-table { display: table; min-width: 960px; margin: 12px 0; table-layout: fixed; }
.audit-table th, .audit-table td { overflow-wrap: anywhere; white-space: normal; }
.audit-table th:first-child { width: 25%; }
.audit-table th:nth-child(2) { width: 29%; }
.audit-table th:nth-child(3) { width: 20%; }
.audit-table th:nth-child(4) { width: 14%; }
.audit-table th:nth-child(5) { width: 12%; }
.audit-table th[scope="row"] { font-weight: 400; background: var(--white); }
.audit-table p { margin: 8px 0; white-space: pre-wrap; }
.workbench dialog { width: min(100% - 32px, 460px); max-width: 460px; border: 1px solid var(--line); border-radius: 8px; padding: 24px; color: var(--ink); }
.workbench dialog::backdrop { background: rgba(0,0,0,.45); }
.article .workbench dialog h2 { margin-top: 0; font-size: 20px; }
.metric-results { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 20px 0; }
.metric-results > div { border-bottom: 2px solid var(--line); min-height: 104px; padding: 12px 0; min-width: 0; }
.metric-results dt { font-size: 14px; color: var(--muted); }
.metric-results dd { font-size: 22px; font-weight: 700; margin: 8px 0 0; overflow-wrap: anywhere; }
@media (max-width: 560px) { .tool-form-grid { grid-template-columns: minmax(0, 1fr); } .metric-results { grid-template-columns: minmax(0, 1fr); gap: 0; } .metric-results > div { min-height: 86px; } .tool-command { max-width: 100%; } }
`;
