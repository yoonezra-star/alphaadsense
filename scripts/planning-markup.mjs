const icon = name => `<img src="/assets/icons/${name}.svg" alt="" width="18" height="18">`;

export const editorialPlanner = `<section class="metric-tool" id="editorial-planner" aria-label="발행 작업 시간표">
<h2>발행 작업 시간표</h2>
<p class="tool-disclosure">입력은 현재 페이지 메모리에서만 처리하며 저장하거나 서버로 전송하지 않습니다. 새로고침하면 사라집니다. CSV는 사용자가 실행할 때 기기에 생성됩니다. 비밀번호·개인정보를 입력하지 마세요. <a href="/privacy/#local-tools">처리 범위</a></p>
<p id="plan-status" class="tool-status" role="status">시간표를 불러오는 중입니다.</p>
<form id="plan-form" class="tool-form" novalidate>
<fieldset id="plan-fields" class="tool-fields" disabled>
<div class="tool-form-grid">
<label class="tool-field">주당 가용 시간<input name="weekly" type="number" min="0.01" max="168" step="0.01" value="6" required inputmode="decimal"></label>
<label class="tool-field">계획 기간 (주)<input name="weeks" type="number" min="1" max="52" step="1" value="4" required inputmode="numeric"></label>
<label class="tool-field">전체 예비 시간<input name="reserve" type="number" min="0" step="0.01" value="4" required inputmode="decimal"></label>
</div>
<h3>작업 목록</h3><p id="plan-count" class="tool-status" role="status">작업 0 / 20</p>
<div id="plan-rows"></div>
<div class="tool-actions"><button type="button" class="tool-command" id="plan-add">${icon("plus")}작업 추가</button></div>
<p id="plan-error" class="tool-error" role="alert" tabindex="-1" hidden></p>
<div class="tool-actions"><button type="submit" class="tool-command primary">${icon("calculator")}시간 계산</button><button type="button" class="tool-command" id="plan-example">${icon("file-input")}가상 예시</button><button type="button" class="tool-command" id="plan-reset">${icon("rotate-ccw")}초기화</button><button type="button" class="tool-command" id="plan-export" disabled>${icon("download")}CSV</button></div>
</fieldset></form>
<div role="status" aria-live="polite"><dl class="metric-results"><div><dt>예비 시간 제외 가용</dt><dd id="plan-available">--</dd></div><div><dt>예상 작업 시간</dt><dd id="plan-estimated">--</dd></div><div><dt>가용 시간과 차이</dt><dd id="plan-balance">--</dd></div></dl><p id="plan-summary">입력값 계산 전</p><p class="tool-status" id="plan-stage-summary"></p></div>
<template id="plan-row-template"><div class="plan-row" role="group"><label class="tool-field plan-name">작업명<input data-field="name" maxlength="120" required></label><label class="tool-field">단계<select data-field="stage"><option value="research">조사</option><option value="draft">집필</option><option value="review">검증</option><option value="publish">공개 확인</option></select></label><label class="tool-field">예상 시간<input data-field="hours" type="number" min="0.01" max="10000" step="0.01" required inputmode="decimal"></label><button type="button" class="tool-command icon-only" aria-label="작업 삭제" title="작업 삭제">${icon("trash-2")}</button></div></template>
</section><noscript><p>JavaScript를 사용할 수 없어 시간표는 비활성 상태입니다. <a href="/guides/content-calendar-30-days/#worked-budget">가상 시간 계산 예시</a>는 그대로 읽을 수 있습니다.</p></noscript><script type="module" src="/assets/editorial-planner.mjs"></script>`;

export const planningStyles = `
.plan-row { display: grid; grid-template-columns: minmax(0, 1fr) 140px 104px 44px; gap: 12px; align-items: end; border-top: 1px solid var(--line); padding: 16px 0; }
.plan-row .icon-only { margin: 0; }
.article .metric-tool h2 { font-size: 20px; }
#plan-fields > h3 { margin-top: 24px; }
@media (max-width: 600px) { .plan-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 44px; } .plan-name { grid-column: 1 / -1; } }
`;
