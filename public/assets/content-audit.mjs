import { STORAGE_KEY, STATUSES, today, validateRecord, decodeRecords, persistRecords, toCsv } from "./tool-engine.mjs";
import { downloadCsv } from "./tool-download.mjs";

const root = document.getElementById("content-workbench");
const form = document.getElementById("audit-form");
const rows = document.getElementById("audit-rows");
const status = document.getElementById("storage-status");
const error = document.getElementById("audit-error");
const exportButton = document.getElementById("audit-export");
const clearButton = document.getElementById("audit-clear");
const dialog = document.getElementById("audit-delete-dialog");
let records = [];
let editingId = null;
let baseline = null;
let corrupt = false;
let pendingDelete = null;

try {
  baseline = localStorage.getItem(STORAGE_KEY);
  try {
    records = decodeRecords(baseline);
    status.textContent = "브라우저 저장소에서 불러왔습니다. 다른 기기와 동기화되지 않습니다.";
  } catch {
    corrupt = true;
    document.getElementById("audit-save").disabled = true;
    status.textContent = "저장 자료를 읽지 못했습니다. 원본은 덮어쓰지 않았습니다. 전체 삭제를 실행하면 이 도구의 자료만 지워집니다.";
  }
} catch {
  status.textContent = "브라우저 저장소를 사용할 수 없습니다. 변경은 이 탭에만 남으며 CSV로 내보낼 수 있습니다.";
}

function persist(next, deleting = false) {
  try {
    baseline = persistRecords(localStorage, baseline, next);
    records = next;
    status.textContent = deleting ? "브라우저 저장 자료를 삭제했습니다." : "이 브라우저에 저장했습니다. 서버에 전송하지 않았습니다.";
    return true;
  } catch {
    if (deleting) {
      status.textContent = "브라우저 저장 자료를 삭제하지 못했습니다. 다른 탭의 변경이나 저장 차단 여부를 확인하세요. 표시된 기록은 유지했습니다.";
      return false;
    }
    records = next;
    status.textContent = "변경은 이 탭에만 반영됐습니다. 브라우저 저장 실패 또는 다른 탭 변경으로 저장하지 못했습니다. CSV로 보관하세요.";
    return true;
  }
}

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function urlLink(url) {
  const link = element("a", url);
  link.href = url;
  link.rel = "noopener noreferrer";
  return link;
}

function iconButton(label, icon, action) {
  const button = element("button");
  button.type = "button";
  button.className = "tool-command icon-only";
  button.title = label;
  button.setAttribute("aria-label", label);
  const image = element("img");
  image.src = `/assets/icons/${icon}.svg`;
  image.alt = "";
  image.width = 18;
  image.height = 18;
  button.append(image);
  button.addEventListener("click", action);
  return button;
}

function resetEditor(focus = false) {
  form.reset();
  editingId = null;
  error.hidden = true;
  document.getElementById("audit-editor-title").textContent = "점검 항목 추가";
  document.getElementById("audit-cancel").hidden = true;
  if (focus) form.elements.namedItem("url").focus();
}

function edit(record) {
  editingId = record.id;
  for (const key of ["url", "question", "evidence", "duplicate", "task", "status", "reviewedAt"]) form.elements.namedItem(key).value = record[key];
  document.getElementById("audit-editor-title").textContent = "점검 항목 편집";
  document.getElementById("audit-cancel").hidden = false;
  error.hidden = true;
  form.elements.namedItem("url").focus();
}

function requestDelete(id) {
  pendingDelete = id;
  document.getElementById("delete-message").textContent = id === "all" ? "이 도구의 모든 저장 기록을 삭제합니다. 복구할 수 없습니다. 필요한 자료는 먼저 CSV로 보관하세요." : "선택한 기록을 삭제합니다. 복구할 수 없습니다.";
  dialog.showModal();
  document.getElementById("delete-cancel").focus();
}

