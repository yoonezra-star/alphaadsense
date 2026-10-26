import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { STORAGE_KEY, calculateMetrics, validateRecord, encodeRecords, decodeRecords, persistRecords, toCsv } from "../public/assets/tool-engine.mjs";

const input = { revenue: "12", pageviews: "6000", impressions: "12000", clicks: "60", currency: "USD" };
const record = { url: "https://example.com/article/", question: "어떤 문제를 해결하는가?", evidence: "공식 정의와 계산 확인", duplicate: "", task: "분모를 구분해 수정", status: "verified", reviewedAt: "2026-10-27" };

test("calculator produces the documented example", () => {
  const result = calculateMetrics(input);
  assert.equal(result.pageRpm, 2);
  assert.equal(result.adRpm, 1);
  assert.equal(result.adCtr, 0.5);
});

test("calculator keeps absent optional metrics distinct from zero", () => {
  const result = calculateMetrics({ ...input, revenue: "0", impressions: "", clicks: "" });
  assert.equal(result.pageRpm, 0);
  assert.equal(result.adRpm, null);
  assert.equal(result.adCtr, null);
  assert.equal(calculateMetrics({ ...input, clicks: "0" }).adCtr, 0);
});

test("calculator rejects invalid values and unsafe denominators", () => {
  for (const change of [
    { revenue: "" }, { revenue: "-1" }, { revenue: "Infinity" }, { revenue: "1e309" },
    { revenue: "1000000000001" }, { pageviews: "0" }, { pageviews: "-1" }, { pageviews: "1.5" },
    { pageviews: "text" }, { impressions: "0" }, { impressions: "0.5" },
    { clicks: "12001" }, { clicks: "0.1" }, { impressions: "", clicks: "1" }, { currency: "INVALID" }
  ]) assert.throws(() => calculateMetrics({ ...input, ...change }), JSON.stringify(change));
});

test("calculator preserves selected units and supports decimal income", () => {
  const result = calculateMetrics({ ...input, revenue: "0.15", pageviews: "25", currency: "KRW" });
  assert.equal(result.pageRpm, 6);
  assert.equal(result.currency, "KRW");
});

test("record validation requires evidence and a valid past date for verified state", () => {
  assert.equal(validateRecord(record, "2026-10-27").status, "verified");
  for (const change of [{ evidence: "" }, { reviewedAt: "" }, { reviewedAt: "2026-10-28" }, { reviewedAt: "2026-02-30" }, { status: "approved" }]) assert.throws(() => validateRecord({ ...record, ...change }, "2026-10-27"));
  assert.equal(validateRecord({ ...record, status: "todo", evidence: "", reviewedAt: "" }).status, "todo");
});

test("record validation rejects unsafe URLs, self duplicates and missing tasks", () => {
  for (const change of [
    { url: "javascript:alert(1)" }, { url: "https://name:password@example.com/" }, { url: "file:///secret" },
    { duplicate: "data:text/html,hello" }, { duplicate: record.url }, { question: " " }, { task: "" },
    { question: "x".repeat(301) }, { evidence: "x".repeat(2001) }
  ]) assert.throws(() => validateRecord({ ...record, ...change }, "2026-10-27"));
});

test("storage encoding round trips and rejects damaged or oversized state", () => {
  const records = [{ ...record, id: "test-record-1" }];
  assert.deepEqual(decodeRecords(encodeRecords(records)), records);
  assert.deepEqual(decodeRecords(null), []);
  for (const raw of ["{", "null", JSON.stringify({ version: 2, records: [] }), JSON.stringify({ version: 1, records: [records[0], records[0]] }), JSON.stringify({ version: 1, records: Array(201).fill(records[0]) })]) assert.throws(() => decodeRecords(raw));
});

test("CSV quotes commas newlines and formula-like input", () => {
  const csv = toCsv([["제목", "내용"], ['a,"b"', "line1\nline2"], ["=1+1", "  @formula"], ["-danger", "\tvalue"]]);
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes('"a,""b"""'));
  assert.ok(csv.includes('"line1\nline2"'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"\'  @formula"'));
  assert.ok(csv.includes('"\'-danger"'));
});

test("tool scripts do not send user values or render input as HTML", () => {
  const workbench = readFileSync(new URL("../public/assets/content-audit.mjs", import.meta.url), "utf8");
  const calculator = readFileSync(new URL("../public/assets/rpm-calculator.mjs", import.meta.url), "utf8");
  assert.ok(!workbench.includes("innerHTML"));
  for (const source of [workbench, calculator]) {
    for (const api of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket"]) assert.ok(!source.includes(api));
  }
  assert.ok(!calculator.includes("localStorage"));
  assert.ok(workbench.includes("persistRecords(localStorage, baseline, next)"));
  assert.ok(!workbench.includes("localStorage.clear"));
});

test("storage writes and deletion touch only this tool key", () => {
  const map = new Map([["unrelated", "keep"]]);
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) };
  const raw = persistRecords(storage, null, [{ ...record, id: "qa-1" }]);
  assert.ok(raw.includes("qa-1"));
  assert.equal(map.get(STORAGE_KEY), raw);
  assert.equal(persistRecords(storage, raw, []), null);
  assert.equal(map.has(STORAGE_KEY), false);
  assert.equal(map.get("unrelated"), "keep");
});

test("storage quota access and concurrent-update failures do not report successful writes", () => {
  const denied = { getItem: () => { throw new Error("denied"); } };
  assert.throws(() => persistRecords(denied, null, []));
  const quota = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
  assert.throws(() => persistRecords(quota, null, [{ ...record, id: "qa-1" }]));
  const removeDenied = { getItem: () => "original", removeItem: () => { throw new Error("denied"); } };
  assert.throws(() => persistRecords(removeDenied, "original", []));
  let overwritten = false;
  const changed = { getItem: () => "newer", setItem: () => { overwritten = true; }, removeItem: () => { overwritten = true; } };
  assert.throws(() => persistRecords(changed, "older", []));
  assert.equal(overwritten, false);
});
