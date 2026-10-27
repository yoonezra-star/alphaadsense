export const MAX_PLAN_TASKS = 20;
export const PLAN_STAGES = { research: "조사", draft: "집필", review: "검증", publish: "공개 확인" };

function hours(value, label, max, allowZero = false) {
  const text = String(value ?? "").trim();
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text)) throw new Error(`${label}은 소수 둘째 자리까지의 숫자로 입력하세요.`);
  const result = Number(text);
  if (!Number.isFinite(result) || result > max || result < 0 || (!allowZero && result === 0)) throw new Error(`${label}의 입력 범위를 확인하세요.`);
  return Math.round(result * 100);
}

export function calculatePlan(input) {
  const weekly = hours(input.weekly, "주당 가용 시간", 168);
  const weeksText = String(input.weeks ?? "").trim();
  const weeks = Number(weeksText);
  if (!/^\d+$/.test(weeksText) || !Number.isInteger(weeks) || weeks < 1 || weeks > 52) throw new Error("계획 기간은 1~52주의 정수로 입력하세요.");
  const total = weekly * weeks;
  const reserve = hours(input.reserve, "전체 예비 시간", total / 100, true);
  if (!Array.isArray(input.tasks) || input.tasks.length < 1 || input.tasks.length > MAX_PLAN_TASKS) throw new Error(`작업은 1~${MAX_PLAN_TASKS}개 입력하세요.`);
  const stages = Object.fromEntries(Object.keys(PLAN_STAGES).map(stage => [stage, 0]));
  const tasks = input.tasks.map((task, index) => {
    const name = typeof task.name === "string" ? task.name.trim() : "";
    if (!name || name.length > 120) throw new Error(`작업 ${index + 1}의 이름은 1~120자로 입력하세요.`);
    if (!Object.hasOwn(PLAN_STAGES, task.stage)) throw new Error(`작업 ${index + 1}의 단계를 선택하세요.`);
    const estimate = hours(task.hours, `작업 ${index + 1} 예상 시간`, 10000);
    stages[task.stage] += estimate;
    return { name, stage: task.stage, hours: estimate / 100 };
  });
  const planned = Object.values(stages).reduce((sum, value) => sum + value, 0);
  return {
    weekly: weekly / 100, weeks, total: total / 100, reserve: reserve / 100,
    available: (total - reserve) / 100, planned: planned / 100,
    remaining: (total - reserve - planned) / 100,
    stages: Object.fromEntries(Object.entries(stages).map(([stage, value]) => [stage, value / 100])), tasks
  };
}

export function planCsvRows(plan) {
  return [
    ["주당 시간", "기간(주)", "총 시간", "예비 시간", "가용 시간", "예상 작업 시간", "남은 시간", "초과 시간"],
    [plan.weekly, plan.weeks, plan.total, plan.reserve, plan.available, plan.planned, Math.max(0, plan.remaining), Math.max(0, -plan.remaining)],
    [], ["작업명", "단계", "예상 시간"],
    ...plan.tasks.map(task => [task.name, PLAN_STAGES[task.stage], task.hours])
  ];
}