function render() {
  rows.replaceChildren();
  const query = document.getElementById("audit-search").value.trim().toLocaleLowerCase();
  const filter = document.getElementById("audit-filter").value;
  const filtered = records.filter((record) => (filter === "all" || record.status === filter) && [record.url, record.question, record.task, record.evidence, record.duplicate].join(" ").toLocaleLowerCase().includes(query));
  document.getElementById("audit-summary").textContent = `표시 ${filtered.length}개 / 전체 ${records.length}개 · 확인 완료 ${records.filter((record) => record.status === "verified").length}개`;
  exportButton.disabled = records.length === 0;
  clearButton.disabled = records.length === 0 && !corrupt;
  if (!filtered.length) {
    const row = element("tr");
    const cell = element("td", records.length ? "검색 조건에 맞는 항목이 없습니다." : "저장된 항목이 없습니다.");
    cell.colSpan = 5;
    row.append(cell);
    rows.append(row);
    return;
  }
  for (const record of filtered) {
    const row = element("tr");
    const article = element("th");
    article.scope = "row";
    article.append(urlLink(record.url), element("p", record.question));
    const evidence = element("td");
    evidence.append(element("p", `근거: ${record.evidence || "미기록"}`), element("p", `작업: ${record.task}`));
    const duplicate = element("td");
    duplicate.append(record.duplicate ? urlLink(record.duplicate) : element("span", "없음"));
    const state = element("td");
    state.append(element("strong", STATUSES[record.status]), element("p", record.reviewedAt || "확인일 미기록"));
    const actions = element("td");
    actions.append(iconButton(`편집: ${record.question}`, "pencil", () => edit(record)), iconButton(`삭제: ${record.question}`, "trash-2", () => requestDelete(record.id)));
    row.append(article, evidence, duplicate, state, actions);
    rows.append(row);
  }
}

form.elements.namedItem("reviewedAt").max = today();
form.addEventListener("submit", (event) => {
  event.preventDefault();
  error.hidden = true;
  if (corrupt) return;
  try {
    const record = validateRecord(Object.fromEntries(new FormData(form)));
    if (records.some((item) => item.id !== editingId && item.url === record.url)) throw new Error("같은 URL의 항목이 있습니다. 기존 항목을 편집하세요.");
    if (!editingId && records.length >= 200) throw new Error("최대 200개까지 기록할 수 있습니다. 기존 자료를 내보내고 정리하세요.");
    const id = editingId || crypto.randomUUID();
    const next = editingId ? records.map((item) => item.id === id ? { ...record, id } : item) : [...records, { ...record, id }];
    persist(next);
    resetEditor();
    render();
  } catch (reason) {
    error.textContent = reason.message;
    error.hidden = false;
    error.tabIndex = -1;
    error.focus();
  }
});
form.addEventListener("input", () => { error.hidden = true; });
document.getElementById("audit-cancel").addEventListener("click", () => resetEditor(true));
document.getElementById("audit-search").addEventListener("input", render);
document.getElementById("audit-filter").addEventListener("change", render);
clearButton.addEventListener("click", () => requestDelete("all"));
document.getElementById("delete-cancel").addEventListener("click", () => dialog.close());
document.getElementById("delete-confirm").addEventListener("click", () => {
  const next = pendingDelete === "all" ? [] : records.filter((record) => record.id !== pendingDelete);
  if (persist(next, true)) {
    corrupt = false;
    document.getElementById("audit-save").disabled = false;
    if (pendingDelete === "all" || pendingDelete === editingId) resetEditor();
    render();
  }
  dialog.close();
});
dialog.addEventListener("close", () => { pendingDelete = null; });
exportButton.addEventListener("click", () => {
  try {
    const headings = ["URL", "독자의 질문", "확인 근거", "중복 후보", "수정 작업", "상태", "확인일"];
    downloadCsv(toCsv([headings, ...records.map((record) => [record.url, record.question, record.evidence, record.duplicate, record.task, STATUSES[record.status], record.reviewedAt])]), `alphaadsense-content-audit-${today()}.csv`);
    status.textContent = "전체 항목의 CSV를 만들었습니다. 브라우저 다운로드를 확인하세요.";
  } catch {
    status.textContent = "CSV를 만들지 못했습니다. 브라우저 다운로드 설정을 확인하세요.";
  }
});
render();
document.getElementById("audit-fields").disabled = false;
root.setAttribute("aria-busy", "false");
