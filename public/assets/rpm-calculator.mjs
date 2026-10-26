import { calculateMetrics, toCsv, today } from "./tool-engine.mjs";
import { downloadCsv } from "./tool-download.mjs";

const form = document.getElementById("metrics-form");
const error = document.getElementById("metrics-error");
const summary = document.getElementById("metrics-summary");
const exportButton = document.getElementById("metrics-export");
let result = null;
const number = (value) => Number(value.toFixed(2)).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function clearResult() {
  result = null;
  for (const id of ["result-page", "result-ad", "result-ctr"]) document.getElementById(id).textContent = "--";
  summary.textContent = "계산 결과 없음";
  exportButton.disabled = true;
}

function render() {
  error.hidden = true;
  clearResult();
  try {
    result = calculateMetrics(Object.fromEntries(new FormData(form)));
    document.getElementById("result-page").textContent = `${number(result.pageRpm)} ${result.currency}`;
    document.getElementById("result-ad").textContent = result.adRpm === null ? "미계산" : `${number(result.adRpm)} ${result.currency}`;
    document.getElementById("result-ctr").textContent = result.adCtr === null ? "미계산" : `${number(result.adCtr)}%`;
    summary.textContent = `예상 수입 ${number(result.revenue)} ${result.currency} / 페이지 조회수 ${result.pageviews.toLocaleString("ko-KR")}회. 승인 판정이나 미래 수익 예측값이 아닙니다.`;
    exportButton.disabled = false;
  } catch (reason) {
    error.textContent = reason.message;
    error.hidden = false;
  }
}

form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
form.addEventListener("input", () => { clearResult(); error.hidden = true; });
document.getElementById("metrics-example").addEventListener("click", () => {
  for (const [name, value] of Object.entries({ currency: "USD", revenue: "12", pageviews: "6000", impressions: "12000", clicks: "60" })) form.elements.namedItem(name).value = value;
  render();
});
document.getElementById("metrics-reset").addEventListener("click", () => { form.reset(); clearResult(); error.hidden = true; form.elements.namedItem("revenue").focus(); });
exportButton.addEventListener("click", () => {
  if (!result) return;
  try {
    downloadCsv(toCsv([["통화", "예상 수입", "페이지 조회수", "광고 노출수", "광고 클릭수", "페이지 RPM", "광고 RPM", "광고 CTR (%)"], [result.currency, result.revenue, result.pageviews, result.impressions, result.clicks, result.pageRpm, result.adRpm, result.adCtr]]), `alphaadsense-metrics-${today()}.csv`);
  } catch {
    error.textContent = "CSV를 만들지 못했습니다. 브라우저 다운로드 설정을 확인하세요.";
    error.hidden = false;
  }
});
document.getElementById("metrics-fields").disabled = false;
