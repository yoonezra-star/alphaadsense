export const STORAGE_KEY = "alphaadsense.content-audit.v1";
export const STATUSES = { todo: "대기", editing: "수정 중", verified: "확인 완료" };

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function webUrl(value, required) {
  const text = String(value || "").trim();
  if (!text && !required) return "";
  if (text.length > 2048) throw new Error("URL은 2,048자 이내로 입력하세요.");
  try {
    const url = new URL(text);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch {
    throw new Error("http 또는 https 주소를 입력하세요. 계정 정보가 포함된 주소는 사용할 수 없습니다.");
  }
}

export function validateRecord(input, currentDate = today()) {
  const record = { url: webUrl(input.url, true), duplicate: webUrl(input.duplicate, false) };
  for (const [key, label, limit, required] of [["question", "독자의 질문", 300, true], ["evidence", "확인 근거", 2000, false], ["task", "수정 작업", 1500, true]]) {
    record[key] = String(input[key] || "").trim();
    if (required && !record[key]) throw new Error(`${label}을 입력하세요.`);
    if (record[key].length > limit) throw new Error(`${label}은 ${limit}자 이내로 입력하세요.`);
  }
  if (!Object.hasOwn(STATUSES, input.status)) throw new Error("유효한 작업 상태를 선택하세요.");
  record.status = input.status;
  record.reviewedAt = String(input.reviewedAt || "");
  if (record.reviewedAt) {
    const value = record.reviewedAt;
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value > currentDate) throw new Error("확인일은 오늘 이전의 실제 날짜를 입력하세요.");
  }
  if (record.status === "verified" && (!record.evidence || !record.reviewedAt)) throw new Error("확인 완료 항목에는 확인 근거와 확인일이 필요합니다.");
  if (record.duplicate === record.url) throw new Error("중복 후보에는 다른 글의 URL을 입력하세요.");
  return record;
}

export function decodeRecords(raw) {
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (parsed.version !== 1 || !Array.isArray(parsed.records) || parsed.records.length > 200) throw new Error("Unsupported storage format");
  const ids = new Set();
  return parsed.records.map((item) => {
    if (typeof item.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) || ids.has(item.id)) throw new Error("Invalid record id");
    ids.add(item.id);
    return { ...validateRecord(item, "9999-12-31"), id: item.id };
  });
}

export function encodeRecords(records) {
  return JSON.stringify({ version: 1, records });
}

export function persistRecords(storage, baseline, records) {
  if (storage.getItem(STORAGE_KEY) !== baseline) throw new Error("다른 탭에서 자료가 변경되었습니다.");
  const encoded = records.length ? encodeRecords(records) : null;
  if (encoded === null) storage.removeItem(STORAGE_KEY);
  else storage.setItem(STORAGE_KEY, encoded);
  return encoded;
}

export function toCsv(rows) {
  return "\ufeff" + rows.map((row) => row.map((value) => {
    let text = String(value ?? "");
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");
}

export function calculateMetrics(input) {
  const number = (key, label, count, required) => {
    const value = String(input[key] ?? "").trim();
    if (!value && !required) return null;
    if (!value) throw new Error(`${label}을 입력하세요.`);
    const result = Number(value);
    if (!Number.isFinite(result) || result < 0 || result > 1e12 || (count && !Number.isSafeInteger(result))) throw new Error(`${label}은 0 이상 1조 이하의 ${count ? "정수" : "숫자"}여야 합니다.`);
    return result;
  };
  const revenue = number("revenue", "예상 수입", false, true);
  const pageviews = number("pageviews", "페이지 조회수", true, true);
  const impressions = number("impressions", "광고 노출수", true, false);
  const clicks = number("clicks", "광고 클릭수", true, false);
  if (pageviews === 0) throw new Error("페이지 조회수는 0보다 커야 합니다.");
  if (impressions === 0) throw new Error("광고 노출수는 0보다 커야 합니다. 계산하지 않으려면 비워 두세요.");
  if (clicks !== null && impressions === null) throw new Error("광고 CTR을 계산하려면 광고 노출수가 필요합니다.");
  if (clicks !== null && clicks > impressions) throw new Error("광고 클릭수가 광고 노출수보다 클 수 없습니다.");
  if (!["USD", "KRW"].includes(input.currency)) throw new Error("지원되는 통화를 선택하세요.");
  return { revenue, pageviews, impressions, clicks, currency: input.currency, pageRpm: revenue / pageviews * 1000, adRpm: impressions === null ? null : revenue / impressions * 1000, adCtr: clicks === null ? null : clicks / impressions * 100 };
}
