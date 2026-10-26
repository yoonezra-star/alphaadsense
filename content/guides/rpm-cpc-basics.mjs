import { rpmCalculator } from "../../scripts/tool-markup.mjs";

export const metricExample = {
  revenue: 12,
  pageviews: 6000,
  adImpressions: 12000,
  adClicks: 60
};

const pageRpm = (metricExample.revenue / metricExample.pageviews * 1000).toFixed(2);
const adRpm = (metricExample.revenue / metricExample.adImpressions * 1000).toFixed(2);
const adCtr = (metricExample.adClicks / metricExample.adImpressions * 100).toFixed(2);

export default {
  updatedAt: "2026-10-27",
  reviewSummary: "분모와 단위 검증을 포함한 브라우저 계산기와 CSV 내보내기를 추가했습니다. 입력값은 저장하거나 전송하지 않습니다.",
  relatedSlugs: ["traffic-quality", "ad-placement-principles", "glossary-for-beginners"],
  intro: `<p><strong>페이지 RPM은 방문자 수나 방문 횟수가 아니라 페이지 조회수를 기준으로 계산합니다.</strong> 같은 수입이라도 어떤 수치를 분모에 넣느냐에 따라 결과가 달라집니다. 수익 보고서를 읽기 전에 페이지 조회, 광고 노출, 클릭을 구분해야 합니다.</p><p>아래 수치는 계산 방법을 설명하기 위한 가상 데이터입니다. Alpha AdSense의 실제 수익이나 기대 수익을 뜻하지 않습니다. 예시 통화는 USD이며 다른 통화를 섞어 계산하지 않습니다.</p>`,
  sections: [
    { id: "interactive-calculator", title: "직접 계산", html: rpmCalculator },
    { id: "metric-definitions", title: "1. 지표 이름보다 먼저 분모를 확인하세요", html: `<div class="article-table-scroll" role="region" aria-label="수익 지표의 정의와 분모" tabindex="0"><table><caption>서로 바꿔 사용할 수 없는 네 가지 지표</caption><thead><tr><th scope="col">지표</th><th scope="col">의미와 계산</th><th scope="col">혼동하기 쉬운 점</th></tr></thead><tbody>
      <tr><th scope="row">페이지 RPM</th><td>예상 수입 ÷ 페이지 조회수 × 1,000</td><td>사용자 수나 세션 수를 넣는 공식이 아닙니다.</td></tr>
      <tr><th scope="row">광고 RPM</th><td>예상 수입 ÷ 광고 노출수 × 1,000</td><td>한 페이지에서 여러 광고가 노출될 수 있어 페이지 RPM과 값이 다릅니다.</td></tr>
      <tr><th scope="row">CPC</th><td>광고 클릭 1회에 대한 수익 지표</td><td>노출 기반 수익 등이 섞인 총수입을 클릭수로 나눈 값과 같다고 단정하지 않습니다.</td></tr>
      <tr><th scope="row">광고 CTR</th><td>광고 클릭수 ÷ 광고 노출수 × 100%</td><td>페이지 CTR처럼 다른 분모를 쓰는 지표와 구분합니다.</td></tr>
      </tbody></table></div><p>한 사람이 여러 번 방문하거나 한 번 방문해 여러 페이지를 읽을 수 있습니다. 분석 도구의 세션 수와 AdSense의 페이지 조회수를 바꿔 넣으면, ‘1,000회당 수익’처럼 비슷하게 보여도 다른 값을 계산하게 됩니다.</p>` },
    { id: "worked-calculation", title: "2. 같은 데이터로 페이지 RPM과 광고 RPM 계산하기", html: `<p>같은 기간, 같은 사이트 범위의 예상 수입이 <strong>12 USD</strong>, 페이지 조회수가 <strong>6,000회</strong>, 광고 노출수가 <strong>12,000회</strong>, 광고 클릭수가 <strong>60회</strong>라고 가정합니다.</p>
      <div class="article-table-scroll" role="region" aria-label="가상 데이터 계산 결과" tabindex="0"><table><caption>가상 데이터 검산: 금액은 USD, CTR은 백분율</caption><thead><tr><th scope="col">구할 값</th><th scope="col">대입한 식</th><th scope="col">결과</th></tr></thead><tbody>
      <tr><th scope="row">페이지 RPM</th><td>12 ÷ 6,000 × 1,000</td><td>${pageRpm} USD</td></tr>
      <tr><th scope="row">광고 RPM</th><td>12 ÷ 12,000 × 1,000</td><td>${adRpm} USD</td></tr>
      <tr><th scope="row">광고 CTR</th><td>60 ÷ 12,000 × 100</td><td>${adCtr}%</td></tr>
      </tbody></table></div><p>이때 페이지 RPM 2 USD는 ‘각 페이지 조회에서 2달러가 발생했다’는 뜻이 아닙니다. 해당 기간의 수익 효율을 페이지 조회 1,000회 기준으로 환산한 값입니다. 같은 데이터에서도 광고 RPM은 1 USD이므로 두 값을 서로 비교해 상승·하락을 판단하면 안 됩니다.</p><p>분모가 0이면 나눗셈으로 지표를 계산할 수 없습니다. 보고서에 값이 없거나 데이터가 충분하지 않은 상태를 임의로 ‘수익 효율 0’과 동일하게 해석하지 마세요.</p>` },
    { id: "weighted-period", title: "3. 날짜별 RPM의 단순 평균이 틀릴 수 있는 이유", html: `<p>아래 두 기간은 트래픽 규모가 다릅니다. 각각의 RPM을 더해 2로 나누기보다 전체 수입과 전체 조회수를 합쳐 다시 계산해야 합니다.</p><div class="article-table-scroll" role="region" aria-label="기간 합산 계산 예시" tabindex="0"><table><caption>트래픽 규모가 다른 기간의 페이지 RPM 합산</caption><thead><tr><th scope="col">기간</th><th scope="col">예상 수입</th><th scope="col">페이지 조회수</th><th scope="col">페이지 RPM</th></tr></thead><tbody><tr><th scope="row">A 기간</th><td>12 USD</td><td>6,000회</td><td>2 USD</td></tr><tr><th scope="row">B 기간</th><td>12 USD</td><td>2,000회</td><td>6 USD</td></tr><tr><th scope="row">전체</th><td>24 USD</td><td>8,000회</td><td>3 USD</td></tr></tbody></table></div><p>단순 평균은 (2 + 6) ÷ 2 = 4 USD이지만, 전체 페이지 RPM은 24 ÷ 8,000 × 1,000 = <strong>3 USD</strong>입니다. 여러 글이나 기기를 합산할 때도 같은 범위의 수입과 분모를 함께 합쳐야 합니다.</p>` },
    { id: "comparison-checks", title: "4. 수치가 바뀌었을 때 확인할 순서", html: `<ol><li><strong>이름과 단위:</strong> 페이지 RPM과 광고 RPM을 비교하지 않았는지, 통화가 같은지 확인합니다.</li><li><strong>기간과 범위:</strong> 보고서의 날짜, 시간대, 사이트, 국가·기기 필터가 같은지 봅니다.</li><li><strong>규모와 구성:</strong> 적은 조회의 하루인지, 방문 국가나 글 주제의 구성이 바뀌었는지 확인합니다.</li><li><strong>실제 변경:</strong> 광고 설정이나 배포를 변경했다면 날짜와 모바일 화면을 기록합니다. 설정 변경과 수익 변화가 동시에 일어났다는 이유만으로 인과관계를 확정하지 않습니다.</li></ol><p>CTR이 높아졌다는 사실만으로 정책 위반을 확정할 수는 없습니다. 반대로 수치가 낮다고 무조건 안전한 것도 아닙니다. 정책 알림과 비정상 유입을 함께 확인하고, 원인을 확인하려고 본인 광고를 클릭하거나 다른 사람에게 클릭을 부탁하지 마세요.</p>` },
    { id: "limits", title: "5. 이 지표로 알 수 없는 것", html: `<p>RPM은 이미 관찰한 기간의 예상 수입을 환산하는 지표이지 승인 점수나 다음 달 수익 보장값이 아닙니다. ‘월 방문자 × 현재 RPM’ 방식은 방문과 페이지 조회를 혼동할 수 있으며 광고 수요나 방문자 구성이 달라질 가능성도 반영하지 못합니다.</p><p>이 사이트의 이전 설명에 있던 ‘방문 1,000회당 수익’은 분모를 충분히 구분하지 못한 표현이었습니다. 이번 문서는 페이지 조회수와 광고 노출수를 나누어 바로잡았습니다. 실제 정산 금액은 계정의 최종 수입·지급 내역에서 별도로 확인해야 합니다.</p>` }
  ],
  sources: [
    { title: "Google AdSense 페이지 RPM", url: "https://support.google.com/adsense/answer/112030?hl=ko", note: "페이지 조회수를 분모로 사용하는 공식 정의입니다." },
    { title: "Google AdSense 1,000회 노출당 수익", url: "https://support.google.com/adsense/answer/190515?hl=ko", note: "페이지 RPM과 광고 RPM의 계산 범위를 확인할 수 있습니다." },
    { title: "Google AdSense 클릭당비용(CPC)", url: "https://support.google.com/adsense/answer/32725?hl=ko", note: "클릭당 수익 지표에 관한 공식 설명입니다." },
    { title: "Google AdSense 광고 CTR", url: "https://support.google.com/adsense/answer/32720?hl=ko", note: "광고 노출과 클릭의 비율에 관한 공식 설명입니다." }
  ]
};
