import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import revisedGuides from "../content/guides/index.mjs";
import { contentWorkbench, toolStyles } from "./tool-markup.mjs";
import { homePage, homeStyles } from "./home.mjs";
import { searchPage, searchStyles } from "./search-markup.mjs";
import { editorialPlanner, planningStyles } from "./planning-markup.mjs";

const site = {
  name: "Alpha AdSense",
  domain: "https://alphaadsense.com",
  description: "애드센스 승인 준비, 수익형 글쓰기, 정책 점검, 거절 사유 해결을 정리하는 초보 운영자용 정보 사이트입니다.",
  email: "replyleaders@naver.com",
  company: "리플리더스 (ReplyLeaders)",
  representative: "윤용순",
  businessNumber: "564-04-03514",
  address: "경기도 파주시 책향기로 183, 5층",
  copyrightName: "리플리더스"
};

const sitePublishedAt = "2026-07-13";
const siteUpdatedAt = "2026-07-13";

const nav = [
  ["시작", "/start-guide/"],
  ["승인", "/approval/"],
  ["거절", "/rejection/"],
  ["글쓰기", "/writing/"],
  ["정책", "/policy/"],
  ["도구", "/tools/"],
  ["검색", "/search/"]
];

const categories = {
  approval: { title: "승인 가이드", description: "처음 사이트를 만들고 애드센스 신청 전까지 확인해야 할 구조, 색인, 콘텐츠 기준입니다." },
  rejection: { title: "거절 사유 해결", description: "가치가 낮은 콘텐츠, 탐색 문제, 사이트 접근 문제처럼 자주 나오는 거절 사유를 정리합니다." },
  writing: { title: "글쓰기 가이드", description: "승인과 장기 운영에 모두 필요한 주제 선정, 본문 구성, 내부 링크, 업데이트 방법입니다." },
  monetization: { title: "수익화 전략", description: "승인 이후 광고 배치, RPM 이해, 트래픽 품질, 장기 운영 지표를 다룹니다." },
  policy: { title: "정책 체크", description: "개인정보처리방침, 쿠키 고지, 금지 콘텐츠, 클릭 유도 방지 등 정책 기반 점검입니다." },
  resources: { title: "자료실", description: "사이트 운영자가 바로 사용할 수 있는 점검표, 작성표, 용어 정리, 제출 전 확인 자료입니다." }
};


const categoryActions = {
  approval: {
    use: "운영 정보·실제 자료·연결 구조 중 현재 확인할 질문에서 시작합니다. 도메인 연식·사업자 표시·글 수를 합격선으로 보지 않고 미완료·미확인과 계정 상태를 따로 남깁니다.",
    links: [["운영 정보 확인 범위", "/guides/domain-and-trust/#operator-record"], ["콘텐츠 점검 작업표", "/tools/approval-score/"], ["재검토 전 근거 점검", "/guides/pre-apply-checklist/"]]
  },
  rejection: {
    use: "실제 안내와 재현한 증상을 구분하고 본문·허브 선택·메뉴·접속 문제에서 해당하는 경로를 고릅니다. 메뉴를 숨기거나 글 수를 늘렸다는 사실만으로 결함이 해결되지는 않습니다.",
    links: [["거절 사유 진단", "/tools/rejection-diagnosis/"], ["허브 유지·통합 판단", "/guides/thin-category-pages/#hub-decisions"], ["수정 후 관찰 기록", "/guides/seven-day-pre-apply-log-example/"]]
  },
  writing: {
    use: "먼저 답할 질문과 확보 자료를 정하고 초안의 사실·출처를 검증합니다. 실제 편집 사례를 참고하되 글 수나 문체를 승인 기준으로 삼지 않습니다. 표 개수로 완료를 판단하지 않습니다.",
    links: [["자료 기반 주제 선정", "/guides/topic-selection-for-adsense/"], ["AI 초안 사실 검증", "/guides/avoid-ai-like-writing/"], ["실제 원문 편집 사례", "/guides/approval-friendly-article-format/"]]
  },
  monetization: {
    use: "승인·ads.txt·정책 안내를 구분하고 광고를 클릭하지 않고 본문·도구·모바일 이용을 검사합니다. 기간·통화·분모·범위가 같은 수치로 비교하며 변화만으로 인과관계를 단정하지 않습니다.",
    links: [["승인 후 상태·설정 확인", "/guides/after-approval-first-settings/"], ["광고 배치 검사", "/guides/ad-placement-principles/"], ["지표 비교 조건", "/guides/rpm-cpc-basics/#comparison-checks"]]
  },
  policy: {
    use: "정책 위반·광고 제한·미확인을 구분한 뒤 실제 처리 흐름과 동의 조건을 확인합니다. 정책 문서의 존재나 면책 문구만으로 준수가 인증되지는 않습니다.",
    links: [["콘텐츠 정책 분류", "/guides/prohibited-content-check/#policy-classes"], ["실제 처리 흐름 확인", "/guides/privacy-policy-for-adsense/#processing-inventory"], ["동의 상태별 검사", "/guides/cookie-notice-basics/#consent-test-paths"]]
  },
  resources: {
    use: "공식 정의·계획·점검 자료를 실제 기록과 연결합니다. 거절 안내의 원문과 관찰·가설을 구분하고 기록 완료를 승인 판정으로 바꾸지 않습니다.",
    links: [["받은 거절 안내 기록", "/guides/rejection-message-map/#notice-record"], ["재검토 전 근거 점검", "/guides/pre-apply-checklist/"], ["전체 글 목록", "/sitemap/"]]
  }
};

const articles = [
  ["approval", "adsense-approval-roadmap", "애드센스 준비 작업 순서: 선행 조건과 분기", "접근·본문·병합·배포·계정 확인의 선행 조건과 병행 작업을 나누고, 현재 상태에 맞는 다음 작업을 정합니다.", ["현재 막힌 작업과 필요한 선행 정보를 정합니다.", "본문 수정과 URL 이전·공개 검사를 구분합니다.", "실제 배포와 계정·검색 결과를 따로 확인합니다.", "고정 기간 대신 남은 결함과 근거로 다음 행동을 정합니다."]],
  ["approval", "site-structure-before-apply", "사이트 구조 점검: 링크·목차·모바일 검사 절차", "독자의 실제 작업 경로를 따라 링크 목적지, 목차 초점, 넓은 표와 운영 정보 연결을 검사하고 결과를 기록하는 방법입니다.", ["페이지 종류와 독자가 끝내야 할 일을 정합니다.", "응답 상태와 도착한 문서의 답을 따로 확인합니다.", "모바일·키보드에서 목차와 표를 직접 조작합니다.", "정상·수정 필요·미확인을 구분해 재검사합니다."]],
  ["approval", "indexing-before-adsense", "Search Console 색인 상태 확인과 문제별 대응", "발견·크롤링·색인을 구분하고 URL 검사 상태, 대표주소와 공개 응답으로 다음 작업을 정합니다. 검색 색인을 광고 승인 조건으로 보지 않습니다.", ["저장된 URL 검사와 실시간 검사의 시점을 구분합니다.", "발견됨·크롤링됨·대체 페이지의 이유별로 조사합니다.", "선언한 canonical과 Google이 선택한 표준 URL을 비교합니다.", "공개 접근·검색 색인·광고 심사 결과를 따로 기록합니다."]],
  ["approval", "minimum-content-myth", "애드센스 글 수·분량 기준의 오해와 근거 확인", "공식 요건·편집 목표·개인 경험을 구분하고 글 수, 글자 수, 이미지, 방문·대기 기간 주장 대신 무엇을 조사할지 설명합니다.", ["숫자 주장의 원문과 적용 대상을 확인합니다.", "Google 검색 안내와 광고 심사 안내를 구분합니다.", "문서 수보다 고유한 답과 미완료 작업을 검토합니다.", "새 글 추가·재작성·병합의 이유를 기록합니다."]],
  ["approval", "homepage-for-review", "Alpha AdSense 홈 개편 사례: 반복 안내를 줄인 과정", "실제 개편 전후 화면으로 페이지 수 강조와 중복 허브 안내를 줄인 이유, 질문·자료·도구 배치와 모바일 관찰을 설명합니다.", ["개편 전 화면과 중복 경로를 기준선으로 보관합니다.", "구역별 유지·삭제·이동 이유를 정합니다.", "문제별 입구·실제 개정 자료·도구의 역할을 나눕니다.", "관찰한 탐색 결과와 미확인 사용자 반응을 구분합니다."]],
  ["approval", "domain-and-trust", "도메인·운영자 신뢰 확인: 주체·제작 방식·정정 경로", "실제 운영 정보와 작성·AI 지원·검증 근거를 연결하고 공개 표시·외부 확인·메일 수신·광고 승인을 구분합니다.", ["도메인 연식·사업자 표시를 합격 점수로 바꾸지 않습니다.", "운영 주체·문의·정책 정보의 실제 일치 범위를 확인합니다.", "작성·AI 지원·검증 방식을 실제 근거와 연결합니다.", "가짜 경력·성과를 만들지 않고 미확인과 실제 운영 과제를 남깁니다."]],
  ["rejection", "low-value-content-fix", "가치가 낮은 콘텐츠 거절 사유 해결법", "실제 사이트의 반복 본문 분석을 바탕으로 글별 유지·재작성·병합 판단, 수정 전후 예시와 재검토 전 확인 방법을 설명합니다.", ["검색 결과를 다시 말하는 글은 독자에게 새 도움을 주기 어렵습니다.", "글마다 상황, 판단 기준, 예시, 체크리스트를 넣어 실사용 가치를 높입니다.", "비슷한 제목의 글이 많다면 통합하거나 관점을 분리합니다.", "재신청 전에는 대표 글을 먼저 보강하고 얇은 글은 비공개 또는 병합합니다."]],
  ["rejection", "navigation-issue-fix", "메뉴·링크 오류 재현과 복구: 목적지·목차·모바일", "반응 없는 링크, 잘못된 목적지, 가려진 목차와 모바일 오류를 나누고 실제 경로 검사와 가상 복구 사례를 설명합니다.", ["출발 URL, 누른 문구, 예상 목적지와 실제 결과를 기록합니다.", "주소·목차·입력 방식·배포 문제를 구분합니다.", "공통 원본을 고친 뒤 공개 경로에서 다시 검사합니다.", "실제 관찰과 미확인 이용 환경을 구분합니다."]],
  ["rejection", "site-down-unavailable", "사이트 접근 오류 진단: DNS·HTTPS·응답·보안", "도메인·인증서·리디렉션·HTTP 오류를 구분하고 실제 공개 응답과 요청별 보안 근거로 안전하게 복구하는 절차입니다.", ["정확한 주소와 오류 단계·시각을 먼저 남깁니다.", "DNS·TLS·HTTP·보안 중 실패 계층을 좁힙니다.", "보안 전체 해제 대신 실패 요청과 이벤트를 대조합니다.", "공개 응답 성공을 Google 접근·색인·승인과 구분합니다."]],
  ["rejection", "duplicate-content-cleanup", "중복 콘텐츠 정리: 역할 비교와 URL 병합 절차", "본문 반복과 URL 변형을 구분하고 재작성·병합·canonical 선택, 내용 이관과 Cloudflare Pages 이전 검사를 설명합니다.", ["공통 화면 요소와 질문·본문 중복, URL 변형을 구분합니다.", "고유한 답과 기존 유입을 확인해 재작성 또는 병합을 결정합니다.", "내용을 먼저 이관한 뒤 의미가 맞는 최종 URL로 연결합니다.", "실제 응답·내부 링크·canonical·사이트맵을 함께 검증합니다."]],
  ["rejection", "thin-category-pages", "허브 편집 판단: 독자 작업·유지·통합·보류", "글 수 대신 독자 선택과 목적지 차이로 허브를 판단하고 실제 상황별 입구 변경·키보드·모바일 경로 검사를 설명합니다.", ["허브가 끝내야 할 선택과 목적지의 답을 정합니다.", "고유한 역할·자료·기존 연결로 유지·통합·보류를 검토합니다.", "실제 상황별 입구와 도착 답을 입력 방식별로 확인합니다.", "심사 때만 숨기는 메뉴 편집을 결함 해결로 취급하지 않습니다."]],
  ["writing", "approval-friendly-article-format", "정보 글 편집 실제 사례: RPM 설명을 고친 과정", "이 사이트의 RPM 문서를 대상으로 독자 질문, 원문 결함, 편집 전후 판단과 계산 검증을 구체적으로 기록했습니다.", ["독자가 해결할 질문을 먼저 정합니다.", "실제 원문의 정의 오류와 주제에 맞지 않는 본문을 구분합니다.", "판단 근거와 계산 예시를 제공하고 사실·화면 검사를 나눕니다.", "승인 성공이나 수익 증가를 편집 결과로 주장하지 않습니다."]],
  ["writing", "topic-selection-for-adsense", "블로그 주제 선정: 독자 질문·자료·유지 비용", "독자 질문과 확보 자료, 기존 글과의 차이와 유지 비용으로 작성·추가 조사·병합·보류를 결정하는 기획 절차입니다.", ["독자가 읽은 뒤 해결할 일을 한 문장으로 정합니다.", "공식 자료·직접 관찰·가상 데이터의 확보 범위를 구분합니다.", "기존 글과 같은 답이면 새 URL 대신 보강을 검토합니다.", "검색 수요·수익을 확인하지 않았다면 예측하지 않습니다."]],
  ["writing", "internal-linking-guide", "내부 링크 편집: 다음 질문·연결 문구·도착 검사", "독자의 다음 질문으로 링크 여부와 목적지를 결정하고 실제 허브 변경 사례, 절 주소와 공개 도달 검사 방법을 설명합니다.", ["링크를 넣기 전에 현재 글에 남은 질문을 적습니다.", "연결 문구와 도착 문서의 답을 일치시킵니다.", "문서 주소와 실제 존재하는 절 주소를 구분합니다.", "주소 성공뿐 아니라 연결 문맥과 도착 내용을 검사합니다."]],
  ["writing", "avoid-ai-like-writing", "AI 초안 검증: 사실·출처·가상 사례 편집 절차", "초안을 주장별로 나누고 원문 대조, 계산 검산, 실제 경험과 가상 사례 구분을 거쳐 수정·삭제·발행 보류를 결정합니다.", ["문체를 고치기 전에 정의·정책·수치·경험을 검증합니다.", "실제 열어 본 원문이 해당 주장을 뒷받침하는지 봅니다.", "직접 겪지 않은 경험과 성과를 만들어 넣지 않습니다.", "검증 범위와 남은 항목을 남기고 공개 결과를 확인합니다."]],
  ["writing", "evergreen-content-plan", "기존 글 갱신: 변경 계기·수정일·공개 검증", "정보 유형별 변경 계기로 유지·부분 수정·재작성·병합을 결정하고 실제 배포 사례와 날짜·과거 관찰 보존을 설명합니다.", ["정의·화면·정책·연결마다 재확인 계기를 정합니다.", "변경 없음과 부분 수정·재작성·병합을 구분합니다.", "원래 발행일과 과거 관찰을 보존하고 실제 수정일을 표시합니다.", "본문 수정과 공개 배포·이용 검사를 따로 기록합니다."]],
  ["monetization", "after-approval-first-settings", "애드센스 승인 후 점검: 상태·설정·미리보기·복구", "사이트·ads.txt·정책·동의 상태를 구분하고 변경 전 기록, 공식 미리보기와 실제 적용·공개 검사·복구 절차를 설명합니다.", ["사이트 승인과 ads.txt·정책 상태를 따로 확인합니다.", "설정 전 기준선과 목적·복구 범위를 남깁니다.", "미리보기·적용·공개 결과를 별도로 검사합니다.", "계정 미확인과 가상 변경 사례를 실제 성과와 구분합니다."]],
  ["monetization", "rpm-cpc-basics", "RPM·CPC·CTR 계산과 보고서 해석", "페이지 조회수와 광고 노출수를 구분하고, 가상 데이터 계산과 기간 합산 예시로 수익 지표를 검산합니다.", ["페이지 RPM은 예상 수입을 페이지 조회수로 나누고 1,000을 곱합니다.", "광고 RPM은 광고 노출수, 광고 CTR은 광고 클릭수와 노출수의 비율로 계산합니다.", "통화, 기간과 보고서 범위가 다른 수치를 섞지 않습니다.", "CPC와 CTR은 승인 점수나 다음 달 수익을 보장하는 지표가 아닙니다."]],
  ["monetization", "ad-placement-principles", "광고 배치 검사: 콘텐츠 구분·우발 클릭·도구 이용", "정책 위험별 판단과 비상호작용 가상 배치도, 실제 도구의 조작 지점과 모바일·키보드·상태 변화 검사를 설명합니다.", ["광고가 기능·콘텐츠로 오해되는지 확인합니다.", "광고 개수·간격 대신 조작과 페이지 전체 결과를 검사합니다.", "가상 개념도와 실제 광고 운영 검사를 구분합니다.", "수정 전후 기록과 수익·이용 효과 측정을 분리합니다."]],
  ["monetization", "traffic-quality", "광고 트래픽 품질: 근거·유입 비교·게재 제한 구분", "유입 변화와 무효 광고 트래픽을 구분하고 비교 조건·가상 수치·근거별 대응과 계정 안내의 한계를 정리합니다.", ["유입 경로 이름이나 CTR 하나로 정상·위반을 단정하지 않습니다.", "실제 안내와 비교 범위를 기록하되 민감한 로그는 공개하지 않습니다.", "근거에 맞는 범위를 조사하고 광고를 직접 클릭하지 않습니다.", "조사·변경 기록과 제한 해제·승인 결과를 구분합니다."]],
  ["policy", "privacy-policy-for-adsense", "개인정보 안내 작성: 실제 처리·저장·삭제 범위", "이 사이트의 작업표·계산기·검색·이메일·호스팅 사례로 현재 처리와 향후 광고 계획, 삭제 범위와 남은 확인을 나눕니다.", ["현재 저장·전송과 향후 도입 계획을 구분합니다.", "브라우저 처리와 요청 URL·메일·호스팅 처리를 따로 확인합니다.", "저장 위치별 삭제와 남는 사본을 설명합니다.", "미확인 보관 기간·계약을 임의로 채우거나 준수 인증하지 않습니다."]],
  ["policy", "cookie-notice-basics", "쿠키 고지와 동의: 적용 조건·거부·철회 검사", "고지·동의·광고 개인화 선택·저장 삭제를 나누고 공식 CMP 조건과 광고 도입 전후의 검사 경로를 정리합니다.", ["고지 페이지와 실제 동의 관리를 같은 것으로 보지 않습니다.", "지역·제품·처리 목적별 공식 조건을 확인합니다.", "비맞춤 광고·localStorage라는 이름만으로 검토를 생략하지 않습니다.", "선택 전·거부·허용·철회·오류의 실제 동작을 구분합니다."]],
  ["policy", "prohibited-content-check", "콘텐츠 정책 검토: 위반·광고 제한·미확인 분류", "게시자 정책과 제한사항을 구분하고 페이지 문맥·권리 근거·가상 사례·수정 기록을 검토합니다. 심사 때만 숨기는 방식은 해결이 아닙니다.", ["정책 위반과 광고 제한, 추가 확인이 필요한 상태를 구분합니다.", "제목만이 아니라 본문·이미지·링크·제공 행위와 권리를 확인합니다.", "실제 요소와 공식 조항을 연결해 수정하고 근거를 기록합니다.", "면책 문구나 승인 후 복구를 정책 문제의 해결책으로 삼지 않습니다."]],
  ["policy", "disclaimer-page-guide", "면책 안내 편집: 주장·근거·한계·정정 연결", "면책 문구로 해결할 수 없는 문제, 실제 도구의 설명 범위와 가상 문장 편집·본문 가까운 고지·정정 경로를 정리합니다.", ["허위 약속과 실제 오류를 먼저 수정합니다.", "가상 계산·사용자 기록·공개 화면의 증거 범위를 나눕니다.", "필요한 한계는 주장 가까이 두고 공통 고지로 연결합니다.", "정정 경로와 미완료 운영 과제를 면책 문구로 대신하지 않습니다."]],
  ["resources", "pre-apply-checklist", "재검토 전 근거 점검: 완료·미완료·미확인 구분", "공개 범위와 수정 근거, 실제 배포와 계정 확인을 나누고 재검토를 보류할 결함과 미확인 항목을 기록하는 절차입니다.", ["검토할 공개 주소와 남은 작업을 구분합니다.", "영역별 근거와 그 근거의 한계를 적습니다.", "공개 배포·계정 연결·검색 색인을 따로 확인합니다.", "고정 점수나 대기 일수로 신청을 자동 결정하지 않습니다."]],
  ["resources", "content-calendar-30-days", "콘텐츠 발행 계획: 가용 시간·작업·검증 예산", "조사·집필·검증·공개 확인의 시간 예산을 세우고 가상 초과 사례와 편집 가능한 작업 시간표로 계획을 조정합니다.", ["글 수 대신 완료할 작업과 필요한 근거를 적습니다.", "가용 시간에서 예비 시간을 뺀 뒤 예상 작업 시간을 비교합니다.", "근거 부족·범위 변경·시간 초과에 따라 계획을 조정합니다.", "시간표를 채운 것과 실제 검증·재검토 준비를 구분합니다."]],
  ["resources", "rejection-message-map", "거절 안내 해석: 원문·관찰·가설·다음 검사", "운영자가 전달한 실제 안내와 관찰·가설·미확인을 구분하고 연결·접근·본문·정책의 검사 범위와 재검토 보류 조건을 정리합니다.", ["원문·대상·출처와 받은 시각·확인 시각을 나눕니다.", "문구만으로 개별 원인이나 공식 오류 코드를 확정하지 않습니다.", "재현한 결함·수정·공개 결과와 남은 근거를 기록합니다.", "고정 일수·검사 개수로 재검토를 자동 결정하지 않습니다."]],
  ["resources", "glossary-for-beginners", "애드센스·검색 용어집: 정의·분모·단위 비교", "페이지 조회·광고 노출, RPM·CPC·CTR의 분모와 가상 계산, 크롤링·색인·접근·무효 트래픽의 차이를 설명합니다.", ["지표의 전체 이름과 분모·단위·보고서 범위를 확인합니다.", "가상 수치로 페이지와 광고 기준 지표를 구분합니다.", "검색 발견·크롤링·색인과 광고 승인을 분리합니다.", "수치 하나로 무효 트래픽이나 승인 여부를 판정하지 않습니다."]],
  ["resources", "cloudflare-gabia-domain-guide", "가비아 도메인을 Cloudflare Pages에 연결하는 순서", "도메인 등록과 DNS 호스팅을 구분하고 메일 레코드 보존, GitHub 배포, 커스텀 도메인 연결과 장애 점검을 안내합니다.", ["현재 DNS와 메일 레코드를 보관하고 등록기관과 DNS 관리 위치를 구분합니다.", "Pages 기본 배포와 빌드 결과를 먼저 확인합니다.", "배정된 네임서버와 Pages의 커스텀 도메인 연결을 각각 확인합니다.", "웹, HTTPS와 메일의 정상 여부를 나누어 검증합니다."]],
  ["approval", "site-structure-audit-example", "Alpha AdSense 실제 사이트 구조 감사", "공개 홈 화면, 실제 메뉴·검색 경로와 사이트맵 62개 주소를 점검하고 정상 동작과 남은 개선 과제를 구분했습니다.", ["실제 독자 질문으로 메뉴와 검색을 사용합니다.", "공개 화면과 응답에서 확인한 사실만 감사 결과로 기록합니다.", "기술적 정상 제공과 콘텐츠 품질을 별도로 판단합니다.", "개선 제안을 이미 적용한 변경과 구분하고 다시 검증합니다."]],
  ["rejection", "low-value-rejection-rewrite-example", "저가치 거절 후 실제 개정: 허브 글의 원문·판단·새 답", "실제로 고친 허브 안내 한 편의 과거 문장과 편집 판단·새 판단표·공개 화면·미확인을 비교합니다. 승인 성공이나 원인 확정 사례는 아닙니다.", ["과거 소스의 수량·형식·메뉴 제외 표현을 확인합니다.", "독자 작업과 목적지 차이로 바꾼 이유를 기록합니다.", "실제 공개 화면·연결과 가상 판단 예시를 구분합니다.", "개정 결과와 실제 운영 결정·계정 심사를 따로 남깁니다."]],
  ["policy", "privacy-cookie-page-example", "정책 페이지 개정 실제 사례: 원문·판단·남은 과제", "이 사이트의 실제 개정 전 문장과 수정 판단, 공개 개인정보 화면·검색 안내를 비교하고 보관 기준 미정 등 남은 운영 과제를 구분합니다.", ["보관 소스와 실제 현재 페이지를 대조합니다.", "기능별 처리와 검색 URL·삭제 범위를 고친 이유를 보여 줍니다.", "실제 공개 화면과 연결을 확인하되 준수·승인 인증으로 확대하지 않습니다.", "문구 정정과 이메일 보관 기준 확정 등 실제 운영 결정을 구분합니다."]],
  ["resources", "cloudflare-search-console-example", "Cloudflare Pages의 Search Console 인증 실패 해결", "도메인 속성의 DNS 인증과 URL 접두어의 HTML 태그를 구분하고 공개 응답 사례와 실패 유형별 확인 순서를 제공합니다.", ["선택한 속성 종류, 주소와 Google 계정을 먼저 확인합니다.", "HTML 태그는 공개 홈페이지의 head와 최종 배포 결과에서 확인합니다.", "DNS 인증은 현재 권한 DNS에서 레코드 이름과 값을 확인합니다.", "소유권 인증, 사이트맵 제출과 색인은 별도의 상태로 기록합니다."]],
  ["resources", "seven-day-pre-apply-log-example", "수정 후 관찰 기록: 실제 사례와 재검사 조건", "실제 변경·공개 검사 기록을 바탕으로 관찰과 추정을 나누고, 다음 검사 조건과 미확인 범위를 남기는 방법입니다.", ["변경과 실제 관찰·원인 가설을 구분합니다.", "저장소 변경일과 공개 검사 시점을 같다고 가정하지 않습니다.", "관찰하지 않은 날짜와 계정 결과를 채워 넣지 않습니다.", "고정 대기 일수 대신 변경·자료·증상에 맞춰 재검사합니다."]]
];



