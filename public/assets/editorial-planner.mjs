import { calculatePlan, planCsvRows, MAX_PLAN_TASKS } from "./planning-engine.mjs";
import { toCsv, today } from "./tool-engine.mjs";
import { downloadCsv } from "./tool-download.mjs";

const form = document.getElementById("plan-form");
const rows = document.getElementById("plan-rows");
const error = document.getElementById("plan-error");
const summary = document.getElementById("plan-summary");
const exportButton = document.getElementById("plan-export");
const addButton = document.getElementById("plan-add");
let result = null;
const number = value => value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });

function invalidate() {
  result = null;
  exportButton.disabled = true;
  error.hidden = true;
  for (const id of ["plan-available", "plan-estimated", "plan-balance"]) document.getElementById(id).textContent = "--";
  summary.textContent = "입력값 계산 전";
  document.getElementById("plan-stage-summary").textContent = "";
}

function updateRows() {
  [...rows.children].forEach((row, index) => {
    row.setAttribute("aria-label", `작업 ${index + 1}`);
    row.querySelector("button").setAttribute("aria-label", `작업 ${index + 1} 삭제`);
    row.querySelector("button").title = `작업 ${index + 1} 삭제`;
  });
  addButton.disabled = rows.children.length >= MAX_PLAN_TASKS;
  document.getElementById("plan-count").textContent = `작업 ${rows.children.length} / ${MAX_PLAN_TASKS}`;
}

function addRow(task = {}, focus = false) {
  if (rows.children.length >= MAX_PLAN_TASKS) return;
  const row = document.getElementById("plan-row-template").content.firstElementChild.cloneNode(true);
  row.querySelector('[data-field="name"]').value = task.name ?? "";
  row.querySelector('[data-field="stage"]').value = task.stage ?? "research";
  row.querySelector('[data-field="hours"]').value = task.hours ?? "";
  row.querySelector("button").addEventListener("click", () => {
    const next = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    invalidate();
    updateRows();
    if (next) next.querySelector("input").focus(); else addButton.focus();
  });
  rows.append(row);
  updateRows();
  if (focus) row.querySelector("input").focus();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  invalidate();
  try {
    result = calculatePlan({
      weekly: form.elements.namedItem("weekly").value,
      weeks: form.elements.namedItem("weeks").value,
      reserve: form.elements.namedItem("reserve").value,
      tasks: [...rows.children].map(row => Object.fromEntries([...row.querySelectorAll("[data-field]")].map(field => [field.dataset.field, field.value])))
    });
    document.getElementById("plan-available").textContent = `${number(result.available)}시간`;
    document.getElementById("plan-estimated").textContent = `${number(result.planned)}시간`;
    document.getElementById("plan-balance").textContent = result.remaining < 0 ? `${number(-result.remaining)}시간 초과` : `${number(result.remaining)}시간 남음`;
    summary.textContent = `총 ${number(result.total)}시간 - 예비 ${number(result.reserve)}시간. 입력한 예상 시간의 비교이며 실제 소요 시간·발행 완료·승인 여부를 판정하지 않습니다.`;
    document.getElementById("plan-stage-summary").textContent = `조사 ${number(result.stages.research)} · 집필 ${number(result.stages.draft)} · 검증 ${number(result.stages.review)} · 공개 확인 ${number(result.stages.publish)}시간`;
    exportButton.disabled = false;
  } catch (reason) {
    error.textContent = reason.message;
    error.hidden = false;
    error.focus();
  }
});
form.addEventListener("input", invalidate);
form.addEventListener("change", invalidate);
addButton.addEventListener("click", () => { invalidate(); addRow({}, true); });
document.getElementById("plan-example").addEventListener("click", () => {
  form.reset();
  rows.replaceChildren();
  for (const task of [
    { name: "공식 자료 조사", stage: "research", hours: 4 },
    { name: "원문 집필·수정", stage: "draft", hours: 8 },
    { name: "사실·계산·연결 검증", stage: "review", hours: 6 },
    { name: "공개 배포·모바일 확인", stage: "publish", hours: 2 }
  ]) addRow(task);
  form.requestSubmit();
});
document.getElementById("plan-reset").addEventListener("click", () => {
  form.reset(); rows.replaceChildren(); addRow(); invalidate(); form.elements.namedItem("weekly").focus();
});
exportButton.addEventListener("click", () => {
  if (!result) return;
  try { downloadCsv(toCsv(planCsvRows(result)), `alphaadsense-plan-${today()}.csv`); }
  catch { error.textContent = "CSV를 만들지 못했습니다. 브라우저 다운로드 설정을 확인하세요."; error.hidden = false; error.focus(); }
});
addRow();
document.getElementById("plan-fields").disabled = false;
document.getElementById("plan-status").textContent = "시간표 입력 준비 완료";
