import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { calculatePlan, planCsvRows, MAX_PLAN_TASKS } from "../public/assets/planning-engine.mjs";
import { toCsv } from "../public/assets/tool-engine.mjs";

const input = { weekly: "6", weeks: "4", reserve: "4", tasks: [
  { name: "공식 자료 조사", stage: "research", hours: "4" },
  { name: "원문 집필·수정", stage: "draft", hours: "8" },
  { name: "사실·계산·연결 검증", stage: "review", hours: "6" },
  { name: "공개 배포·모바일 확인", stage: "publish", hours: "2" }
] };

test("planning example reserves time before comparing task estimates", () => {
  const result = calculatePlan(input);
  assert.equal(result.total, 24); assert.equal(result.available, 20);
  assert.equal(result.planned, 20); assert.equal(result.remaining, 0);
  assert.deepEqual(result.stages, { research: 4, draft: 8, review: 6, publish: 2 });
  assert.equal(calculatePlan({ ...input, tasks: [{ name: "추가 조사", stage: "research", hours: "24" }] }).remaining, -4);
});

test("planning uses hundredths without decimal drift or mutating inputs", () => {
  const source = { weekly: ".3", weeks: "1", reserve: "0", tasks: [{ name: "A", stage: "research", hours: ".1" }, { name: "B", stage: "review", hours: ".2" }] };
  const before = structuredClone(source);
  assert.equal(calculatePlan(source).remaining, 0);
  assert.deepEqual(source, before);
  assert.equal(calculatePlan({ ...source, reserve: ".3" }).available, 0);
});

test("planning rejects invalid and impossible budgets", () => {
  for (const change of [{ weekly: "" }, { weekly: "0" }, { weekly: "169" }, { weekly: "Infinity" }, { weekly: "1e3" }, { weekly: "0.001" }, { weeks: "0" }, { weeks: "53" }, { weeks: "1.5" }, { reserve: "-1" }, { reserve: "25" }, { reserve: "" }]) assert.throws(() => calculatePlan({ ...input, ...change }), JSON.stringify(change));
});

test("planning validates task limits, names, stages and estimates", () => {
  for (const tasks of [[], null, Array(MAX_PLAN_TASKS + 1).fill(input.tasks[0]), [{ ...input.tasks[0], name: " " }], [{ ...input.tasks[0], name: "x".repeat(121) }], [{ ...input.tasks[0], stage: "approved" }], [{ ...input.tasks[0], hours: "0" }], [{ ...input.tasks[0], hours: "-1" }], [{ ...input.tasks[0], hours: "10001" }], [{ ...input.tasks[0], hours: "NaN" }]]) assert.throws(() => calculatePlan({ ...input, tasks }));
  assert.equal(calculatePlan({ ...input, tasks: Array(MAX_PLAN_TASKS).fill(input.tasks[0]) }).tasks.length, MAX_PLAN_TASKS);
});

test("planning CSV preserves tasks and neutralizes formula-like names", () => {
  const result = calculatePlan({ ...input, tasks: [{ name: '=SUM(1,2)', stage: "review", hours: "2" }] });
  const rows = planCsvRows(result);
  assert.deepEqual(rows.at(-1), ['=SUM(1,2)', "검증", 2]);
  assert.ok(toCsv(rows).includes("'=SUM(1,2)"));
  assert.deepEqual(rows[1].slice(-2), [18, 0]);
  assert.deepEqual(planCsvRows(calculatePlan({ ...input, tasks: [{ name: "큰 작업", stage: "draft", hours: 24 }] }))[1].slice(-2), [0, 4]);
});

test("planner UI does not transmit or persist input and invalidates stale exports", () => {
  const source = readFileSync(new URL("../public/assets/editorial-planner.mjs", import.meta.url), "utf8");
  for (const token of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "localStorage", "sessionStorage", "innerHTML"]) assert.ok(!source.includes(token), token);
  assert.ok(source.includes('form.addEventListener("input", invalidate)'));
  assert.ok(source.includes('form.addEventListener("change", invalidate)'));
  assert.ok(source.includes("exportButton.disabled = true"));
  assert.ok(source.includes("rows.replaceChildren()"));
});