function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugPath(slug) {
  return `/guides/${slug}/`;
}


function schemaScript(items) {
  const graph = Array.isArray(items) ? items : [items];
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function baseSchema(url, title, description, updatedAt = siteUpdatedAt) {
  return [
    {
      "@type": "Organization",
      "@id": `${site.domain}/#organization`,
      "name": site.name,
      "legalName": site.company,
      "url": site.domain,
      "email": site.email,
      "address": site.address
    },
    {
      "@type": "WebSite",
      "@id": `${site.domain}/#website`,
      "name": site.name,
      "url": site.domain,
      "publisher": { "@id": `${site.domain}/#organization` },
      "inLanguage": "ko-KR"
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      "url": url,
      "name": title,
      "description": description,
      "isPartOf": { "@id": `${site.domain}/#website` },
      "inLanguage": "ko-KR",
      "datePublished": sitePublishedAt,
      "dateModified": updatedAt
    }
  ];
}

function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

const articleImages = {
  "adsense-approval-roadmap": {
    src: "/assets/approval-workflow.png",
    alt: "도메인, 구조, 콘텐츠와 운영 확인의 연결을 설명하는 작업 흐름 개념도",
    caption: "작업 영역을 설명하는 개념도입니다. 고정 준비 일정이나 Google의 승인 보장 절차가 아닙니다."
  },
  "site-structure-before-apply": {
    src: "/assets/site-structure-audit.png",
    alt: "홈, 카테고리, 글과 운영 문서의 연결을 설명하는 사이트 구조 개념도",
    caption: "개념도: 문서 종류 사이의 탐색 연결을 설명합니다. 실제 점검 결과나 승인 기준을 표시한 그림이 아닙니다."
  },
  "site-structure-audit-example": {
    src: "/assets/audit-home-20261027.jpg",
    alt: "2026년 10월 27일 Alpha AdSense 홈의 페이지 수와 승인 점수 경로가 보이는 실제 화면",
    caption: "감사 기준 화면: 2026-10-27 문서 개정 전 공개 홈. 이후 최신 글 목록은 달라질 수 있으며 홈 재구성 완료 화면이 아닙니다.",
    width: 1425,
    height: 976
  },
  "low-value-content-fix": {
    src: "/assets/low-value-rewrite.png",
    alt: "낮은 가치 콘텐츠 수정 전후 비교",
    caption: "반복 글을 줄이고 판단 기준, 예시, 체크리스트를 보강하는 방향입니다."
  },
  "low-value-rejection-rewrite-example": {
    src: "/assets/hub-rewrite-after-20261028.jpg",
    alt: "실제 개정한 허브 안내의 유지·통합·보류 판단표와 가상 예시 표시",
    caption: "2026-10-28 공개 허브 안내 일부를 기록한 실제 화면입니다. 표의 상황은 설명용 가정이며 승인·이용 성과를 인증하지 않습니다. 이후 본문은 달라질 수 있습니다.",
    width: 1185,
    height: 889
  },
  "approval-friendly-article-format": {
    src: "/assets/article-format.png",
    alt: "애드센스 승인에 적합한 글 구성 도식",
    caption: "문제 정의, 판단 기준, 실행 순서, 체크리스트가 들어간 본문 구조입니다."
  },
  "privacy-policy-for-adsense": {
    src: "/assets/policy-pages-map.png",
    alt: "애드센스 정책 페이지 구성 지도",
    caption: "개인정보, 쿠키, 면책 고지, 문의 페이지의 역할을 분리해 보여 줍니다."
  },
  "privacy-cookie-page-example": {
    src: "/assets/privacy-notice-case-after-20261027.jpg",
    alt: "실제 개인정보처리방침의 기능별 처리 표, 검색 URL 안내와 문의 보관 기준 미정",
    caption: "2026-10-27 공개 개인정보처리방침 일부를 기록한 화면입니다. 이후 본문은 달라질 수 있으며 적법성·동의 수집·승인 결과를 인증하는 화면은 아닙니다.",
    width: 860,
    height: 950
  },
  "cloudflare-gabia-domain-guide": {
    src: "/assets/deployment-search-console.png",
    alt: "가비아 Cloudflare Search Console 연결 흐름",
    caption: "가비아 도메인에서 Cloudflare Pages 배포와 Search Console 제출까지의 흐름입니다."
  },
  "cloudflare-search-console-example": {
    src: "/assets/deployment-search-console.png",
    alt: "Cloudflare Pages 배포 후 Search Console 등록 흐름",
    caption: "HTTPS가 안정화된 뒤 Search Console 등록과 사이트맵 제출을 진행합니다."
  },
  "pre-apply-checklist": {
    src: "/assets/review-evidence-workbench-20261027.jpg",
    alt: "질문, 확인 근거, 수정 작업과 확인일을 입력하는 실제 콘텐츠 점검 작업표의 빈 화면",
    caption: "2026-10-27 작업표 구현 당시의 입력 전 화면. 기록 도구 예시이며 고정 준비 기간이나 승인 판정을 표시하지 않습니다.",
    width: 1425,
    height: 976
  }
};

function layout({ title, description, path = "/", content, schema = [], updatedAt = siteUpdatedAt }) {
  const url = `${site.domain}${path === "/" ? "" : path}`;
  const schemas = [...baseSchema(url, title, description, updatedAt), ...schema];
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="google-site-verification" content="_hP9RZUOUGh31ZUx04wMj46IdWLrOwO18FopYY4hpY4">
  <title>${esc(title)} | ${site.name}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${esc(title)} | ${site.name}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.domain}/assets/approval-workflow.png">
  ${schemaScript(schemas)}
  <link rel="stylesheet" href="/styles.css?v=20261028-editorial-hubs">
</head>
<body>
  <a class="skip" href="#content">콘텐츠로 건너뛰기</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/"><span>Alpha</span> AdSense</a>
      <nav class="nav" aria-label="주요 메뉴">
        ${nav.map(([label, href]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
    </div>
  </header>
  <main id="content" tabindex="-1">
    ${content}
  </main>
  <footer class="footer">
    <div class="wrap footer-grid">
      <div>
        <strong>${site.name}</strong>
        <p>애드센스 승인 준비와 수익형 콘텐츠 운영을 정리하는 독립 정보 사이트입니다.</p>
        <p class="business-info">${site.company}<br>대표자 ${site.representative} · 사업자등록번호 ${site.businessNumber}<br>사업장 주소 ${site.address}</p>
      </div>
      <div>
        <strong>운영 정보</strong>
        <p>문의: <a href="mailto:${site.email}">${site.email}</a></p>
        <nav class="footer-links" aria-label="운영 및 정책">${[["소개", "/about/"], ["문의", "/contact/"], ["개인정보처리방침", "/privacy/"], ["쿠키 정책", "/cookie-policy/"], ["이용약관", "/terms/"], ["면책 고지", "/disclaimer/"], ["운영 원칙", "/editorial-policy/"], ["출처", "/sources/"], ["사이트맵", "/sitemap/"], ["업데이트", "/updates/"]].map(([label, href]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
        <p>© 2026 ${site.copyrightName}. All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function articleCard(article) {
  const [cat, slug, title, description] = article;
  const visual = articleImages[slug];
  const thumb = visual ? `<a class="card-thumb" href="${slugPath(slug)}"><img src="${visual.src}" alt="" loading="lazy" width="700" height="380"></a>` : "";
  return `<article class="card">
    ${thumb}
    <p class="eyebrow">${categories[cat].title}</p>
    <h3><a href="${slugPath(slug)}">${esc(title)}</a></h3>
    <p>${esc(description)}</p>
  </article>`;
}


function revisedGuideContent(guide) {
  return `${guide.intro}
    <nav class="article-toc" aria-label="이 글의 목차">
      <h2>목차</h2>
      <ol>${guide.sections.map((section) => `<li><a href="#${esc(section.id)}">${esc(section.title)}</a></li>`).join("")}</ol>
    </nav>
    ${guide.sections.map((section) => `<section class="article-section" aria-labelledby="${esc(section.id)}"><h2 id="${esc(section.id)}" tabindex="-1">${esc(section.title)}</h2>${section.html}</section>`).join("")}
    <section class="article-section" aria-labelledby="guide-sources">
      <h2 id="guide-sources" tabindex="-1">공식 자료와 확인 범위</h2>
      <p>공식 자료 확인일: <time datetime="${guide.updatedAt}">${guide.updatedAt}</time>. 정책 판단은 원문과 현재 계정 안내를 함께 확인하세요.</p>
      <ul>${guide.sources.map((source) => `<li><a href="${esc(source.url)}">${esc(source.title)}</a><p>${esc(source.note)}</p></li>`).join("")}</ul>
    </section>
    <p class="article-revision"><strong>이번 개정:</strong> ${esc(guide.reviewSummary)} <a href="/updates/">업데이트 기록</a></p>`;
}

function articlePage(article) {
  const [cat, slug, title, description] = article;
  const guide = revisedGuides[slug];
  if (!guide) throw new Error(`Missing individual guide content: ${slug}`);
  const updatedAt = guide.updatedAt;
  const related = guide.relatedSlugs.map((relatedSlug) => articles.find((item) => item[1] === relatedSlug)).filter(Boolean);
  const visual = articleImages[slug];
  const visualFigure = visual ? `<figure class="article-visual">
      <img src="${visual.src}" alt="${esc(visual.alt)}" loading="lazy" width="${visual.width || 1400}" height="${visual.height || 760}">
      <figcaption>${esc(visual.caption)}</figcaption>
    </figure>` : "";
  const path = slugPath(slug);
  const url = `${site.domain}${path}`;
  const imageUrl = visual ? `${site.domain}${visual.src}` : `${site.domain}/assets/approval-workflow.png`;
  const articleSchema = [
    breadcrumbSchema([
      { name: site.name, url: site.domain },
      { name: categories[cat].title, url: `${site.domain}/${cat}/` },
      { name: title, url }
    ]),
    {
      "@type": "Article",
      "@id": `${url}#article`,
      "headline": title,
      "description": description,
      "image": imageUrl,
      "author": { "@id": `${site.domain}/#organization` },
      "publisher": { "@id": `${site.domain}/#organization` },
      "mainEntityOfPage": { "@id": `${url}#webpage` },
      "datePublished": sitePublishedAt,
      "dateModified": updatedAt,
      "inLanguage": "ko-KR"
    }
  ];
  const body = `<section class="article-head wrap">
    <p class="eyebrow">${categories[cat].title}</p>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    <p class="meta-line">작성·검토: <a href="/about/#content-process">${esc(site.company)}</a> · 업데이트: ${updatedAt}</p>
  </section>
  <article class="wrap article">
    ${visualFigure}
    ${revisedGuideContent(guide)}
  </article>
  <section class="wrap section">
    <h2>같은 주제의 글</h2>
    <div class="grid three">${related.map(articleCard).join("")}</div>
  </section>`;

  return layout({ title, description, path, content: body, schema: articleSchema, updatedAt });
}

function categoryPage(key) {
  const category = categories[key];
  const items = articles.filter((article) => article[0] === key);
  const preferredOrder = {
    writing: ["topic-selection-for-adsense", "avoid-ai-like-writing", "approval-friendly-article-format", "internal-linking-guide"],
    monetization: ["after-approval-first-settings", "ad-placement-principles", "rpm-cpc-basics", "traffic-quality"],
    policy: ["prohibited-content-check", "privacy-policy-for-adsense", "cookie-notice-basics", "disclaimer-page-guide"]
  }[key];
  const firstItems = preferredOrder ? preferredOrder.map(slug => items.find(item => item[1] === slug)) : items.slice(0, 4);
  const actions = categoryActions[key];
  const remainingItems = items.filter(item => !firstItems.includes(item));
  const entryPaths = {
    approval: [
      ["운영 주체 확인", "공개 정보·전문성 근거·정정 경로를 구분합니다.", "/guides/domain-and-trust/#operator-record"],
      ["사이트 구조 검사", "연결·목차·모바일에서 실제 도착 답을 확인합니다.", "/guides/site-structure-before-apply/"],
      ["고유한 답의 자료 확보", "독자 질문과 확보한 자료로 집필·조사·보류를 정합니다.", "/guides/topic-selection-for-adsense/"],
      ["재검토 전 남은 작업", "공개 반영·실제 운영·계정 상태의 미확인을 나눕니다.", "/guides/pre-apply-checklist/"]
    ],
    rejection: [
      ["답이 반복되는 글", "일반론·중복과 실제 본문 결함을 구분합니다.", "/guides/low-value-content-fix/"],
      ["선택하기 어려운 허브", "고유한 역할과 목적지로 유지·통합·보류를 판단합니다.", "/guides/thin-category-pages/#hub-decisions"],
      ["메뉴·목차 이동 오류", "예상한 목적지와 실제 이동·가림을 재현합니다.", "/guides/navigation-issue-fix/"],
      ["사이트 접속 오류", "DNS·인증서·응답·보안의 실패 근거를 나눕니다.", "/guides/site-down-unavailable/"]
    ]
  }[key];
  const body = `<section class="page-hero wrap">
    <p class="eyebrow">주제별 가이드</p>
    <h1>${category.title}</h1>
    <p>${category.description}</p>
  </section>
  ${entryPaths ? `<section class="wrap section tight hub-entry" aria-labelledby="hub-entry-paths"><h2 id="hub-entry-paths" tabindex="-1">상황에 맞는 출발점</h2><div class="home-path-list">${entryPaths.map(([label, description, href]) => `<a href="${href}"><strong>${esc(label)}</strong><span>${esc(description)}</span><img src="/assets/icons/arrow-right.svg" alt="" width="20" height="20"></a>`).join("")}</div></section>` : ""}
  <section class="wrap section tight hub-summary">
    <h2>이 주제의 판단 기준</h2>
    <p>${esc(actions.use)}</p>
  </section>
  <section class="wrap section tight">
    <h2>추천 읽기 순서</h2>
    <p>필요한 질문부터 골라 읽으세요. 전체를 순서대로 읽거나 정해진 문서 수를 채워야 하는 것은 아닙니다.</p>
    <ol class="read-order">${firstItems.map((item) => `<li><a href="${slugPath(item[1])}">${esc(item[2])}</a><span>${esc(item[3])}</span></li>`).join("")}</ol>
  </section>
  ${remainingItems.length ? `<section class="wrap section tight" data-guide-list="remaining"><h2>함께 살펴볼 문서</h2><div class="grid three">${remainingItems.map(articleCard).join("")}</div></section>` : ""}
  <section class="wrap section tight hub-related">
    <h2>관련 작업과 상세 절</h2>
    <ul>${actions.links.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join("")}</ul>
  </section>`;
  return layout({ title: category.title, description: category.description, path: `/${key}/`, content: body, updatedAt: "2026-10-28" });
}

function staticPage(title, description, path, inner, updatedAt = siteUpdatedAt) {
  return layout({
    title,
    description,
    path,
    updatedAt,
    content: `<section class="page-hero wrap"><h1>${esc(title)}</h1><p>${esc(description)}</p></section><section class="wrap article">${inner}</section>`
  });
}

function write(path, html) {
  const full = join("dist", path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}

function copyPublic() {
  if (!existsSync("public")) return;
  cpSync("public", "dist", { recursive: true });
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
copyPublic();
mkdirSync("dist/assets/icons", { recursive: true });
for (const name of ["save", "x", "download", "trash-2", "calculator", "file-input", "rotate-ccw", "pencil", "search", "arrow-right", "arrow-left", "clipboard-list", "plus"]) {
  cpSync(`node_modules/lucide-static/icons/${name}.svg`, `dist/assets/icons/${name}.svg`);
}
cpSync("node_modules/lucide-static/LICENSE", "dist/assets/icons/LICENSE.txt");

const latest = [...articles].sort((left, right) => (revisedGuides[right[1]]?.updatedAt || siteUpdatedAt).localeCompare(revisedGuides[left[1]]?.updatedAt || siteUpdatedAt)).slice(0, 8);
const nextStepPaths = [
  {
    id: "domain-only",
    title: "도메인만 준비했다면",
    description: "먼저 누구의 어떤 질문에 답할지와 실제 확보한 자료를 정합니다. 아직 공개할 답이 없는데 메뉴나 유사 글부터 늘리지 않습니다.",
    label: "독자 질문과 확보 자료로 주제 결정",
    href: "/guides/topic-selection-for-adsense/",
    stop: "자료가 부족하면 추가 조사로 돌아갑니다. DNS 변경은 실제 연결 오류를 확인한 뒤 별도 절차로 진행합니다."
  },
  {
    id: "existing-content",
    title: "글은 있지만 답이 겹친다면",
    description: "겹치는 두 URL의 독자 질문·고유한 자료·실제 답을 나란히 비교합니다. 단순히 짧다는 이유로 삭제하거나 요소를 덧붙이지 않습니다.",
    label: "문서 역할 비교와 재작성·병합 판단",
    href: "/guides/duplicate-content-cleanup/",
    stop: "대체할 답과 기존 연결을 확인하기 전에는 URL을 없애거나 무관한 홈으로 보내지 않습니다."
  },
  {
    id: "rejection-received",
    title: "거절 안내를 받았다면",
    description: "받은 원문·대상 사이트·받은 시각과 현재 관찰을 분리합니다. 안내 제목만으로 특정 URL의 원인을 확정하지 않습니다.",
    label: "받은 안내의 원문·관찰·가설 기록",
    href: "/guides/rejection-message-map/#notice-record",
    stop: "원문이나 현재 계정 상태가 없으면 미확인으로 남깁니다. 자료를 확인하지 않고 검토 요청을 반복하지 않습니다."
  },
  {
    id: "after-approval",
    title: "승인 후 광고 운영을 준비한다면",
    description: "현재 사이트 심사·ads.txt·정책 알림·실제 광고 노출 상태부터 구분합니다. 곧바로 광고 위치나 개수를 바꾸기 전에 기준선을 남깁니다.",
    label: "계정 상태와 설정의 역할 구분",
    href: "/guides/after-approval-first-settings/#status-boundaries",
    stop: "동의·정책 적용이나 계정 지시가 불명확하면 광고 변경을 보류하고 확인합니다. 본인 광고를 클릭해 시험하지 않습니다."
  }
];

function nextStepPath(item) {
  return `<section class="decision-path" aria-labelledby="${item.id}"><h2 id="${item.id}" tabindex="-1">${esc(item.title)}</h2><p>${esc(item.description)}</p><p><a href="${item.href}">${esc(item.label)}</a></p><p class="decision-stop"><strong>보류할 때:</strong> ${esc(item.stop)}</p></section>`;
}

const body = homePage({ latest, images: articleImages, guides: revisedGuides, categories, escape: esc });

write("index.html", layout({ title: "콘텐츠 수정과 사이트 운영 자료실", description: site.description, content: body, updatedAt: "2026-10-28" }));

for (const key of Object.keys(categories)) {
  write(`${key}/index.html`, categoryPage(key));
}

for (const article of articles) {
  write(`guides/${article[1]}/index.html`, articlePage(article));
}

write("checklist/index.html", staticPage("재검토 전 점검 안내", "검토 근거를 읽고 URL별 작업을 기록하며 공개 배포와 계정 상태를 구분하는 자료 입구입니다.", "/checklist/", `
<p>체크 개수나 점수로 승인 준비를 판정하지 않습니다. 이미 확인한 결과, 고쳐야 할 결함, 아직 확인하지 못한 범위를 나눠 다음 작업을 정합니다.</p>
<h2>필요한 자료로 이동</h2>
<ol><li><a href="/guides/pre-apply-checklist/">재검토 전 근거 점검 절차</a>: 무엇을 증거로 삼고 언제 보류할지 확인합니다.</li><li><a href="/tools/approval-score/">콘텐츠 점검 작업표</a>: 개별 URL의 질문·근거·수정 작업을 기록합니다. 자동 사이트 검사나 Google 제출 기능이 아닙니다.</li><li><a href="/guides/minimum-content-myth/">글 수·분량 기준의 오해</a>: 공식 요건과 내부 작업 목표를 구분합니다.</li></ol>
<h2>공개 검사와 계정 확인은 다릅니다</h2>
<p>페이지가 열리고 본문이 바뀐 것은 공개 화면에서 확인할 수 있습니다. 현재 AdSense 사이트의 연결·검토 상태는 해당 계정에서 별도로 확인해야 합니다. <a href="/guides/indexing-before-adsense/">검색 색인</a> 또한 광고 심사 결과를 대신하지 않습니다.</p>
<h2>남은 결함을 먼저 기록</h2>
<p>미완료·미확인을 ‘문제없음’으로 표시하지 않습니다. 다른 정상 항목이 많아도 접근 불가나 잘못된 핵심 설명을 상쇄하지는 못합니다. 공개한 범위 전체의 남은 작업과 <a href="/updates/">실제 변경 기록</a>을 함께 봅니다.</p>
<p>실제 제출 과정은 <a href="https://support.google.com/adsense/answer/12176698?hl=ko">Google의 사이트 수정·검토 안내</a>와 현재 계정 화면을 따르세요. 이 페이지에서는 검토 요청을 실행하지 않습니다.</p>`, "2026-10-27"));

write("start-guide/index.html", staticPage("애드센스 사이트 시작 가이드", "운영 주체·독자 질문·실제 자료·허브 역할과 공개·계정 확인을 나누는 시작 안내입니다.", "/start-guide/", `
<p>운영 목적과 실제 확보 자료에서 시작합니다. 도메인 연식·글 수·고정 준비 일정을 합격 조건으로 보지 않고 현재 확인할 질문과 남은 작업을 나눕니다. <a href="/approval/#hub-entry-paths">상황별 출발점</a>에서 해당 경로를 고를 수 있습니다.</p>
<h2>처음 시작할 때 추천하는 순서</h2>
<ol>
  <li><a href="/guides/domain-and-trust/">운영 주체·제작 방식·정정 경로</a>를 실제 정보로 정리합니다. 이름이나 사업자 표시를 전문성 인증으로 바꾸지 않습니다.</li>
  <li><a href="/guides/topic-selection-for-adsense/">독자 질문과 확보 자료</a>로 쓸 답과 더 조사할 내용을 나눕니다.</li>
  <li>실제 기능·문의·광고 도입 상태에 맞게 개인정보·쿠키 등 필요한 안내를 작성합니다. 문서 존재만으로 준수 완료를 표시하지 않습니다.</li>
  <li><a href="/guides/thin-category-pages/#hub-decisions">허브 유지·통합·보류</a>를 판단합니다. 모든 사이트가 이 사이트의 카테고리 수나 문서 조합을 따라야 하는 것은 아닙니다.</li>
  <li>공개 화면·목적지·모바일을 확인하고, Search Console의 검색 상태와 AdSense 계정 심사는 각각 따로 확인합니다.</li>
</ol>
<h2>처음부터 피해야 할 구성</h2>
<ul><li>제목만 다르고 본문 흐름이 같은 짧은 글을 많이 발행하지 않습니다.</li><li>광고 클릭, 수익 보장, 승인 보장처럼 정책상 오해를 부를 표현을 쓰지 않습니다.</li><li>비어 있는 메뉴, 임시 페이지, 접근할 수 없는 글을 공개 상태로 두지 않습니다.</li><li>공식 정책을 확인하지 않은 단정적인 승인 조건을 적지 않습니다.</li></ul>
<h2>기간보다 먼저 확인할 조건</h2>
<p>핵심 자료가 없으면 집필보다 조사가, 잘못된 연결이 있으면 메뉴 확대보다 목적지 수정이 먼저일 수 있습니다. 수정한 원본과 공개 배포, 실제 운영 결정과 계정 상태를 구분해 <a href="/guides/pre-apply-checklist/">남은 작업과 미확인</a>을 기록합니다. 이 안내에서는 정해진 일수 뒤 재검토를 자동 결정하거나 검토 요청을 실행하지 않습니다.</p>`, "2026-10-28"));

write("official-resources/index.html", staticPage("공식 자료 활용 안내", "본문 품질·정책·개인정보·수익 지표·인증·배포 문제에 맞는 공식 원문과 확인 범위를 고릅니다.", "/official-resources/", `
<p>먼저 확인할 질문을 정한 뒤 그 질문에 맞는 원문으로 이동하세요. 공식 자료가 모든 사이트의 승인 여부를 판정해 주지는 않습니다. 이 페이지는 원문을 찾는 안내이고, 실제 주장과 근거의 대조 기록은 <a href="/sources/#claim-evidence-records">출처 및 검증 기록</a>에서 확인할 수 있습니다.</p>
<h2 id="resource-selection" tabindex="-1">질문에 맞는 공식 자료</h2>
<p>아래 확인 상태는 <time datetime="2026-10-28">2026-10-28</time> 개정 때의 범위입니다. 원문 열람과 계정별 적용·법률 검토·문제 해결은 서로 다릅니다.</p>
<div class="article-table-scroll" role="region" aria-label="질문별 공식 원문과 확인 범위" tabindex="0"><table><caption>원문을 읽기 전에 무엇을 확인할지 정합니다</caption><thead><tr><th scope="col">확인할 질문</th><th scope="col">공식 원문</th><th scope="col">이번 확인과 남은 범위</th></tr></thead><tbody>
<tr><th scope="row">본문이 실제 답을 주고 탐색이 정확한가?</th><td><a href="https://support.google.com/adsense/answer/10015918?hl=ko">AdSense 콘텐츠 및 사용자 환경</a></td><td>원문 열람. 글·표·이미지 개수를 승인 점수로 환산하는 자료가 아닙니다.</td></tr>
<tr><th scope="row">콘텐츠·행동·개인정보 관련 정책은 어디서 보나?</th><td><a href="https://support.google.com/publisherpolicies/answer/10502938?hl=ko">Google 게시자 정책</a></td><td>원문 열람. 개별 페이지의 문맥·권리·적용 조항은 별도로 대조합니다.</td></tr>
<tr><th scope="row">광고를 도입할 때 개인정보 안내에 무엇을 대조하나?</th><td><a href="https://support.google.com/adsense/answer/1348695?hl=ko">AdSense 개인정보처리방침 필수 콘텐츠</a></td><td>원문 열람. 광고 관련 요구와 이 사이트의 현재 처리·미도입 상태를 구분합니다. 완성 법률 서식이 아닙니다.</td></tr>
<tr><th scope="row">페이지 RPM의 분모는 무엇인가?</th><td><a href="https://support.google.com/adsense/answer/112030?hl=ko">AdSense 페이지 RPM</a></td><td>수식 대조. 실제 계정 수입·수익 전망을 확인한 것은 아닙니다.</td></tr>
<tr><th scope="row">Search Console 소유권은 어떻게 확인하나?</th><td><a href="https://support.google.com/webmasters/answer/9008080?hl=ko">Search Console 사이트 소유권 확인</a></td><td>원문 재확인 미완료. 이번 조회가 시간 초과되어 현재 세부 내용을 확인 완료로 표시하지 않습니다. 실제 속성·계정 안내와 원문을 다시 확인하세요.</td></tr>
<tr><th scope="row">Pages에 도메인을 연결할 때 어디를 확인하나?</th><td><a href="https://developers.cloudflare.com/pages/configuration/custom-domains/">Cloudflare Pages 커스텀 도메인</a></td><td>원문 열람. 루트·하위 도메인의 절차와 현재 설정을 구분합니다. 링크를 읽었다고 DNS·메일·계정 설정을 바꾸지 않습니다.</td></tr>
</tbody></table></div>
<h2 id="read-source-context" tabindex="-1">원문과 내 상황을 대조하기</h2>
<ol><li>확인할 문장·질문과 대상 제품·지역·계정 상태를 적습니다.</li><li>원문의 제목·해당 절·조건·예외를 읽습니다. 한국어와 다른 언어의 뜻이 충돌하면 번역만으로 단정하지 않습니다.</li><li>정의나 정책 요구와 이 사이트의 실제 관찰·운영자 설명을 나눕니다. 공식 문서에 없는 수치나 기한을 덧붙이지 않습니다.</li><li>확보하지 못한 원문이나 계정 자료는 재확인 대상으로 남깁니다. 링크가 열린다는 사실만으로 주장이 입증된 것은 아닙니다.</li></ol>
<p>이 목록은 정기 자동 링크 검사나 정책 변경 알림을 실행하지 않습니다. 중요한 설정 변경이나 검토 요청 전에는 현재 원문·계정 안내를 다시 확인해야 합니다.</p>
<h2>적용 기록을 확인하려면</h2>
<p><a href="/sources/#claim-evidence-records">실제 주장별 근거 대조</a>는 이 사이트의 수식·저장 코드·운영 미정 사항을 구분합니다. 출처가 틀렸거나 더는 주장을 뒷받침하지 않는다면 <a href="/contact/#correction-request">오류·출처 정정 요청</a>으로 알려 주세요. 공식 링크는 Google과의 제휴나 이 사이트의 승인 인증을 뜻하지 않습니다.</p>`, "2026-10-28"));

write("approval-hub/index.html", staticPage("애드센스 승인 준비 허브", "현재 문제와 확보한 자료에 따라 본문·접근·운영 정보·검토 근거의 상세 절로 연결합니다.", "/approval-hub/", `
<p>어디부터 확인할지 정했다면 해당 상세 절로 바로 이동하세요. 이 허브는 자료를 고르는 입구이며 모든 문서를 따라 읽는 승인 과정이나 자동 사이트 검사기가 아닙니다.</p>
<h2 id="review-evidence-routes" tabindex="-1">현재 문제와 확인 자료</h2>
<div class="article-table-scroll" role="region" aria-label="현재 문제별 확인 자료와 상세 경로" tabindex="0"><table><caption>해당하는 문제만 골라 확인합니다. 표의 행 수는 승인 요건이 아닙니다.</caption><thead><tr><th scope="col">현재 문제</th><th scope="col">먼저 확보할 자료</th><th scope="col">상세 검사</th></tr></thead><tbody>
<tr><th scope="row">사이트가 열리지 않음</th><td>정확한 URL·오류 문구·응답·발생 시각</td><td><a href="/guides/site-down-unavailable/#symptom-layers">접근 실패 계층 구분</a></td></tr>
<tr><th scope="row">본문이 반복되거나 답이 없음</th><td>제목의 질문·현재 원문·독자가 얻는 답</td><td><a href="/guides/low-value-content-fix/#site-audit">실제 본문 결함 대조</a></td></tr>
<tr><th scope="row">누가 만들었는지 불분명함</th><td>운영 주체·제작 방식·확인한 근거·정정 경로</td><td><a href="/guides/domain-and-trust/#operator-record">운영 정보의 확인 범위</a></td></tr>
<tr><th scope="row">개인정보 안내가 실제 기능과 다름</th><td>저장·전송·검색·문의·광고 도입 현황</td><td><a href="/guides/privacy-policy-for-adsense/#processing-inventory">실제 처리 흐름 대조</a></td></tr>
<tr><th scope="row">수정한 내용이 공개 화면에 안 보임</th><td>변경 문서·배포 버전·최종 URL과 실제 본문</td><td><a href="/guides/adsense-approval-roadmap/#publish-boundary">소스와 공개 배포 구분</a></td></tr>
<tr><th scope="row">다 고쳤는지 판단하기 어려움</th><td>확인됨·미완료·미확인과 각 근거</td><td><a href="/guides/pre-apply-checklist/">재검토 전 근거 점검</a></td></tr>
</tbody></table></div>
<h2 id="record-not-score" tabindex="-1">기록은 무엇을 바꿨는지 남깁니다</h2>
<p><a href="/tools/approval-score/">콘텐츠 점검 작업표</a>에 URL·독자 질문·현재 근거·다음 수정과 확인일을 남길 수 있습니다. 사용자 입력을 보관하는 도구이지 본문을 자동 검사하거나 Google에 제출하는 기능이 아닙니다. 비밀번호·계정 ID·인증 코드·민감한 원본 자료는 넣지 마세요.</p>
<figure class="article-visual"><img src="/assets/review-evidence-workbench-20261027.jpg" alt="URL·질문·근거·수정 작업을 기록하는 실제 작업표의 입력 전 화면" loading="lazy" width="1425" height="976"><figcaption>2026-10-27 구현 당시 빈 작업표 화면입니다. 입력 예시나 체크 수를 승인 점수로 사용하지 않습니다. 현재 화면은 달라질 수 있습니다.</figcaption></figure>
<h2>과거 기록과 현재 확인을 구분합니다</h2>
<p><a href="/guides/privacy-cookie-page-example/">정책 페이지 실제 사례</a>는 원문과 수정 판단을, <a href="/guides/seven-day-pre-apply-log-example/#actual-observations">수정 후 관찰 사례</a>는 실제 검사와 미확인을 보여 줍니다. 사례의 검사 날짜를 현재 사이트의 계정 확인일로 옮겨 쓰지 않습니다.</p>
<p>Search Console 소유권 인증·검색 색인과 AdSense 사이트 연결·심사는 구분합니다. 공식 도움말에는 Search Console 인증을 통한 사이트 연결 방법도 안내하지만, 현재 계정에서 어떤 방법과 상태가 적용되는지는 별도 확인해야 합니다. 공개 메타 태그 하나로 연결 완료나 승인 결과를 판정하지 않습니다.</p>
<p>공식 자료 확인일: <time datetime="2026-10-28">2026-10-28</time>. <a href="https://support.google.com/adsense/answer/12176698?hl=ko">Google의 사이트 수정·검토 안내</a>를 확인하세요. 이 페이지에서는 계정 상태 조회·설정 변경·검토 요청을 실행하지 않습니다.</p>`, "2026-10-28"));

write("faq/index.html", staticPage("애드센스 초보자 FAQ", "글 수·이미지·도메인·검색 인증·AI 초안·재검토 시점을 구분하고 상세 근거로 연결합니다.", "/faq/", `
<p>짧은 답으로 먼저 구분하고 필요한 상세 설명으로 이동하세요. 답변은 이 사이트의 편집 안내이며 개별 사이트의 승인 여부를 대신 결정하지 않습니다.</p>
<h2 id="faq-article-count" tabindex="-1">글은 몇 개, 몇 자가 있어야 하나요?</h2>
<p>이 FAQ에서는 임의의 개수·분량을 합격선으로 정하지 않습니다. 공식 안내의 충분한 고유 콘텐츠를 ‘카테고리마다 몇 편’으로 바꾸지 않고 각 문서가 독자의 질문에 실제 답을 제공하는지 확인합니다. <a href="/guides/minimum-content-myth/">공식 요건·내부 목표·개인 사례 구분</a></p>
<h2 id="faq-images" tabindex="-1">이미지나 표를 넣으면 해결되나요?</h2>
<p>같은 일반론을 표로 바꾸거나 장식 이미지를 추가한 것만으로 빠진 답이 생기지는 않습니다. 실제 화면·계산·비교를 이해하는 데 필요할 때 사용하고 출처·사용 권리·대체 설명과 작은 화면의 가독성을 확인합니다. <a href="/guides/approval-friendly-article-format/">실제 원문을 문제 해결 글로 고친 사례</a></p>
<h2 id="faq-domain" tabindex="-1">새 도메인이면 불리한가요?</h2>
<p>생성일만으로 승인·거절을 판정하거나 임의의 숙성 기간을 제시하지 않습니다. 계정 가입 요건과 대상 사이트·콘텐츠·정책을 확인해야 하며, 도메인 연식이나 사업자 표시를 전문성·광고 승인 인증으로 보지 않습니다. <a href="/guides/domain-and-trust/">운영 정보와 신뢰 근거의 차이</a></p>
<h2 id="faq-search" tabindex="-1">Search Console 인증과 색인이 승인 조건인가요?</h2>
<p>소유권 인증, 검색 색인, AdSense 사이트 연결과 심사는 각각 다른 상태입니다. 공식 안내의 Search Console 인증을 통한 연결 방법도 검색 색인 완료가 광고 승인을 뜻한다는 설명은 아닙니다. 현재 계정의 연결 방법·안내는 별도로 확인하세요. <a href="/guides/cloudflare-search-console-example/">DNS·HTML 소유권 인증</a> · <a href="/guides/indexing-before-adsense/">검색 상태와 광고 크롤러 구분</a></p>
<h2 id="faq-ai" tabindex="-1">AI 초안은 어떻게 검토해야 하나요?</h2>
<p>문체가 자연스러운지보다 정의·숫자·출처가 맞고 실제 경험과 가상 예시를 정확히 구분했는지 봅니다. 존재하지 않는 사용 경험·작성자·전문가 검수를 만들어 붙이지 않습니다. AI 지원 공개나 출처 링크만으로 정확성과 고유 가치가 검증된 것도 아닙니다. <a href="/guides/avoid-ai-like-writing/">주장별 근거 대조와 초안 검증</a></p>
<h2 id="faq-review" tabindex="-1">거절 후 며칠 뒤 다시 요청하나요?</h2>
<p>이 사이트가 정한 고정 대기 일수는 없습니다. 받은 안내에 맞는 실제 결함을 수정하고 공개 반영·남은 미완료·미확인과 현재 계정의 별도 지시를 확인합니다. 수정 직후인지 오래 기다렸는지만으로 재검토 준비를 판단하지 않습니다. <a href="/guides/pre-apply-checklist/">요청을 보류할 조건과 근거 점검</a></p>
<h2>답변의 근거와 범위</h2>
<p>공식 자료 확인일: <time datetime="2026-10-28">2026-10-28</time>. <a href="https://support.google.com/adsense/answer/9724?hl=ko">AdSense 자격 요건</a>, <a href="https://support.google.com/adsense/answer/10015918?hl=ko">콘텐츠·사용자 환경</a>, <a href="https://support.google.com/adsense/answer/12176698?hl=ko">사이트 수정·검토 안내</a>를 참고했습니다. 실제 계정의 심사 결과나 모든 지역·상품의 조건을 이 답변으로 확인한 것은 아닙니다.</p>
<p>Alpha AdSense는 Google 공식 서비스가 아닙니다. 제작 방식과 AI 지원 범위는 <a href="/about/#content-process">운영·제작 안내</a>, 실제 변경은 <a href="/updates/">업데이트 기록</a>에서 확인할 수 있습니다.</p>`, "2026-10-28"));

write("next-steps/index.html", staticPage("상황별 다음 단계", "도메인만 있는 상태·본문 중복·거절 안내·승인 후 운영에서 다음 행동과 보류 조건을 고릅니다.", "/next-steps/", `
<p>지금 막힌 상황 하나를 고르면 상세 문서로 바로 이동합니다. 아래 항목은 필수 완료 단계나 승인 신호가 아니며 이미 확인한 작업을 처음부터 되풀이할 필요는 없습니다.</p>
<nav class="article-toc" aria-label="현재 상황 선택"><h2>현재 상황</h2><ul>${nextStepPaths.map(item => `<li><a href="#${item.id}">${esc(item.title)}</a></li>`).join("")}</ul></nav>
${nextStepPaths.map(nextStepPath).join("")}
<h2>상태를 모르겠다면</h2>
<p>현재 확인할 질문과 자료가 부족하면 <a href="/approval-hub/#review-evidence-routes">문제별 확인 자료</a>에서 필요한 정보를 먼저 고릅니다. 기본 운영 목적부터 정해야 한다면 <a href="/start-guide/">시작 안내</a>로 돌아가세요. 이 두 페이지를 모든 문서 앞에서 거쳐야 하는 것은 아닙니다.</p>
<p>선택·기록·화면 검사만으로 Google의 원인이나 승인 결과를 확정하지 않습니다. 실제 배포·운영 결정·계정 확인을 나눠 남기고, 미확인 상태를 ‘문제없음’으로 채우지 않습니다. 이 페이지는 계정 변경·광고 조작·자동 감시·검토 요청을 실행하지 않습니다.</p>`, "2026-10-28"));

const searchableStaticPages = [
  ["/", "홈", site.description, "시작"],
  ["/start-guide/", "애드센스 사이트 시작 가이드", "운영 주체·독자 질문·확보 자료·허브 역할과 남은 작업을 정하는 시작 안내입니다.", "시작"],
  ["/approval-hub/", "애드센스 승인 준비 허브", "현재 문제에 필요한 확인 자료를 고르고 본문·접근·운영 정보·검토 근거의 상세 절로 바로 이동합니다.", "허브"],
  ["/next-steps/", "상황별 다음 단계", "도메인만 있음·본문 중복·거절 안내·승인 후 운영에서 다음 행동과 보류 조건을 고릅니다.", "허브"],
  ["/official-resources/", "공식 자료 활용 안내", "확인할 질문에 맞는 공식 원문과 열람·재확인 필요 범위를 고릅니다.", "자료"],
  ["/faq/", "애드센스 초보자 FAQ", "글 수·이미지·도메인·검색 인증·AI 초안·재검토 시점을 구분하고 상세 근거로 연결합니다.", "FAQ"],
  ["/tools/", "콘텐츠·운영 도구", "콘텐츠 작업표, RPM 계산과 운영 계획 도구를 모았습니다.", "도구"],
  ["/tools/approval-score/", "콘텐츠 점검 작업표", "글 URL, 독자의 질문, 확인 근거와 수정 작업을 기록하고 브라우저 저장과 CSV 내보내기를 제공합니다.", "도구"],
  ["/tools/rejection-diagnosis/", "애드센스 거절 사유 진단", "거절 메시지 유형별로 먼저 확인할 항목과 수정 방향을 정리합니다.", "도구"],
  ["/tools/content-planner/", "콘텐츠 발행 계획·시간표", "상황별 작업 예시와 직접 편집하는 작업·시간 예산, 계산·CSV 내보내기를 제공합니다. 승인 판정이 아닙니다.", "도구"],
  ["/checklist/", "재검토 전 점검 안내", "근거 점검 절차, URL별 작업표와 계정 확인 자료로 연결합니다. 점수로 준비 완료를 판정하지 않습니다.", "점검 안내"],
  ["/privacy/", "개인정보처리방침", "작업표의 브라우저 저장·검색 URL·문의 이메일·호스팅과 삭제 범위, 아직 정하지 않은 보관 기준을 안내합니다.", "정책"],
  ["/cookie-policy/", "쿠키 정책", "현재 저장 기술과 광고·CMP 미도입 상태, 이용자가 관리할 범위와 도입 전 확인 과제를 안내합니다.", "정책"],
  ["/editorial-policy/", "운영 원칙", "근거 대조·AI 지원·관찰과 가상 예시·수정·광고 도입 전 검토의 편집 원칙입니다.", "운영"],
  ["/sources/", "출처 및 참고자료", "실제 주장·공식 정의·공개 코드·운영자 설명과 확인 한계를 연결한 검증 기록입니다.", "자료"],
  ["/about/", "소개", "Alpha AdSense의 운영 목적, 리플리더스 운영자 정보와 편집 범위입니다.", "운영"],
  ["/contact/", "문의", "사이트 오류·일반 문의와 정정 요청에 필요한 최소 정보·연락처를 안내합니다.", "운영"]
];

const searchIndex = [
  ...searchableStaticPages.map(([url, title, description, category]) => ({ url, title, description, category })),
  ...Object.entries(categories).map(([key, category]) => ({ url: `/${key}/`, title: category.title, description: category.description, category: "카테고리" })),
  ...articles.map(([cat, slug, title, description, points]) => ({
    url: slugPath(slug),
    title,
    description: `${description} ${revisedGuides[slug] ? revisedGuides[slug].sections.map((section) => section.title).join(" ") : points.join(" ")}`,
    category: categories[cat].title
  }))
];

write("search-index.json", JSON.stringify(searchIndex, null, 2));

write("search/index.html", staticPage("사이트 검색", "콘텐츠·배포·정책 문서를 찾습니다.", "/search/", searchPage, "2026-10-27"));

write("sitemap/index.html", staticPage("전체 글 목록", "Alpha AdSense의 주요 허브, 정책 페이지, 카테고리, 가이드 글을 한눈에 볼 수 있는 사용자용 사이트맵입니다.", "/sitemap/", `
<h2>주요 허브</h2>
<ul class="site-map-list">${searchableStaticPages.slice(0, 6).map(([url, title, description]) => `<li><a href="${url}">${esc(title)}</a><span>${esc(description)}</span></li>`).join("")}</ul>
<h2>카테고리</h2>
<ul class="site-map-list">${Object.entries(categories).map(([key, category]) => `<li><a href="/${key}/">${esc(category.title)}</a><span>${esc(category.description)}</span></li>`).join("")}</ul>
<h2>가이드 글</h2>
<ul class="site-map-list">${articles.map(([cat, slug, title, description]) => `<li><a href="${slugPath(slug)}">${esc(title)}</a><span>${esc(categories[cat].title)} · ${esc(description)}</span></li>`).join("")}</ul>`));

write("updates/index.html", staticPage("업데이트 기록", "사이트 구조, 콘텐츠, 이미지, 정책 페이지, 검색 기능 보강 이력을 정리한 운영 기록입니다.", "/updates/", `
<h2>최근 업데이트</h2>
<ol class="update-list">
  <li><strong>2026-10-29</strong><span>운영자가 확인한 사이트 오류·일반 문의 용도를 <a href="/contact/">문의</a>와 <a href="/privacy/">개인정보 안내</a>에 반영했습니다. Cloudflare Pages Web Analytics 비활성과 제한된 공개 요청 관찰을 <a href="/privacy/#hosting-check">호스팅 확인 범위</a>·<a href="/cookie-policy/">쿠키 안내</a>에 구분했습니다. 보관·삭제 기준, 전체 보안/로그·적용 계약과 현재 AdSense 상태는 별도 미확인이며 설정 변경·메일 발송/삭제·재검토 요청은 하지 않았습니다.</span></li>
  <li><strong>2026-10-28</strong><span><a href="/official-resources/">공식 자료 안내</a>는 질문별 원문 선택과 확인 범위로, <a href="/sources/">출처</a>는 실제 주장·근거·한계 기록으로 구분했습니다. 8개 운영·정책 문서의 긴 공통 관리 부록을 제거하고 소개에 사업자 상세, 문의에 정정 경로를 남겼습니다. 개인정보·쿠키·약관·면책의 고유 본문과 보관 미정·처리 범위는 유지했습니다. 운영 원칙의 고정 글 형식·전수 검수 오해도 바로잡았습니다. 이번 정리가 보관 기준 확정·법률 검토·계정 확인·재검토 요청을 뜻하지 않습니다.</span></li>
  <li><strong>2026-10-28</strong><span>여섯 카테고리의 반복 경로표·구성 개수 표시를 줄이고 추천 목록과 나머지 문서를 나눴습니다. <a href="/approval-hub/">승인 준비 허브</a>는 문제별 확인 자료, <a href="/next-steps/">상황별 다음 단계</a>는 다음 행동·보류 조건으로 구분했습니다. <a href="/faq/">FAQ</a>의 글 형식·도메인·검색 상태·재검토 설명과 검색 요약을 맞췄습니다. 34개 개별 본문의 기계적 반복 탐색과 일부 역할 비교를 수행했으나 모든 주장·외부 출처·실제 이용 성과를 전수 검증한 것은 아닙니다. URL 병합·계정 변경·재검토 요청은 하지 않았습니다.</span></li>
  <li><strong>2026-10-28</strong><span><a href="/guides/rejection-message-map/">거절 안내 해석</a>과 <a href="/guides/low-value-rejection-rewrite-example/">실제 허브 글 개정 사례</a>를 재작성했습니다. 원문·관찰·가설·미확인을 나누고 실제 과거 문장·편집 판단·공개 화면을 연결했습니다. 34개 가이드 모두 개별 본문으로 전환해 예전 공통 본문 자동 삽입을 제거했습니다. 개정 수·검사 통과가 전체 개선 완료나 승인 판정은 아니며 실제 운영·계정 확인과 재검토 요청은 별도입니다.</span></li>
  <li><strong>2026-10-28</strong><span><a href="/guides/domain-and-trust/">도메인·운영자 신뢰 확인</a>과 <a href="/guides/thin-category-pages/">허브 편집 판단</a>을 재작성했습니다. 승인·거절 허브에 상황별 출발점을 추가하고 작성·검토 표시를 실제 AI 지원·제작 방식 안내로 연결했습니다. 시작 안내의 고정 3일 일정을 남은 조건별 작업으로 바꿨습니다. 사업자 외부 조회·메일 수신 검증·URL 병합·계정 변경·재검토 요청은 실행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/disclaimer-page-guide/">면책 안내 편집</a>과 <a href="/guides/privacy-cookie-page-example/">정책 페이지 실제 개정 사례</a>를 개별 본문으로 바꿨습니다. 실제 원문·수정 판단·공개 화면을 연결하고 공통 면책과 열람·동의의 차이를 정리했습니다. 이메일 보관 기준 미정 등 실제 운영 과제는 면책 문구로 해결 처리하지 않습니다. 기존 URL을 유지하며 재검토 요청은 수행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/privacy-policy-for-adsense/">개인정보 처리 흐름</a>과 <a href="/guides/cookie-notice-basics/">쿠키·동의 검사</a>를 개별 본문으로 재작성했습니다. 실제 저장·검색 URL·이메일·호스팅과 삭제 범위를 나누고 공개 개인정보·쿠키 안내를 맞췄습니다. 검색에 민감정보 주의 안내를 추가했습니다. 광고·CMP는 설치하지 않았으며 보관·계약·법률 확인 과제와 실제 계정 상태는 별개입니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/traffic-quality/">광고 트래픽 근거 조사</a>와 <a href="/guides/prohibited-content-check/">콘텐츠 정책 분류</a>를 재작성했습니다. 유입 변화·무효 트래픽·게재 제한과 정책 위반·게시자 제한사항·미확인을 구분했습니다. 정책 허브와 거절 진단도 연결하고 승인 때만 숨기는 안내를 제거했습니다. 실제 계정 조회·광고 클릭·유입 차단·재검토 요청은 수행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/after-approval-first-settings/">승인 후 점검</a>과 <a href="/guides/ad-placement-principles/">광고 배치 검사</a>를 재작성했습니다. 상태·미리보기·복구를 나누고 실제 광고가 아닌 가상 배치도와 도구 이용 검사를 추가했습니다. 실제 승인·계정 설정·광고 활성화는 수행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/content-calendar-30-days/">발행 계획</a>과 <a href="/guides/glossary-for-beginners/">운영 용어집</a>을 재작성했습니다. 가상 시간 예산과 지표별 분모·단위 비교를 추가하고 <a href="/tools/content-planner/#editorial-planner">편집 가능한 시간표</a>를 연결했습니다. 시간표 입력은 저장·전송하지 않으며 승인 판정·자동 발행 기능은 없습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/internal-linking-guide/">내부 링크 편집</a>과 <a href="/guides/evergreen-content-plan/">기존 글 갱신</a>을 재작성했습니다. 실제 허브 연결 변경과 배포 사례, 절 주소 검사와 날짜·관찰 기록 보존을 추가했습니다. 링크 수·고정 갱신 주기를 승인 기준으로 삼지 않습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/topic-selection-for-adsense/">자료 기반 주제 선정</a>과 <a href="/guides/avoid-ai-like-writing/">AI 초안 검증</a>을 재작성했습니다. 확보 자료로 정한 실제 편집 판단, 주장별 근거 대조와 가상 사례 표시를 추가했습니다. AI 문체 숨기기나 승인·수익 예측을 목표로 삼지 않습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/navigation-issue-fix/">메뉴·링크 오류 복구</a>와 <a href="/guides/site-down-unavailable/">사이트 접근 오류 진단</a>을 증상별 재현·근거·복구 절차로 재작성했습니다. 공개 경로와 HTTP 응답의 실제 관찰을 기록하고 보안 전체 완화 안내를 제거했습니다. DNS·보안 설정과 심사 계정은 변경하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/adsense-approval-roadmap/">준비 작업 순서</a>와 <a href="/guides/seven-day-pre-apply-log-example/">수정 후 관찰 기록</a>을 재작성했습니다. 고정 준비 기간을 선행 조건·병행 작업·재검사 조건으로 바꾸고, 실제 변경과 가상 해석 사례를 구분했습니다. 기존 주소를 유지하며 실제 재검토 요청은 실행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/minimum-content-myth/">글 수·분량 기준의 오해</a>와 <a href="/guides/pre-apply-checklist/">재검토 전 근거 점검</a>을 재작성했습니다. <a href="/checklist/">점검 안내</a>는 상세 절차와 기록 도구의 입구로 정리하고, 대표 글 수·점검 시간·색인을 합격선으로 사용하지 않습니다. 실제 검토 요청은 실행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/site-structure-before-apply/">구조 검사 절차</a>와 <a href="/guides/homepage-for-review/">홈 개편 실제 사례</a>를 각각 재작성했습니다. 전자는 링크·키보드·모바일 검사, 후자는 실제 화면과 편집 판단으로 역할을 나눴습니다. 기존 주소를 유지하며 메뉴·글 수를 승인 합격선으로 제시하지 않습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/duplicate-content-cleanup/">중복 정리와 URL 병합 절차</a>, <a href="/guides/indexing-before-adsense/">색인 상태별 대응</a>를 개별 본문으로 재작성했습니다. 실제 문서 역할 비교·공개 응답과 미적용 설정·가상 사례를 구분했습니다. 실제 URL 병합이나 계정 색인 요청은 실행하지 않았습니다.</span></li>
  <li><strong>2026-10-27</strong><span>홈을 문제별 출발점·개정 가이드·운영 도구 중심으로 정리했습니다. 공통 하단에 소개·문의 링크를 추가하고, 검색에 제목 일치 우선순위, 결과 페이지 이동과 불러오기 실패 시 재시도를 반영했습니다. <a href="/guides/site-structure-audit-example/#follow-up-navigation">후속 검사 기록</a>에서 최초 감사와 변경 결과를 구분합니다.</span></li>
  <li><strong>2026-10-27</strong><span>기존 점수 진단을 <a href="/tools/approval-score/">콘텐츠 점검 작업표</a>로 교체하고, <a href="/guides/rpm-cpc-basics/#rpm-calculator">RPM·광고 CTR 계산기</a>를 추가했습니다. 브라우저 저장, 편집·삭제·CSV 내보내기와 오류 검증을 제공하고 개인정보 안내에 실제 저장 범위를 반영했습니다.</span></li>
  <li><strong>2026-10-27</strong><span><a href="/guides/approval-friendly-article-format/">정보 글 편집 실제 사례</a>와 <a href="/guides/site-structure-audit-example/">실제 사이트 구조 감사</a>를 재작성했습니다. 원문 편집 판단, 공개 홈 캡처와 탐색·응답 검사 결과를 넣고 미적용 개선 과제를 구분했습니다.</span></li>
  <li><strong>2026-10-26</strong><span><a href="/guides/rpm-cpc-basics/">RPM 계산과 해석</a>, <a href="/guides/cloudflare-gabia-domain-guide/">가비아·Cloudflare 연결</a>, <a href="/guides/cloudflare-search-console-example/">Search Console 인증 해결</a> 문서를 개별 본문으로 재작성했습니다. 계산 예시와 DNS·HTML 확인 범위, 실패별 점검 순서를 추가했습니다.</span></li>
  <li><strong>2026-10-26</strong><span><a href="/guides/low-value-content-fix/">가치가 낮은 콘텐츠 해결 글</a>을 실제 사이트 점검, 글별 편집 판단, 수정 전후 예시 중심으로 재작성했습니다. 이 글부터 개별 수정일을 관리하며, 다른 가이드의 개편은 순차 진행합니다.</span></li>
  <li><strong>2026-07-13</strong><span>쿠키 고지, 금지 콘텐츠, 면책 고지, 최종 점검표, 30일 콘텐츠 계획표 등 정책·자료실 클러스터의 판단표와 실행 체크리스트를 보강했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>주제 선정, 내부 링크, AI 문장 편집, 에버그린 콘텐츠, RPM/CPC 이해 등 글쓰기·수익화 클러스터의 사례·표·체크리스트를 보강했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>탐색 문제, 접근 불가, 중복 콘텐츠, 빈 카테고리, 거절 메시지별 대응표 등 거절 해결 클러스터의 사례·표·체크리스트를 보강했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>승인 로드맵, 사이트 구조 점검, 낮은 가치 콘텐츠 수정, 글 구성 템플릿, 정책 페이지 예시 등 핵심 5개 가이드의 사례·표·체크리스트를 심화 보강했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>방문자 상황별 다음 행동을 안내하는 홈 경로 블록과 /next-steps/ 허브 페이지를 추가했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>홈과 승인 준비 허브에 이미지형 대표 카드, 신청 전 로드맵 표, 카테고리별 확인 기준 표를 추가해 탐색성과 시각적 완성도를 보강했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>리플리더스 사업자 정보를 전역 푸터와 필수 정책 페이지에 반영하고, 소개·문의·개인정보·쿠키·약관·면책·운영 원칙·출처 페이지의 본문을 확장했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>내부 검색, 사용자용 사이트맵, 업데이트 기록 페이지를 추가했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>승인된 레퍼런스 구조를 참고해 시작 가이드, 공식 자료 안내, 승인 준비 허브, FAQ를 추가했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>가이드 글에 작성자, 업데이트 날짜, Article 및 Breadcrumb 구조화 데이터를 추가했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>핵심 글에 자체 제작 설명 이미지 8개를 추가했습니다.</span></li>
  <li><strong>2026-07-13</strong><span>쿠키 정책, 운영 원칙, 면책 고지, 출처 페이지를 보강했습니다.</span></li>
</ol>
<h2>운영 기준</h2>
<p>업데이트 기록은 승인 보장을 위한 장식이 아니라 실제 관리 기준을 남기기 위한 페이지입니다. 정책이나 플랫폼 화면이 바뀌면 관련 글의 본문, 이미지, 내부 링크를 함께 확인하고 필요한 경우 수정일을 갱신합니다.</p>
<h2>다음 점검 예정</h2>
<ul><li>커스텀 도메인의 HTTPS 상태 확인</li><li>Search Console sitemap 제출 후 주요 URL 발견 여부 확인</li><li>대표 글의 모바일 화면과 표 가독성 재확인</li><li>거절 사례와 재신청 기록형 글 추가 여부 검토</li></ul>`, "2026-10-28"));

write("tools/index.html", staticPage("콘텐츠·운영 도구", "콘텐츠 수정 기록, RPM 계산과 운영 계획을 위한 도구입니다.", "/tools/", `
<p>직접 입력한 자료로 작업 기록과 계산 결과를 만듭니다. 사이트 자동 검사나 승인 확률 판정은 제공하지 않습니다.</p>
<div class="hub-list">
  <a href="/tools/approval-score/"><strong>콘텐츠 점검 작업표</strong><span>글별 질문, 근거와 수정 작업을 저장·편집하고 CSV로 내보냅니다.</span></a>
  <a href="/guides/rpm-cpc-basics/#rpm-calculator"><strong>RPM·광고 CTR 계산기</strong><span>수입, 페이지 조회수와 광고 노출수로 계산하고 결과를 내보냅니다.</span></a>
  <a href="/tools/rejection-diagnosis/"><strong>거절 사유 진단</strong><span>거절 메시지 유형을 선택하면 우선 점검할 영역과 관련 가이드를 보여 줍니다.</span></a>
  <a href="/tools/content-planner/"><strong>콘텐츠 발행 계획·시간표</strong><span>상황별 작업을 참고하고 내 작업·예상 시간과 가용 시간을 비교합니다.</span></a>
  <a href="/checklist/"><strong>최종 체크리스트</strong><span>신청 직전 필수 페이지와 기술 상태를 다시 확인합니다.</span></a>
</div>
<h2>사용 순서</h2>
<ol><li>작업표에 글마다 해결하는 질문과 필요한 수정을 기록합니다.</li><li>실제로 확인한 근거와 확인일을 남깁니다.</li><li>계산이 필요하면 같은 기간과 범위의 값으로 RPM을 검산합니다.</li><li>저장 기록은 기기 이동이나 브라우저 데이터 삭제 전에 내보냅니다.</li></ol>`, "2026-10-27"));

write("tools/approval-score/index.html", staticPage("콘텐츠 점검 작업표", "글별 질문, 확인 근거와 수정 작업을 기록하고 이 브라우저에 저장하는 작업표입니다.", "/tools/approval-score/", contentWorkbench, "2026-10-27"));

write("tools/rejection-diagnosis/index.html", staticPage("애드센스 거절 사유 진단", "거절 메시지 유형별로 먼저 확인할 항목과 수정 방향을 정리하는 진단 도구입니다.", "/tools/rejection-diagnosis/", `
<p>같은 안내라도 사이트마다 원인이 다를 수 있습니다. 아래 분류는 모든 Google 공식 오류 코드 목록이 아니며 선택만으로 원인을 확정하지 않습니다. <a href="/guides/rejection-message-map/#notice-record">받은 원문과 대상·시점 기록</a>을 먼저 확인하고 실제 재현한 결함·가설·미확인을 나누세요.</p>
<div class="tool-panel">
  <label for="reject-type"><strong>거절 유형 선택</strong></label>
  <select id="reject-type" aria-controls="diagnosis-result">
    <option value="low">가치가 낮은 콘텐츠</option>
    <option value="nav">탐색·구조 문제</option>
    <option value="access">접근 불가·다운</option>
    <option value="policy">정책 위반 의심</option>
    <option value="unknown">원인 미확인·복합 문제</option>
  </select>
</div>
<div class="diagnosis-result" id="diagnosis-result" aria-live="polite" aria-atomic="true"></div>
<h2>재신청 전 공통 원칙</h2>
<ul><li>실제 안내·관찰한 결함·가설·미확인을 구분합니다.</li><li>글 수나 정해진 형식보다 제목의 질문과 실제 답·근거를 대조합니다.</li><li>본문·목적지·접근·정책 문제를 수정하고 같은 경로에서 공개 반영을 재검사합니다.</li><li>메뉴 숨김·고정 대기 일수·작업표 완료 표시로 해결을 판정하지 않습니다. 실제 계정 지시와 남은 작업은 따로 확인합니다.</li></ul>
<h2>수정 기록에 남길 내용</h2>
<p>URL·기존 문장·확보한 근거·수정 이유·새 답·공개 위치·재검사 결과와 미확인을 남깁니다. 요소를 몇 개 추가했는지보다 무엇을 바로잡았는지 확인합니다. 기록과 수정 자체가 Google의 원인 확정이나 승인 결과는 아닙니다. 계정 ID·토큰·민감한 원본 로그는 입력하거나 공개하지 마세요.</p>
<h2>관련해서 함께 볼 페이지</h2>
<ul><li><a href="/approval-hub/">애드센스 승인 준비 허브</a></li><li><a href="/tools/approval-score/">콘텐츠 점검 작업표</a></li><li><a href="/guides/seven-day-pre-apply-log-example/">수정 후 관찰 기록 사례</a></li></ul>
<script>
(function () {
  const data = {
    low: { title: "가치가 낮은 콘텐츠: 조사 범위", priority: "제목의 질문과 실제 답·중복 대조", evidence: "URL·기존 원문·확인한 근거·수정 이유·새 답·재검사 결과와 미확인을 기록합니다.", points: ["짧음·AI 사용·이미지 부족 하나로 원인을 확정하지 않습니다.", "같은 답의 반복과 빠진 근거를 확인하고 해당 질문의 답으로 수정합니다.", "표·글 수·메뉴 숨김을 해결 판정으로 쓰지 않고 공개 결과와 계정 안내를 구분합니다."], links: [["실제 허브 글 편집 판단", "/guides/low-value-rejection-rewrite-example/#edit-ledger"], ["최초 본문 결함 대조", "/guides/low-value-content-fix/#site-audit"]] },
    nav: { title: "탐색 문제", priority: "실패 경로 재현과 목적지 확인", evidence: "출발 URL, 누른 문구, 예상·실제 목적지, 입력 방식과 화면 폭을 기록합니다.", points: ["같은 링크를 마우스·키보드·모바일에서 나누어 재현합니다.", "주소 오타, 목차 id, 가려짐과 배포 미반영을 구분합니다.", "원본을 고친 뒤 공개 화면의 같은 경로에서 재검사합니다."], links: [["탐색 오류 재현과 복구", "/guides/navigation-issue-fix/"], ["사이트 구조 검사 절차", "/guides/site-structure-before-apply/"]] },
    access: { title: "접근 불가", priority: "오류 계층과 실패 요청 확인", evidence: "정확한 URL, 오류 문구·응답 상태, 시간대와 확인 환경을 기록합니다. 일반 요청은 Google 접근 증거와 구분합니다.", points: ["DNS·인증서·리디렉션·HTTP 오류를 먼저 구분합니다.", "차단 의심 시 실패 요청과 보안 이벤트를 대조하며 보안 전체를 해제하지 않습니다.", "변경 범위를 기록하고 원래 실패한 주소의 응답과 본문을 재검사합니다."], links: [["사이트 접근 오류 진단", "/guides/site-down-unavailable/"], ["가비아·Cloudflare 연결", "/guides/cloudflare-gabia-domain-guide/"]] },
    policy: { title: "정책 위험", priority: "위반·광고 제한·미확인을 근거로 구분", evidence: "URL·실제 요소·공식 조항·확인일과 계정 안내 유형, 미확인 범위를 기록합니다.", points: ["제목만으로 판정하지 않고 페이지 전체 문맥과 권리 근거를 확인합니다.", "정책 위반과 게시자 제한사항, 계정 게재 제한 안내를 구분합니다.", "허위 보장·클릭 유도 등 실제 문제를 수정합니다. 면책 문구나 심사 때만 숨기는 방식은 해결이 아닙니다."], links: [["콘텐츠 정책 분류", "/guides/prohibited-content-check/#policy-classes"], ["계정 상태 구분", "/guides/after-approval-first-settings/#status-boundaries"]] },
    unknown: { title: "원인 미확인·복수 범위 검토", priority: "받은 안내와 관찰·가설 분리", evidence: "원문·대상·출처·받은 시각과 확인 시각, 실제 재현한 결과와 접근하지 못한 자료를 나눕니다.", points: ["계정 자료가 없으면 현재 상태를 추정해 채우지 않습니다.", "본문·탐색·접속·정책 중 실제 근거가 있는 범위부터 조사합니다.", "검색 색인·공개 응답·광고 심사와 운영 결정을 각각 확인합니다."], links: [["안내 원문 기록", "/guides/rejection-message-map/#notice-record"], ["미완료·미확인 점검", "/guides/pre-apply-checklist/"]] }
  };
  const select = document.getElementById("reject-type");
  const result = document.getElementById("diagnosis-result");
  function render() {
    const item = data[select.value];
    result.innerHTML = "<section class=\\"result-summary\\"><strong>" + item.title + "</strong><p>우선순위: " + item.priority + "</p></section><div class=\\"tool-result-grid compact\\"><article class=\\"result-card\\"><p class=\\"eyebrow\\">먼저 볼 항목</p><ul>" + item.points.map((point) => "<li>" + point + "</li>").join("") + "</ul></article><article class=\\"result-card\\"><p class=\\"eyebrow\\">수정 증거</p><p>" + item.evidence + "</p><div class=\\"mini-links\\">" + item.links.map((link) => "<a href=\\"" + link[1] + "\\">" + link[0] + "</a>").join("") + "</div></article></div>";
  }
  select.addEventListener("change", render);
  render();
}());
</script>`, "2026-10-28"));

write("tools/content-planner/index.html", staticPage("콘텐츠 발행 계획·시간표", "상황별 작업 예시와 가용 시간·예상 작업 시간을 비교하는 편집 시간표입니다.", "/tools/content-planner/", `
<p>발행 계획은 필요한 조사·집필·검증·공개 확인을 나누는 작업입니다. 아래 주차는 조정 가능한 작업 묶음 예시이며 정해진 발행량·준비 기간·승인 상태를 뜻하지 않습니다. <a href="/guides/content-calendar-30-days/#worked-budget">시간 예산의 가상 사례</a></p>
<div class="tool-panel">
  <label for="site-stage"><strong>현재 상태</strong></label>
  <select id="site-stage">
    <option value="new">도메인과 기본 페이지만 만든 상태</option>
    <option value="content">글은 있지만 깊이가 부족한 상태</option>
    <option value="reject">거절 후 재신청을 준비하는 상태</option>
  </select>
</div>
<div class="planner-output" id="planner-output"></div>
<h2>발행 계획을 지킬 때 주의할 점</h2>
<ul><li>같은 제목을 조금 바꾼 글을 여러 개 만들지 않습니다.</li><li>각 글은 하나의 독자 문제를 해결하도록 구성합니다.</li><li>발행 후에는 내부 링크와 카테고리 페이지의 읽는 순서를 함께 수정합니다.</li><li>정책이나 공식 기준을 다루는 글은 출처와 수정일을 확인합니다.</li></ul>
<h2>계획을 조정하는 기준</h2>
<p>이 도구의 30일은 편집 계획 예시이지 Google의 준비·대기 요건이 아닙니다. 30일 계획은 반드시 하루 단위로 지켜야 하는 일정표가 아니라, 승인 준비 사이트가 균형을 잃지 않도록 돕는 기준표입니다. 정책 페이지가 부족하면 글 발행보다 정책 정리를 먼저 하고, 대표 글의 깊이가 부족하면 새 글을 늘리기보다 기존 글을 보강합니다. 거절 후 재신청 단계라면 발행 속도보다 실제 결함 수정·공개 검사·미확인 항목 정리를 우선합니다.</p>
<h2>계획과 함께 확인할 자료</h2>
<ul><li><a href="/guides/content-calendar-30-days/">가용 시간과 작업으로 발행 계획 세우기</a></li><li><a href="/tools/approval-score/">콘텐츠 점검 작업표</a></li><li><a href="/sitemap/">전체 글 목록</a></li></ul>
<script>
(function () {
  const plans = {
    new: { title: "기본 구성 작업 예시", goal: "현재 운영 정보와 실제 제공할 답·자료를 확인합니다. 주차와 범위는 선행 조건에 따라 조정합니다.", weeks: ["1주차: 운영 주체·문의·실제 수집 정보를 확인하고 현재 운영에 맞게 고지합니다.", "2주차: 독자 질문과 자료를 정하고 기존 글과의 역할을 비교합니다.", "3주차: 확보한 근거로 필요한 본문을 작성하고 정의·계산·사례를 검증합니다.", "4주차: 실제 공개 본문·내부 링크·모바일 화면과 미확인 항목을 점검합니다."], links: [["자료 기반 주제 선정", "/guides/topic-selection-for-adsense/"], ["AI 초안 검증", "/guides/avoid-ai-like-writing/"], ["재검토 전 근거 점검", "/checklist/"]] },
    content: { title: "콘텐츠 보강형 30일 계획", goal: "기존 글의 빠진 답·사실·연결을 근거로 고치고 실제 공개 결과를 확인합니다. 주차는 조정 가능한 작업 묶음입니다.", weeks: ["1주차: 질문과 확보 자료를 비교해 유지·조사·재작성·병합 검토를 나눕니다.", "2주차: 핵심 정의·수치·사례를 검증하고 필요한 부분만 수정합니다.", "3주차: 다음 질문에 맞는 연결 문구와 문서·절 목적지를 확인합니다.", "4주차: 수정일·과거 관찰을 구분하고 공개 배포·모바일·남은 작업을 기록합니다."], links: [["내부 링크 편집", "/guides/internal-linking-guide/"], ["기존 글 갱신", "/guides/evergreen-content-plan/"], ["콘텐츠 점검 작업표", "/tools/approval-score/"]] },
    reject: { title: "거절 후 수정·확인 30일 계획", goal: "거절 안내와 실제 결함을 구분해 수정하고, 공개 반영과 남은 작업을 기록합니다.", weeks: ["1주차: 거절 메시지를 분류하고 수정 대상 글 목록을 만듭니다.", "2주차: 낮은 가치 또는 탐색 문제에 해당하는 글과 메뉴를 먼저 고칩니다.", "3주차: 모바일, HTTPS, sitemap, 정책 문구를 다시 확인합니다.", "4주차: 실제 변경과 재검사 결과를 정리하고 미완료 항목·계정 안내를 확인합니다."], links: [["거절 사유 진단", "/tools/rejection-diagnosis/"], ["수정 후 관찰 기록", "/guides/seven-day-pre-apply-log-example/"], ["콘텐츠 점검 작업표", "/tools/approval-score/"]] }
  };
  const select = document.getElementById("site-stage");
  const output = document.getElementById("planner-output");
  function render() {
    const plan = plans[select.value];
    output.innerHTML = "<section class=\\"result-summary\\"><strong>" + plan.title + "</strong><p>" + plan.goal + "</p></section><div class=\\"tool-result-grid\\">" + plan.weeks.map((item, index) => "<article class=\\"result-card\\"><p class=\\"eyebrow\\">Week " + (index + 1) + "</p><h3>" + item.split(':')[0] + "</h3><p>" + item.replace(/^.*?:\\s*/, '') + "</p></article>").join("") + "</div><div class=\\"mini-links planner-links\\">" + plan.links.map((link) => "<a href=\\"" + link[1] + "\\">" + link[0] + "</a>").join("") + "</div>";
  }
  select.addEventListener("change", render);
  render();
}());
</script>${editorialPlanner}`, "2026-10-27"));

write("about/index.html", staticPage("소개", "Alpha AdSense의 운영 목적과 콘텐츠 작성 원칙을 안내합니다.", "/about/", `
<p>Alpha AdSense는 애드센스 승인을 준비하는 초보 사이트 운영자를 위해 만들어진 독립 정보 사이트입니다. 승인 보장을 약속하지 않고, 공식 정책을 기준으로 사이트 구조와 콘텐츠 품질을 점검하는 방법을 정리합니다.</p>
<h2 id="operator-info" tabindex="-1">운영 주체</h2>
<p>이 사이트는 ${site.company}가 운영합니다. 아래는 운영자가 제공한 공개 사업자 정보입니다. 표시 자체가 외부 등록 조회·전문성·광고 승인을 인증하는 것은 아닙니다.</p>
<dl class="article-decisions"><dt>상호</dt><dd>${site.company}</dd><dt>대표자</dt><dd>${site.representative}</dd><dt>사업자등록번호</dt><dd>${site.businessNumber}</dd><dt>사업장 주소</dt><dd>${site.address}</dd><dt>고객센터</dt><dd><a href="mailto:${site.email}">${site.email}</a></dd></dl>
<h2 id="content-process" tabindex="-1">콘텐츠 제작·검토 방식</h2>
<p>자료 정리·초안 작성·코드 보완에는 AI 도구의 지원을 사용합니다. 공식 원문·수식·소스·공개 화면을 대조하고 직접 관찰·가상 예시·미확인 계정 상태를 구분하는 방식으로 안내를 보완합니다. 각 글의 작성·검토에 표시한 조직명은 이 운영 주체와 연결됩니다.</p>
<p>이 표시는 모든 내용이 사람 전문가의 전수 검수를 받았다는 뜻이나 전문 자격·등록 유효성·승인 성과 인증이 아닙니다. 존재하지 않는 개인 저자·경력·전문가 사진·실측 후기를 만들지 않습니다. 실제 수정 판단은 <a href="/guides/approval-friendly-article-format/">원문 편집 사례</a>와 <a href="/guides/privacy-cookie-page-example/">정책 개정 사례</a>, <a href="/updates/">변경 기록</a>에서 확인할 수 있습니다.</p>
<h2>운영 원칙</h2>
<ul><li>공식 도움말을 우선 참고합니다.</li><li>승인 꼼수보다 장기 운영에 도움이 되는 기준을 다룹니다.</li><li>수익 보장, 클릭 유도, 정책 우회 방법을 안내하지 않습니다.</li><li>정책이나 플랫폼 기능이 바뀔 수 있는 주제는 수정일과 업데이트 기록을 남깁니다.</li></ul>
<h2>다루는 범위</h2>
<p>Alpha AdSense는 애드센스 승인 준비, 거절 사유 점검, 정책 페이지 구성, 글쓰기 구조, Search Console 확인, 승인 후 초기 광고 운영을 다룹니다. 개별 사이트의 승인 결과를 대신 판단하지 않으며, 법률·세무·투자 자문도 제공하지 않습니다.</p>
<h2>독자에게 제공하는 가치</h2>
<p>이 사이트의 목표는 초보 운영자가 신청 전 스스로 점검할 수 있는 기준을 갖도록 돕는 것입니다. 그래서 단순한 요약보다 체크리스트, 사례, 도구, 공식 자료 링크를 함께 제공합니다. 독자는 각 글을 읽고 자신의 사이트에 적용할 항목과 보류할 항목을 구분할 수 있어야 합니다.</p>
<p>오류나 오래된 설명은 <a href="/contact/#correction-request">문의·정정 안내</a>로 알려 주세요. 실제 저장·검색·문의 처리의 범위는 <a href="/privacy/">개인정보처리방침</a>에서 확인할 수 있습니다.</p>`, "2026-10-28"));

write("contact/index.html", staticPage("문의", "사이트 오류·일반 문의와 내용 정정 요청을 이메일로 받습니다.", "/contact/", `
<p>이 사이트의 이메일 문의는 사이트 오류·일반 문의를 확인하고 답변하기 위한 용도입니다. 내용 오류, 오래된 정보, 링크 문제나 도구 사용 중 발견한 문제를 알려 주세요. 계약·결제 증빙이나 불필요한 개인정보를 보내는 창구로 안내하지 않습니다.</p>
<p><a href="mailto:${site.email}">${site.email}</a></p>
<h2>문의 가능 항목</h2>
<ul><li>글 내용 중 사실관계가 바뀐 부분</li><li>공식 자료 링크 변경 또는 접근 불가 문제</li><li>개인정보, 쿠키, 정책 관련 문구 수정 요청</li><li>도구 페이지의 작동 오류 또는 개선 제안</li><li>리플리더스 서비스와 관련된 일반 문의</li></ul>
<h2>답변 기준</h2>
<p>일반 문의는 접수 순서대로 확인합니다. 문의 내용에 따라 답변이 늦어질 수 있으며, 모든 문의에 개별 답변을 보장하지는 않습니다. 정책과 심사 결과는 Google AdSense의 판단에 따라 달라질 수 있으므로 개별 승인 보장, 재심사 결과 예측, 수익 보장 요청에는 답변하지 않습니다.</p>
<h2 id="correction-request" tabindex="-1">수정 요청 방법</h2>
<p>수정 요청을 보낼 때는 문제가 있는 페이지 주소, 수정이 필요한 문장, 참고할 수 있는 공식 자료나 근거를 함께 보내 주세요. 단순 의견보다 확인 가능한 근거가 있을 때 더 빠르게 검토할 수 있습니다.</p>
<p>비밀번호·인증 코드·계정 접근 정보·민감한 원본 로그는 보내지 마세요. 문의 이메일 보관·삭제 기준은 현재 미정이며 <a href="/privacy/">개인정보처리방침</a>의 처리 범위를 확인할 수 있습니다. 메일 링크를 여는 것과 실제 발송·수신·답변 확인은 서로 다릅니다.</p>
<p>운영 주체·대표자·사업자등록번호·주소는 <a href="/about/#operator-info">공개 운영자 정보</a>에서 확인할 수 있습니다.</p>`, "2026-10-29"));

write("privacy/index.html", staticPage("개인정보처리방침", "Alpha AdSense의 개인정보 처리와 쿠키, 광고 관련 고지 사항입니다.", "/privacy/", `
<p>${site.company}가 운영하는 Alpha AdSense의 현재 도구·검색·이메일 문의·호스팅 처리와 향후 광고 계획을 나누어 안내합니다. 현재 사이트 자체 코드에 광고·분석 SDK를 추가하지 않았습니다. 페이지를 제공하는 호스팅·보안 서비스의 처리는 도구 입력값 처리와 별개입니다.</p>
<h2 id="current-processing" tabindex="-1">현재 기능과 처리 범위</h2>
<div class="article-table-scroll" role="region" aria-label="현재 기능과 개인정보 처리 범위" tabindex="0"><table><caption>현재 처리와 계획을 구분합니다</caption><thead><tr><th scope="col">구분</th><th scope="col">항목과 경로</th><th scope="col">목적·범위</th></tr></thead><tbody><tr><th scope="row">문의</th><td>사용자가 이메일로 보낸 주소·내용·첨부</td><td>문의 확인·답변·수정 요청. 메일 링크를 누르는 것과 실제 발송은 다릅니다.</td></tr><tr><th scope="row">작업표</th><td>직접 입력한 URL·질문·근거·작업·상태·확인일 등</td><td>이 브라우저의 점검 기록 저장. 도구 코드에서 입력값을 서버로 보내지 않습니다.</td></tr><tr><th scope="row">계산기·시간표</th><td>직접 입력한 수치·작업과 결과</td><td>페이지 메모리에서 처리. 영구 저장·입력 전송 기능이 없습니다.</td></tr><tr><th scope="row">검색</th><td>검색어·페이지를 URL에 표시</td><td>공개 문서 자료의 브라우저 검색. 주소·방문 기록과 요청 범위는 아래 안내 참조.</td></tr><tr><th scope="row">호스팅·보안</th><td>Cloudflare를 통한 페이지·자료 요청</td><td>페이지 제공·보안 처리. 요청 정보의 처리 범위는 활성 서비스·계약에 따라 확인이 필요합니다.</td></tr></tbody></table></div>
<p>2026-10-29 운영자는 문의 메일의 용도를 사이트 오류·일반 문의로 확인했습니다. 보관·삭제 기준과 실제 메일함·백업의 처리 방법은 별도로 확정해야 하며, 문의 용도를 확인한 것만으로 삭제가 이뤄졌다고 표시하지 않습니다.</p>
<h2 id="search-requests" tabindex="-1">검색어와 요청 주소</h2>
<p>검색은 공개 검색 자료를 받아 브라우저에서 수행하고 검색어를 주소의 q 값과 방문 기록에 남깁니다. 주소 변경 자체가 항상 새 요청을 보내는 것은 아니지만 해당 주소의 새로고침·직접 접속·공유 시 검색어가 요청 URL에 포함될 수 있습니다. 검색어에 비밀번호·인증 코드·개인정보를 입력하지 마세요. 사이트 검색을 비밀 보관함으로 사용하지 마세요.</p>
<h2>보관 기간</h2>
<p>2026-10-27 현재 문의 이메일의 구체적인 보관 기한과 정기 삭제 기준은 미정입니다. 일정 기간 뒤 자동 삭제된다고 안내하지 않습니다. 실제 보관 사유·기간·삭제 방법과 메일·백업 처리 범위를 확정해 이 안내를 갱신해야 하는 운영 과제로 남아 있습니다. 개인정보 관련 문의나 삭제 요청은 아래 고객센터로 보낼 수 있습니다.</p>
<h2 id="advertising-plan" tabindex="-1">광고 적용 계획과 선택권</h2>
<p>향후 Google AdSense를 적용한다면 Google과 제3자 공급업체의 광고 쿠키·방문 기록 기반 광고, 실제 공급업체와 필요한 선택·동의 절차를 적용 전에 확인하고 이 안내를 갱신합니다. 현재 이 페이지는 광고 적용 완료나 동의 수집 완료를 표시하지 않습니다. <a href="https://myadcenter.google.com/">Google 내 광고 센터</a>의 개인 맞춤 광고 설정은 이 사이트의 모든 저장·처리를 끄거나 삭제하는 기능이 아닙니다. <a href="/cookie-policy/#advertising-consent">광고·동의 안내</a>에서 차이를 확인할 수 있습니다.</p>
<h2>제3자 제공과 외부 서비스</h2>
<p>Alpha AdSense는 이용자의 개인정보를 임의로 판매하지 않습니다. 페이지는 Cloudflare를 통해 제공하며 이메일 문의는 이용자가 선택한 메일 서비스와 수신 메일 서비스에서 처리합니다. <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare 개인정보 안내</a>와 <a href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/">제품별 쿠키 안내</a>를 참고할 수 있습니다. 공급업체의 전체 기능이 이 사이트에 활성화됐다는 뜻은 아닙니다.</p>
<h2 id="hosting-check" tabindex="-1">호스팅 설정의 확인 범위</h2>
<p>2026-10-29 이 사이트의 Cloudflare Pages 프로젝트에서 Web Analytics가 비활성 상태임을 확인했습니다. 도메인의 요청 집계와 호스팅·보안 처리는 별개이므로 분석 기능 하나가 비활성이라는 이유로 접속 정보나 서버 기록이 없다고 안내하지 않습니다.</p>
<p>일부 공개 주소에 대한 일반 요청에서는 Set-Cookie 응답과 대표적인 광고·분석 태그를 발견하지 못했고 연락처 표시용 이메일 보호 스크립트 경로를 확인했습니다. 이는 모든 지역·시간·보안 상태의 쿠키·요청을 전수 검사한 결과가 아닙니다. 자세한 제품별 설명은 <a href="https://developers.cloudflare.com/web-analytics/about/">Cloudflare Web Analytics 안내</a>를 참고할 수 있습니다.</p>
<p>Cloudflare 계정의 활성 보안·분석 기능 전체, 구체적인 로그 보관·계약상 처리 범위는 여전히 별도 확인이 필요합니다. <a href="https://www.cloudflare.com/cloudflare-customer-dpa/">공개 데이터 처리 부속 문서</a>를 읽은 것만으로 이 운영자에게 적용되는 계약·위탁·제공·국외 처리의 법적 분류가 모두 확인됐다고 표시하지 않습니다. 새 외부 서비스를 적용할 때 실제 처리와 필요한 고지를 검토합니다.</p>
<h2 id="local-tools" tabindex="-1">작업표와 계산기의 브라우저 처리</h2>
<p>콘텐츠 점검 작업표의 URL, 질문, 근거, 중복 후보, 수정 작업, 상태와 확인일은 현재 브라우저의 localStorage에 저장합니다. 이 도구의 코드는 해당 입력값을 서버로 전송하지 않으며 다른 기기와 동기화하지 않습니다. 저장이 차단되면 변경이 현재 탭에만 남을 수 있고 그 상태를 표시합니다. 도구의 전체 삭제는 이 작업표의 저장 키만 삭제합니다. 브라우저의 사이트 데이터 삭제로도 지울 수 있습니다.</p>
<p>RPM 계산기와 발행 작업 시간표의 입력·결과는 페이지 메모리에서만 처리하고 영구 저장하지 않습니다. 시간표는 새로고침하면 사라집니다. CSV 내보내기는 사용자가 실행할 때 기기에 파일을 생성하며 외부 서비스에 업로드하지 않습니다. 내보낸 파일은 이용자가 별도로 관리·삭제해야 합니다. 공용 기기나 같은 출처의 코드에서는 저장 자료에 접근할 수 있으므로 비밀번호, 인증 코드와 민감한 개인정보를 입력하지 마세요. 페이지 요청 시 호스팅·보안 서비스에서 처리하는 접속 기록은 이 도구 입력값과 별개입니다.</p>
<p>작업표 저장 키는 <code>alphaadsense.content-audit.v1</code>이며 도구가 고정 자동 만료일을 설정하지는 않습니다. 작업표 삭제는 다른 기기·내려받은 CSV·공유본·메일함·호스팅 기록을 지우지 않습니다. 저장 실패 시 성공한 것처럼 표시하지 않으며 브라우저 설정·다른 탭 변경의 영향을 받을 수 있습니다.</p>
<h2>이용자 권리</h2>
<p>이용자는 본인이 제공한 개인정보에 대해 열람, 정정, 삭제, 처리 중지를 요청할 수 있습니다. 요청이 접수되면 합리적인 범위에서 확인 후 처리합니다.</p>
<h2>문의</h2>
<p>개인정보 관련 요청은 <a href="mailto:${site.email}">${site.email}</a>로 보낼 수 있습니다. 개인정보 처리 책임자는 ${site.company} 대표 ${site.representative}입니다.</p>
<h2>사업자 정보</h2>
<p>${site.company} · 사업자등록번호 ${site.businessNumber} · ${site.address}</p>`, "2026-10-29"));

write("cookie-policy/index.html", staticPage("쿠키 정책", "현재 브라우저 저장·호스팅 처리와 향후 광고의 고지·동의·선택·삭제 범위를 구분합니다.", "/cookie-policy/", `
<p>현재의 브라우저 저장과 호스팅·보안 처리, 향후 광고·분석 도입 시 필요한 검토를 구분합니다. 현재 사이트 자체 코드에는 광고·분석 SDK나 별도 동의 관리 플랫폼(CMP)을 추가하지 않았습니다. 안내 페이지가 있다는 사실은 동의를 수집했거나 필요한 요청 제어를 구현했다는 뜻이 아닙니다.</p>
<h2>쿠키의 역할</h2>
<p>콘텐츠 점검 작업표는 쿠키가 아닌 localStorage를 사용해 이 브라우저에 입력 기록을 남깁니다. RPM 계산기와 발행 작업 시간표 입력은 저장하지 않습니다. <a href="/privacy/#local-tools">브라우저 저장과 삭제 범위</a>에서 확인할 수 있습니다.</p>
<p>쿠키와 localStorage는 서로 다른 저장 기술입니다. 쿠키가 아니라고 필요한 고지·동의 검토가 자동으로 없어지는 것은 아닙니다. 현재 작업표 저장 목적·항목과 호스팅 처리를 나누어 확인해야 합니다.</p>
<h2 id="storage-scope" tabindex="-1">현재 저장·처리와 향후 계획</h2>
<div class="article-table-scroll" role="region" aria-label="브라우저 저장과 광고 도입 상태" tabindex="0"><table><caption>향후 계획을 현재 사용 목록으로 적지 않습니다</caption><thead><tr><th scope="col">범위</th><th scope="col">현재 상태</th><th scope="col">관리·확인</th></tr></thead><tbody><tr><th scope="row">작업표 localStorage</th><td>이 브라우저의 입력 기록 저장, 고정 자동 만료일 없음</td><td>작업표 삭제는 해당 키만 대상. 기기의 CSV 사본은 별도 관리</td></tr><tr><th scope="row">계산기·시간표</th><td>페이지 메모리 처리, 입력 영구 저장 없음</td><td>새로고침으로 사라지며 내보낸 파일은 별도 관리</td></tr><tr><th scope="row">Cloudflare 호스팅·보안</th><td>페이지 요청 처리, 활성 제품에 따라 쿠키 사용 가능</td><td>전체 제품의 쿠키를 현재 목록으로 단정하지 않음. 계정별 실제 설정은 별도 확인 필요</td></tr><tr><th scope="row">광고·분석 SDK·CMP</th><td>현재 사이트 자체 코드에 추가하지 않음</td><td>도입 전 실제 제공자·목적·지역·고지·동의와 구현 검사 필요</td></tr></tbody></table></div>
<p>2026-10-29 이 사이트 Pages 프로젝트의 Web Analytics 비활성을 확인했습니다. 이 상태가 Cloudflare 전체의 접속 정보·보안 쿠키·로그 부재를 뜻하지는 않습니다. <a href="/privacy/#hosting-check">호스팅 설정의 확인 범위</a>에 확인한 사실과 남은 로그·계약 검토를 구분했습니다. 이번 확인을 위해 분석·보안 설정을 변경하지 않았습니다.</p>
<h2 id="advertising-consent" tabindex="-1">광고 쿠키·동의·개인화 선택</h2>
<p>향후 Google AdSense 적용 시 Google과 광고 파트너가 이 사이트 및 다른 사이트의 방문 기록을 바탕으로 광고를 제공하는 데 쿠키를 사용할 수 있습니다. 실제 공급업체와 필요한 고지·동의·철회 절차를 확인해 안내를 갱신합니다. EEA·영국·스위스 이용자에게 개인 맞춤 광고를 제공할 때는 현재 공식 인증 CMP·TCF 요구를 확인해야 합니다. 인증은 모든 법률 준수의 보증이 아닙니다.</p>
<p>개인 맞춤이 아닌 광고도 목적에 따라 쿠키와 필요한 동의 검토가 관련될 수 있습니다. <a href="https://myadcenter.google.com/">Google 내 광고 센터</a>는 Google 광고 개인화 선택을 위한 외부 경로이며 이 사이트 전체의 동의 철회·저장 삭제 버튼은 아닙니다. 현재 이 사이트가 별도 광고 동의·철회 기능을 제공한다고 표시하지 않습니다.</p>
<p><a href="/guides/cookie-notice-basics/#consent-test-paths">동의 상태별 검사 안내</a>는 도입 시의 검사 계획이며 이번에 광고·CMP를 설치하고 검증한 결과가 아닙니다. 사이트 방문이나 스크롤을 필요한 동의의 대체로 취급하지 않습니다.</p>
<h2>브라우저별 관리 방법</h2>
<p>대부분의 브라우저는 설정 메뉴에서 쿠키 저장 허용, 차단, 삭제를 관리할 수 있습니다. 쿠키를 차단하면 일부 외부 서비스, 보안 확인, 광고 표시 방식이 달라질 수 있습니다. 중요한 설정을 변경하기 전에는 사용 중인 브라우저의 공식 도움말을 확인하는 것이 좋습니다.</p>
<p>브라우저 사이트 데이터 삭제는 이 기기의 저장을 관리하는 방법이며 메일함·호스팅 기록·다른 기기·내려받은 CSV 사본을 원격 삭제하지 않습니다. 저장 제한 때문에 작업표 저장이 실패할 수 있습니다. 구체적인 범위는 <a href="/privacy/#local-tools">개인정보처리방침의 브라우저 처리</a>와 <a href="/privacy/#search-requests">검색어·요청 주소 안내</a>를 참고하세요.</p>
<h2>운영 기준</h2>
<p>이 사이트는 광고 클릭을 유도하거나 광고를 메뉴, 다운로드, 다음 단계 버튼처럼 오해하게 만드는 방식을 사용하지 않습니다. 광고와 콘텐츠는 독자가 구분할 수 있도록 배치하는 것을 원칙으로 합니다.</p>
<h2>정책 업데이트</h2>
<p>광고 플랫폼, 브라우저 정책, 개인정보 관련 법령은 변경될 수 있습니다. 쿠키 정책에 영향을 주는 변경이 있으면 이 페이지와 업데이트 기록을 통해 반영합니다.</p>
<h2>문의</h2>
<p>쿠키와 광고 기술 관련 문의는 <a href="mailto:${site.email}">${site.email}</a>로 보낼 수 있습니다. 운영자는 ${site.company}입니다.</p>`, "2026-10-29"));

write("terms/index.html", staticPage("이용약관", "Alpha AdSense 이용 시 적용되는 기본 약관입니다.", "/terms/", `
<p>이 약관은 ${site.company}가 운영하는 Alpha AdSense 이용에 관한 기본 조건을 안내합니다. <a href="/privacy/">개인정보처리방침</a>, <a href="/cookie-policy/">쿠키 정책</a>, <a href="/disclaimer/">면책 고지</a>는 각각의 처리·설명 범위를 안내합니다. 사이트 방문이나 문서 열람을 별도로 필요한 개인정보·쿠키 동의를 받은 것으로 취급하지 않습니다.</p>
<h2>서비스의 성격</h2>
<p>Alpha AdSense는 애드센스 승인 준비, 콘텐츠 운영, 정책 점검, 거절 사유 해결을 돕는 정보 사이트입니다. 제공되는 글, 체크리스트, 도구 결과는 일반적인 참고 자료이며 개별 사이트의 승인, 수익, 검색 노출을 보장하지 않습니다.</p>
<h2>콘텐츠 이용 범위</h2>
<ul><li>이용자는 개인적인 학습과 사이트 점검 목적으로 콘텐츠를 열람할 수 있습니다.</li><li>출처를 밝히지 않은 무단 복제, 대량 수집, 재판매, 자동화된 스크래핑을 금지합니다.</li><li>콘텐츠를 애드센스 승인 보장 자료처럼 오해하게 재배포해서는 안 됩니다.</li><li>인용이 필요한 경우 페이지 제목과 URL을 함께 표시해야 합니다.</li></ul>
<h2>금지 행위</h2>
<ul><li>사이트 접근을 방해하거나 과도한 자동 요청을 보내는 행위</li><li>허위 정보, 악성 링크, 광고성 문의를 반복 발송하는 행위</li><li>승인 보장, 클릭 유도, 정책 우회 목적으로 콘텐츠를 변형해 배포하는 행위</li><li>운영자나 제3자의 권리를 침해하는 행위</li></ul>
<h2>변경과 중단</h2>
<p>사이트 구조, 콘텐츠, 도구, 정책 문구는 운영 상황과 외부 플랫폼 정책 변화에 따라 사전 고지 없이 수정될 수 있습니다. 필요한 경우 일부 페이지나 기능의 제공을 일시 중단할 수 있습니다.</p>
<h2>운영자 정보</h2>
<p>${site.company} · 대표자 ${site.representative} · 사업자등록번호 ${site.businessNumber} · 고객센터 <a href="mailto:${site.email}">${site.email}</a></p>`, "2026-10-28"));

write("disclaimer/index.html", staticPage("면책 고지", "독립 정보 사이트의 설명 범위·판단 한계·도구 결과와 정정 요청 경로를 안내합니다.", "/disclaimer/", `
<p>Alpha AdSense는 애드센스 승인 준비를 돕는 정보 사이트이며, Google AdSense와 공식적으로 제휴된 심사 대행 서비스가 아닙니다. 제공되는 정보는 운영자가 사이트를 점검하는 데 참고할 수 있는 기준이며, 최종 판단은 Google AdSense의 정책과 심사 결과를 따릅니다.</p>
<h2 id="result-boundaries" tabindex="-1">승인 보장 없음</h2>
<p>이 사이트의 글, 체크리스트, 도구, 사례를 따른다고 해서 애드센스 승인이 보장되지는 않습니다. 심사 결과는 사이트 주제, 콘텐츠 품질, 정책 준수, 접근성, 계정 상태, 심사 시점의 기준에 따라 달라질 수 있습니다.</p>
<h2>수익 정보의 한계</h2>
<p>RPM, CPC, 광고 배치, 트래픽 품질 등 수익 관련 정보는 일반적인 운영 참고 자료입니다. 이는 투자, 법률, 세무, 회계 자문이 아니며 개별 사이트의 수익을 예측하거나 보장하지 않습니다.</p>
<p>가상 계산의 가정·단위, 공개 화면의 확인일·범위, 직접 확인하지 못한 사항은 해당 본문에 구분합니다. 본문 오류·근거 없는 약속은 ‘참고용’이나 ‘보장 없음’이라는 문구만 붙여 유지할 대상이 아닙니다.</p>
<h2>정책 변경 가능성</h2>
<p>Google AdSense 정책, Google Search Console 기능, Cloudflare Pages 설정 방식은 변경될 수 있습니다. 따라서 중요한 신청이나 설정 변경 전에는 공식 도움말과 실제 관리자 화면을 다시 확인해야 합니다.</p>
<h2 id="evidence-types" tabindex="-1">외부 링크와 도구 결과</h2>
<p>외부 서비스의 운영과 이후 변경을 이 사이트가 직접 통제하지는 못합니다. 그렇더라도 자체 요약·연결 설명에 오류가 발견되면 검토·정정 대상입니다. 공식 자료 링크가 있다는 사실을 Google의 제휴·승인·개별 심사 판정으로 표현하지 않습니다.</p>
<p>작업표의 ‘확인 완료’는 사용자가 근거·확인일을 기록한 상태입니다. 계산 결과는 입력과 수식에 따른 값이며 미래 수익 예측이 아닙니다. 거절 진단·계획 안내와 공개 화면도 실제 계정 심사·동의 수집·법률 준수를 대신하지 않습니다. <a href="/guides/disclaimer-page-guide/#scope-next-to-evidence">도구·사례별 설명 범위</a>에서 자세히 확인할 수 있습니다.</p>
<h2 id="correction-route" tabindex="-1">정정 요청과 남은 운영 과제</h2>
<p>${site.company}는 정확한 정보를 제공하기 위해 노력하지만 개별 승인·수익 결과를 보장하지 않습니다. 오류나 오래된 설명은 <a href="/contact/">문의 안내</a> 또는 <a href="mailto:${site.email}">${site.email}</a>로 알려 주세요. 공개 URL·문제 문장·참고 근거를 보내되 비밀번호·인증 코드·민감한 원본 로그는 보내지 마세요.</p>
<p>문의 이메일의 보관·삭제 기준은 현재 미정이며 실제 기준 확정이 남아 있습니다. <a href="/privacy/">현재 개인정보처리방침</a>과 <a href="/guides/privacy-cookie-page-example/#open-operational-work">정책 개정 사례의 남은 과제</a>를 확인할 수 있습니다. 이 고지로 법적 책임의 구체적인 범위를 일괄 배제하거나 개인정보·권리·정책 문제를 해결했다고 주장하지 않습니다. 필요한 법률·계약 검토는 별도입니다.</p>`, "2026-10-28"));

write("editorial-policy/index.html", staticPage("운영 원칙", "자료 확인·AI 지원·실제 관찰과 가상 예시·정정·광고 도입 전 검토의 편집 원칙을 안내합니다.", "/editorial-policy/", `
<p>Alpha AdSense는 독자가 실제 질문을 해결할 수 있도록 자료를 정리하는 독립 정보 사이트입니다. 승인 보장·정책 우회·광고 클릭 유도·수익 보장을 제공하지 않습니다. 아래는 편집 원칙이며 모든 문서가 전문가의 전수 검수를 받았다는 인증은 아닙니다.</p>
<h2 id="editorial-evidence" tabindex="-1">질문과 근거를 먼저 확인합니다</h2>
<ul><li>독자 질문과 현재 본문이 제공하는 답을 대조합니다. 특정 글자 수나 표·이미지·체크리스트 조합을 모든 문서에 강제하지 않습니다.</li><li>정의·정책·수식은 해당 원문과 대조하고, 코드 동작·공개 화면·운영자 설명은 각 근거의 확인 범위를 밝힙니다.</li><li>외부 내용을 다시 요약하는 데 그치지 않고 실제 비교·검산·관찰 또는 독자의 다음 판단에 필요한 설명을 제공합니다.</li><li>같은 질문과 같은 답을 반복하는 문서는 역할을 비교합니다. URL 이관은 대체 답·기존 연결을 확인한 뒤 검토하며 심사 때만 숨기지 않습니다.</li></ul>
<h2 id="ai-and-review" tabindex="-1">AI 지원과 확인 범위를 공개합니다</h2>
<p>자료 정리·초안·코드 보완에 AI 지원을 사용합니다. 문체만 바꾸어 사실 검증을 대신하거나 존재하지 않는 경험·개인 저자·자격·검수 이력을 붙이지 않습니다. 조직 표기의 의미와 실제 제작 방식은 <a href="/about/#content-process">콘텐츠 제작·검토 방식</a>에서 확인할 수 있습니다.</p>
<p>공식 정의, 직접 확인한 화면·코드, 가상 예시, 미확인 계정 상태를 구분합니다. 기술 검사 통과가 실제 사용자 만족·정책 준수·광고 심사를 확인한 것은 아닙니다. 확인하지 못한 문장이나 자료를 전수 검증 완료로 표시하지 않습니다.</p>
<h2 id="editorial-corrections" tabindex="-1">수정과 근거를 함께 남깁니다</h2>
<p>근거가 바뀌거나 오류가 발견되면 문제 문장·원문·수정 이유·공개 결과와 남은 미확인을 대조합니다. 실질적으로 고친 문서의 수정일을 바꾸며 과거 관찰일·화면 날짜를 현재 사실처럼 덮어쓰지 않습니다. <a href="/sources/#claim-evidence-records">주장별 검증 기록</a>과 <a href="/updates/">공개 변경 기록</a>은 서로 다른 확인 지점입니다.</p>
<p>자동 정기 검수나 모든 외부 링크의 상시 감시가 구현되어 있다고 주장하지 않습니다. 현재 원문을 확인하지 못하면 그 범위를 남기고 중요한 결정을 앞두고 다시 확인합니다.</p>
<h2>광고·제휴와 독립성</h2>
<p>현재 사이트 자체 코드에는 광고·분석 SDK·CMP를 추가하지 않았습니다. 도입한다면 광고·제휴와 편집 콘텐츠를 구분하고 우발 클릭·가림·동의 등 실제 요구를 검토해야 합니다. 계획을 현재 구현 완료로 쓰거나 Google의 공식 서비스·승인 대행으로 표시하지 않습니다.</p>
<h2>정정 요청</h2>
<p><a href="/contact/#correction-request">수정 요청 안내</a>를 따라 공개 URL·문제 문장·참고 근거를 보내 주세요. 비밀번호·인증 코드·민감한 원본 로그는 보내지 마세요. 응답 시간·정정 기한·개별 심사 결과는 보장하지 않습니다. 이메일 보관·삭제 기준은 현재 미정이며 실제 운영 결정과 <a href="/privacy/">개인정보 안내</a>의 갱신은 별도 과제입니다.</p>`, "2026-10-28"));

write("sources/index.html", staticPage("출처 및 참고자료", "실제 주장·근거 종류·대조 결과와 확인하지 못한 범위를 연결한 편집 기록입니다.", "/sources/", `
<p>이 페이지는 공식 링크 목록이 아니라 이 사이트의 주장과 근거를 어떻게 대조했는지 보여 주는 기록입니다. 필요한 공식 원문을 찾으려면 <a href="/official-resources/#resource-selection">질문별 공식 자료</a>를, 제작 방식은 <a href="/about/#content-process">AI 지원·검토 범위</a>를 확인하세요.</p>
<h2 id="evidence-kinds" tabindex="-1">근거의 종류를 구분합니다</h2>
<dl class="article-decisions"><dt>공식 정의·정책</dt><dd>원문의 대상 제품·조건·해당 절을 대조합니다. 일반 요건을 개별 계정의 승인 판정으로 바꾸지 않습니다.</dd><dt>코드·공개 화면의 관찰</dt><dd>실제로 확인한 버전·페이지·시간 범위를 남깁니다. 코드에서 가능한 동작과 모든 기기·계정에서 관찰한 결과는 다릅니다.</dd><dt>운영자 설명·미확인</dt><dd>운영자에게 확인한 범위와 외부 검증 여부를 나눕니다. 정하지 않은 기준이나 접근하지 못한 계정 자료를 추정으로 채우지 않습니다.</dd></dl>
<h2 id="claim-evidence-records" tabindex="-1">실제 주장과 근거 대조</h2>
<p>아래는 <time datetime="2026-10-28">2026-10-28</time>에 재대조한 대표 기록입니다. 34개 글의 모든 출처나 모든 정책 요건을 전수 검증했다는 목록은 아닙니다.</p>
<div class="article-table-scroll" role="region" aria-label="실제 주장별 근거와 확인 한계" tabindex="0"><table><caption>주장·근거·해석의 범위를 함께 읽습니다</caption><thead><tr><th scope="col">이 사이트의 주장</th><th scope="col">대조한 근거</th><th scope="col">확인 결과와 남은 한계</th></tr></thead><tbody>
<tr><th scope="row">페이지 RPM의 분모는 페이지 조회수</th><td><a href="https://support.google.com/adsense/answer/112030?hl=ko">Google 페이지 RPM 정의</a> · <a href="/guides/rpm-cpc-basics/#metric-definitions">이 사이트의 정의·분모 설명</a></td><td>공식 수식과 대조했습니다. 방문자 수로 바꾸지 않았고 가상 계산을 실제 수익이나 전망으로 쓰지 않습니다.</td></tr>
<tr><th scope="row">작업표는 자체 키로 브라우저 기록을 관리</th><td><a href="/assets/tool-engine.mjs">공개 저장 모듈</a> · <a href="/assets/content-audit.mjs">공개 작업표 코드</a> · <a href="/privacy/#local-tools">브라우저 처리 안내</a></td><td><code>alphaadsense.content-audit.v1</code>과 읽기·저장·삭제 경로를 대조했습니다. 다른 기기·CSV·메일함·호스팅 기록까지 삭제한다는 뜻이 아닙니다.</td></tr>
<tr><th scope="row">문의 이메일 보관·삭제 기준은 미정</th><td>운영자 답변 · <a href="/privacy/">공개 개인정보처리방침</a> · <a href="/contact/#correction-request">문의 안내</a></td><td>확정되지 않았다는 상태를 고지했습니다. 보관 기준 확정·메일함 삭제·계약 또는 법률 검토를 완료한 것은 아닙니다.</td></tr>
</tbody></table></div>
<h2 id="source-limitations" tabindex="-1">열람 실패와 현재 확인을 나눕니다</h2>
<p>각 가이드의 공식 자료 확인일은 그 문서가 남긴 확인 시점입니다. 이 페이지를 고쳤다고 모든 글의 원문을 오늘 다시 읽은 것으로 바꾸지 않습니다. 공개 화면·과거 스크린샷의 날짜도 해당 관찰 범위를 뜻합니다.</p>
<p>이번 개정에서는 Search Console 소유권 확인 도움말과 URL 검사 도움말의 원문 조회가 시간 초과되어 현재 세부 내용을 재확인하지 못했습니다. 이를 링크가 영구 삭제됐다는 결론으로 쓰거나 계정 상태·본문 정확성 확인 완료로 표시하지 않습니다. <a href="/official-resources/#resource-selection">공식 자료 안내의 재확인 항목</a>과 현재 계정의 실제 안내를 함께 확인해야 합니다.</p>
<h2 id="correction-record" tabindex="-1">출처 오류를 제보할 때</h2>
<p>문제 문서의 URL·해당 문장·현재 공식 원문과 확인 시점을 <a href="/contact/#correction-request">정정 요청 경로</a>로 알려 주세요. 단순히 링크가 열리는지뿐 아니라 실제 주장을 뒷받침하는지 검토할 자료가 필요합니다. 계정 ID·인증 코드·민감한 캡처는 보내지 마세요.</p>
<p>인용·이미지 사용 권리는 출처 표기와 별도로 확인해야 합니다. 이 페이지는 제3자 자료의 사용 허락이나 법률 준수·Google 제휴를 인증하지 않습니다. 편집의 원칙은 <a href="/editorial-policy/#editorial-evidence">근거 기반 운영 원칙</a>, 실제 변경은 <a href="/updates/">업데이트 기록</a>에 구분합니다.</p>`, "2026-10-28"));

const urls = [
  "/",
  ...Object.keys(categories).map((key) => `/${key}/`),
  "/checklist/",
  "/start-guide/",
  "/official-resources/",
  "/approval-hub/",
  "/next-steps/",
  "/faq/",
  "/search/",
  "/sitemap/",
  "/updates/",
  "/tools/",
  "/tools/approval-score/",
  "/tools/rejection-diagnosis/",
  "/tools/content-planner/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/cookie-policy/",
  "/terms/",
  "/disclaimer/",
  "/editorial-policy/",
  "/sources/",
  ...articles.map((article) => slugPath(article[1]))
];

write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${site.domain}${url === "/" ? "" : url}</loc></url>`).join("\n")}
</urlset>`);

write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${site.domain}/sitemap.xml
`);

write("_headers", `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*.mjs
  Content-Type: text/javascript; charset=utf-8
`);

write("404.html", layout({
  title: "페이지를 찾을 수 없습니다",
  description: "요청한 페이지를 찾을 수 없습니다.",
  path: "/404.html",
  content: `<section class="page-hero wrap"><h1>페이지를 찾을 수 없습니다</h1><p>주소가 바뀌었거나 삭제된 페이지입니다.</p><a class="button primary" href="/">홈으로 이동</a></section>`
}));

write("styles.css", `
:root {
  --ink: #152033;
  --muted: #526174;
  --line: #d8e2ee;
  --soft: #f7fafc;
  --blue: #2563eb;
  --green: #0f9f6e;
  --amber: #d97706;
  --white: #ffffff;
  --shadow: 0 14px 40px rgba(21, 32, 51, .08);
}
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, "Noto Sans KR", sans-serif; color: var(--ink); background: var(--white); line-height: 1.7; }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--blue); }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
.skip { position: absolute; left: -999px; top: 12px; background: var(--ink); color: white; padding: 8px 12px; z-index: 3; }
.skip:focus { left: 12px; }
.wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
main { scroll-margin-top: 96px; }
.site-header { border-bottom: 1px solid var(--line); background: rgba(255,255,255,.95); position: sticky; top: 0; z-index: 2; }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 0; }
.brand { font-size: 22px; font-weight: 800; letter-spacing: 0; white-space: nowrap; }
.brand span { color: var(--blue); }
.nav { display: flex; flex-wrap: wrap; gap: 14px; justify-content: flex-end; font-size: 14px; color: var(--muted); }
.nav a { padding: 4px 6px; display: inline-flex; align-items: center; min-height: 44px; }
.nav a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; font-weight: 700; }
.footer-links { display: flex; flex-wrap: wrap; gap: 0 14px; margin: 10px 0; }
.footer-links a { display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; }
.footer-links a[aria-current="page"] { font-weight: 700; }
.home-hero { background: linear-gradient(180deg, #f7fafc 0%, #ffffff 100%); border-bottom: 1px solid var(--line); }
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; padding: 64px 0 50px; }
.eyebrow { color: var(--green); font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0; margin: 0 0 10px; }
h1, h2, h3 { line-height: 1.25; letter-spacing: 0; }
h1 { font-size: 46px; margin: 0 0 18px; }
h2 { font-size: 28px; margin: 0 0 18px; }
h3 { font-size: 20px; margin: 0 0 10px; }
p { margin: 0 0 16px; }
.hero-grid p { font-size: 18px; color: var(--muted); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.button { display: inline-flex; align-items: center; min-height: 44px; padding: 10px 16px; border: 1px solid var(--line); border-radius: 8px; font-weight: 700; background: white; }
.button.primary { color: white; background: var(--blue); border-color: var(--blue); }
.hero-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 24px; }
.hero-metrics div { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.hero-metrics strong { display: block; color: var(--blue); font-size: 26px; line-height: 1; margin-bottom: 6px; }
.hero-metrics span { display: block; font-weight: 800; margin-bottom: 4px; }
.hero-metrics p { color: var(--muted); font-size: 13px; line-height: 1.5; margin: 0; }
.hero-media { margin: 0; }
.hero-media img { width: 100%; height: auto; display: block; border-radius: 8px; box-shadow: var(--shadow); border: 1px solid var(--line); }
.section { padding: 52px 0; }
.section.tight { padding-top: 20px; }
.section-head { max-width: 780px; margin-bottom: 22px; }
.section-head p:last-child { color: var(--muted); font-size: 17px; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.quick-grid.six { grid-template-columns: repeat(3, 1fr); }
.quick-grid a, .card { border: 1px solid var(--line); border-radius: 8px; background: white; padding: 22px; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.quick-grid span, .card p { display: block; color: var(--muted); font-size: 15px; }
.card { overflow: hidden; }
.card-thumb { display: block; margin: -22px -22px 16px; border-bottom: 1px solid var(--line); background: var(--soft); }
.card-thumb img { display: block; width: 100%; aspect-ratio: 14 / 7.6; height: auto; object-fit: cover; }
.trust-section { padding-bottom: 18px; }
.trust-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 28px; align-items: start; border: 1px solid var(--line); border-radius: 8px; padding: 24px; background: white; box-shadow: 0 8px 26px rgba(21,32,51,.05); }
.trust-grid p { color: var(--muted); }
.trust-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.trust-list li { border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; background: var(--soft); }
.trust-list strong { display: block; margin-bottom: 4px; }
.trust-list span { display: block; color: var(--muted); font-size: 14px; line-height: 1.55; }
.review-dashboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.review-card { border: 1px solid var(--line); border-radius: 8px; padding: 18px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); text-decoration: none; }
.review-card strong { display: block; color: #1e3a8a; font-size: 18px; margin-bottom: 8px; }
.review-card span { display: block; color: var(--muted); font-size: 14px; line-height: 1.6; }
.topic-pills { display: flex; flex-wrap: wrap; gap: 10px; }
.topic-pills a { border: 1px solid var(--line); border-radius: 999px; background: var(--soft); padding: 9px 14px; font-weight: 700; color: var(--muted); }
.topic-pills button { border: 1px solid var(--line); border-radius: 999px; background: var(--soft); padding: 9px 14px; font: inherit; font-weight: 700; color: var(--muted); cursor: pointer; }
.search-box { display: grid; gap: 10px; margin: 8px 0 20px; }
.search-box label { font-weight: 800; }
.search-box div { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.search-box input { width: 100%; min-height: 46px; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font: inherit; }
.search-results { display: grid; gap: 12px; margin-top: 24px; }
.result-count { color: var(--muted); font-weight: 800; }
.search-result { border: 1px solid var(--line); border-radius: 8px; padding: 18px; background: white; }
.search-result h2 { font-size: 20px; margin-bottom: 8px; }
.site-map-list { display: grid; gap: 10px; padding-left: 0; list-style: none; }
.site-map-list li { border-bottom: 1px solid var(--line); padding: 10px 0; }
.site-map-list a { font-weight: 800; }
.site-map-list span { display: block; color: var(--muted); margin-top: 4px; }
.update-list { display: grid; gap: 12px; padding-left: 0; list-style: none; }
.update-list li { border: 1px solid var(--line); border-radius: 8px; padding: 16px 18px; background: white; }
.update-list span { display: block; color: var(--muted); margin-top: 4px; }
.tool-panel { display: grid; gap: 16px; border: 1px solid var(--line); border-radius: 8px; padding: 18px; background: var(--soft); margin: 18px 0 24px; }
.tool-panel fieldset { border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; background: white; }
.tool-panel legend { font-weight: 800; padding: 0 6px; }
.tool-panel label { display: grid; gap: 6px; margin: 8px 0; }
.tool-panel label:has(input[type="checkbox"]) { grid-template-columns: auto 1fr; align-items: start; }
.tool-panel input[type="checkbox"] { margin-top: 7px; }
.tool-panel select { min-width: 0; width: 100%; max-width: 100%; min-height: 44px; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; font: inherit; background: white; }
.score-output, .diagnosis-result, .planner-output { border: 1px solid var(--line); border-radius: 8px; padding: 18px; margin: 18px 0 28px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.score-output strong { display: block; font-size: 34px; line-height: 1; margin-bottom: 8px; color: var(--blue); }
.score-output span { color: var(--muted); }
.tool-result-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 18px 0 28px; }
.tool-result-grid.compact { margin-bottom: 6px; }
.result-summary { border: 1px solid var(--line); border-radius: 8px; padding: 16px 18px; background: #eef6ff; margin-bottom: 14px; }
.result-summary strong { display: block; color: #1e3a8a; font-size: 18px; margin-bottom: 4px; }
.result-summary p { color: var(--ink); margin: 0; }
.result-card { border: 1px solid var(--line); border-radius: 8px; padding: 18px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.result-card h3 { margin-bottom: 8px; }
.result-card p { color: var(--muted); font-size: 15px; }
.result-card ul { margin: 0; padding-left: 18px; }
.mini-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.mini-links a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--soft); color: var(--blue); font-size: 14px; font-weight: 800; text-decoration: none; }
.planner-links { margin: -10px 0 26px; }
.required-page-note { border-top: 1px solid var(--line); margin-top: 34px; padding-top: 28px; }
.trust-matrix { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 16px 0 20px; }
.trust-matrix article { border: 1px solid var(--line); border-radius: 8px; padding: 18px; background: var(--soft); }
.trust-matrix h3 { margin-bottom: 8px; }
.trust-matrix p { color: var(--muted); margin: 0; }
.trust-table { width: 100%; border-collapse: collapse; margin: 14px 0 22px; background: white; }
.trust-table th, .trust-table td { border: 1px solid var(--line); padding: 12px 14px; text-align: left; vertical-align: top; }
.trust-table th { width: 180px; background: #eef6ff; color: #1e3a8a; }
.quality-block { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 24px 0 28px; margin: 28px 0; }
.quality-table td:first-child, .priority-table td:first-child { font-weight: 800; color: #1e3a8a; white-space: nowrap; }
.proof-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0 4px; }
.proof-grid article { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; background: var(--soft); }
.proof-grid span { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: var(--blue); color: white; font-weight: 800; font-size: 13px; }
.proof-grid p { margin: 0; color: var(--muted); font-size: 15px; }
.hub-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 20px 0 28px; }
.hub-list a { border: 1px solid var(--line); border-radius: 8px; padding: 18px; text-decoration: none; background: white; }
.hub-list span { display: block; color: var(--muted); margin-top: 6px; }
.hub-overview { display: grid; grid-template-columns: 1.25fr .75fr; gap: 22px; border: 1px solid var(--line); border-radius: 8px; padding: 22px; background: var(--soft); }
.hub-overview p { color: var(--muted); margin-bottom: 0; }
.hub-overview dl { margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.hub-overview div div, .hub-overview dl div { border: 1px solid var(--line); border-radius: 8px; background: white; padding: 14px; }
.hub-overview dt { color: var(--muted); font-size: 13px; font-weight: 800; }
.hub-overview dd { margin: 4px 0 0; font-size: 22px; font-weight: 800; color: var(--blue); line-height: 1.2; }
.action-strip { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 10px; }
.action-strip a { display: inline-flex; align-items: center; min-height: 42px; border: 1px solid var(--line); border-radius: 8px; padding: 9px 13px; background: white; color: var(--blue); font-weight: 800; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.visual-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 18px 0 28px; }
.visual-grid.compact { margin-top: 22px; }
.visual-card { display: grid; grid-template-rows: auto auto 1fr; gap: 10px; border: 1px solid var(--line); border-radius: 8px; background: white; overflow: hidden; box-shadow: 0 8px 22px rgba(21,32,51,.05); }
.visual-card img { display: block; width: 100%; aspect-ratio: 14 / 7.6; height: auto; object-fit: cover; background: var(--soft); border-bottom: 1px solid var(--line); }
.visual-card strong { padding: 0 16px; font-size: 18px; }
.visual-card span { display: block; color: var(--muted); padding: 0 16px 18px; font-size: 15px; line-height: 1.55; }
.readiness-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0 30px; }
.readiness-grid a { border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: var(--soft); text-decoration: none; }
.readiness-grid strong { display: block; color: #1e3a8a; font-size: 18px; margin-bottom: 6px; }
.readiness-grid span { display: block; color: var(--muted); font-size: 14px; line-height: 1.55; }
.summary-table { width: 100%; border-collapse: collapse; margin: 18px 0 28px; font-size: 15px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.summary-table th, .summary-table td { border: 1px solid var(--line); padding: 13px 14px; vertical-align: top; text-align: left; }
.summary-table th { background: #eef6ff; color: #1e3a8a; }
.path-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 18px 0 26px; }
.path-card { border: 1px solid var(--line); border-radius: 8px; padding: 20px; background: white; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.path-card h3 { margin-bottom: 8px; }
.path-card p { color: var(--muted); font-size: 15px; }
.path-card div { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.path-card a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--soft); color: var(--blue); font-size: 14px; font-weight: 800; }
.band { background: #f4f8fb; border-block: 1px solid var(--line); padding: 54px 0; }
.split { display: grid; grid-template-columns: .9fr 1.1fr; gap: 42px; align-items: start; }
.steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.steps li { background: white; border: 1px solid var(--line); border-radius: 8px; padding: 16px 18px; }
.steps span { display: block; color: var(--muted); }
.grid { display: grid; gap: 16px; }
.grid.three { grid-template-columns: repeat(3, 1fr); }
.card h3 a { text-decoration: none; }
.page-hero, .article-head { padding: 56px 0 28px; }
.page-hero p, .article-head p { color: var(--muted); max-width: 760px; font-size: 18px; }
.article-head .meta-line { color: var(--muted); font-size: 14px; margin-top: 8px; }
.article-head .meta-line a { color: var(--blue); text-decoration: underline; text-underline-offset: 3px; }
.hub-entry h2 { scroll-margin-top: 150px; }
.hub-entry h2:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
.hub-summary p { max-width: 820px; color: var(--muted); margin-bottom: 0; }
.hub-related ul { margin: 0; padding-left: 20px; }
.hub-related a { display: inline-flex; align-items: center; min-height: 44px; color: var(--blue); text-decoration: underline; text-underline-offset: 3px; }
.decision-path { border-top: 1px solid var(--line); padding: 24px 0 8px; margin-top: 24px; }
.decision-path h2[id] { font-size: 24px; scroll-margin-top: 150px; margin-top: 0; }
.decision-path h2[id]:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
.decision-stop { border-left: 3px solid var(--green); padding-left: 16px; color: var(--muted); }
.article { max-width: 820px; padding-bottom: 34px; }
.article a { color: var(--blue); text-decoration: underline; text-underline-offset: 3px; }
.article h2 { margin-top: 34px; }
.article li { margin-bottom: 8px; }
.article-visual { margin: 24px 0 30px; }
.article-visual img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); background: var(--soft); }
.article-visual figcaption { margin-top: 8px; color: var(--muted); font-size: 14px; line-height: 1.55; }
.placement-diagram { margin: 24px 0; }
.placement-comparison { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.placement-scenario { min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
.placement-scenario h3 { font-size: 18px; margin: 0 0 16px; }
.placement-scenario p, .placement-diagram figcaption { font-size: 14px; color: var(--muted); margin: 16px 0 0; }
.placement-content, .placement-action, .placement-ad { min-height: 64px; display: flex; align-items: center; padding: 12px; margin: 12px 0; overflow-wrap: anywhere; }
.placement-content { border-left: 3px solid var(--green); background: var(--soft); }
.placement-action { border: 1px solid var(--blue); font-weight: 700; margin-bottom: 0; }
.placement-ad { border: 2px dashed var(--muted); background: var(--soft); }
.placement-ad-near { border-color: var(--amber); margin-top: 0; }
@media (max-width: 600px) { .placement-comparison { grid-template-columns: minmax(0, 1fr); } }
.article table { width: 100%; border-collapse: collapse; margin: 20px 0 28px; font-size: 15px; }
.article th, .article td { border: 1px solid var(--line); padding: 12px; vertical-align: top; text-align: left; }
.article th { background: #f4f8fb; }
.article-toc { margin: 28px 0; padding: 20px 0; border-block: 1px solid var(--line); }
.article .article-toc h2 { margin: 0 0 12px; font-size: 18px; }
.article-toc ol { margin: 0; padding: 0; list-style: none; }
.article-toc li { margin: 0; }
.article-toc a { display: block; padding: 10px 0; min-height: 44px; overflow-wrap: anywhere; }
.article-section h2, .article > h2[id] { scroll-margin-top: 150px; }
.article-toc a:focus-visible, .article-section h2:focus-visible, .article > h2[id]:focus-visible, .article-table-scroll:focus-visible, .article-code:focus-visible { outline: 3px solid var(--blue); outline-offset: 4px; }
.article-section p, .article-section li, .article-revision { overflow-wrap: anywhere; }
.article blockquote { margin: 20px 0; border-left: 3px solid var(--green); padding: 4px 0 4px 20px; }
.article blockquote p { margin: 8px 0; }
.article-table-scroll { max-width: 100%; overflow-x: auto; margin: 20px 0 28px; }
.article .article-table-scroll table { display: table; margin: 0; min-width: 640px; }
.article caption { text-align: left; color: var(--muted); font-size: 14px; padding-bottom: 12px; }
.article .article-table-scroll th[scope="row"] { width: 27%; }
.article-decisions { margin: 20px 0; }
.article-decisions dt { font-weight: 700; margin-top: 20px; }
.article-decisions dd { margin: 8px 0 0; }
.article-revision { border-top: 1px solid var(--line); padding-top: 20px; margin-top: 28px; color: var(--muted); font-size: 14px; }
.article-code { max-width: 100%; overflow-x: auto; padding: 16px; border: 1px solid var(--line); border-radius: 4px; background: var(--soft); font-size: 14px; white-space: pre; }
${toolStyles}
${homeStyles}
${searchStyles}
${planningStyles}
.read-order { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; counter-reset: order; }
.read-order li { border: 1px solid var(--line); border-radius: 8px; padding: 16px 18px; background: white; counter-increment: order; }
.read-order li::before { content: counter(order); display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; margin-right: 8px; border-radius: 50%; background: var(--blue); color: white; font-weight: 800; font-size: 13px; }
.read-order a { font-weight: 800; }
.read-order span { display: block; color: var(--muted); margin-top: 6px; font-size: 15px; }
.note { border-left: 4px solid var(--amber); background: #fff8ed; padding: 16px 18px; margin: 28px 0; }
.footer { background: #111827; color: #e5e7eb; padding: 34px 0; margin-top: 36px; }
.footer a { color: white; text-decoration: underline; text-underline-offset: 3px; }
.footer p { color: #cbd5e1; margin-bottom: 8px; }
.footer .business-info { font-size: 14px; line-height: 1.65; }
.footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media (max-width: 860px) {
  main { scroll-margin-top: 180px; }
  .header-inner { align-items: flex-start; flex-direction: column; gap: 12px; }
  .nav { justify-content: flex-start; gap: 6px; }
  .hero-grid, .split, .footer-grid, .trust-grid, .hub-overview { grid-template-columns: 1fr; }
  .quick-grid, .grid.three, .read-order, .visual-grid, .review-dashboard, .readiness-grid { grid-template-columns: 1fr 1fr; }
  .quick-grid.six, .trust-list { grid-template-columns: 1fr 1fr; }
  h1 { font-size: 36px; }
}
@media (max-width: 560px) {
  .wrap { width: min(100% - 24px, 1120px); }
  .quick-grid, .quick-grid.six, .grid.three, .read-order, .hub-list, .visual-grid, .path-grid, .trust-list, .hub-overview dl, .tool-result-grid, .trust-matrix, .proof-grid, .hero-metrics, .review-dashboard, .readiness-grid { grid-template-columns: 1fr; }
  .hero-grid { padding-top: 42px; }
  h1 { font-size: 30px; }
  h2 { font-size: 24px; }
  .header-inner { padding-block: 12px; gap: 8px; }
  .nav { gap: 0 4px; }
  .nav a { padding: 0 6px; }
  .article-section h2, .article > h2[id], .hub-entry h2, .metric-tool, .workbench { scroll-margin-top: 180px; }
  .decision-path h2[id] { scroll-margin-top: 180px; }
  .search-box div { grid-template-columns: 1fr; }
  .article table, .summary-table { display: block; overflow-x: auto; white-space: normal; }
}
`);

console.log(`Built ${urls.length} pages for ${site.name}`);
