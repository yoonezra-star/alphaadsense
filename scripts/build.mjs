import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const site = {
  name: "Alpha AdSense",
  domain: "https://alphaadsense.com",
  description: "애드센스 승인 준비, 수익형 글쓰기, 정책 점검, 거절 사유 해결을 정리하는 초보 운영자용 정보 사이트입니다.",
  email: "replyleaders@naver.com"
};

const nav = [
  ["홈", "/"],
  ["승인 가이드", "/approval/"],
  ["거절 해결", "/rejection/"],
  ["글쓰기", "/writing/"],
  ["수익화", "/monetization/"],
  ["정책 체크", "/policy/"],
  ["자료실", "/resources/"],
  ["체크리스트", "/checklist/"],
  ["소개", "/about/"],
  ["문의", "/contact/"]
];

const categories = {
  approval: { title: "승인 가이드", description: "처음 사이트를 만들고 애드센스 신청 전까지 확인해야 할 구조, 색인, 콘텐츠 기준입니다." },
  rejection: { title: "거절 사유 해결", description: "가치가 낮은 콘텐츠, 탐색 문제, 사이트 접근 문제처럼 자주 나오는 거절 사유를 정리합니다." },
  writing: { title: "글쓰기 가이드", description: "승인과 장기 운영에 모두 필요한 주제 선정, 본문 구성, 내부 링크, 업데이트 방법입니다." },
  monetization: { title: "수익화 전략", description: "승인 이후 광고 배치, RPM 이해, 트래픽 품질, 장기 운영 지표를 다룹니다." },
  policy: { title: "정책 체크", description: "개인정보처리방침, 쿠키 고지, 금지 콘텐츠, 클릭 유도 방지 등 정책 기반 점검입니다." },
  resources: { title: "자료실", description: "사이트 운영자가 바로 사용할 수 있는 점검표, 작성표, 용어 정리, 제출 전 확인 자료입니다." }
};

const articles = [
  ["approval", "adsense-approval-roadmap", "애드센스 승인을 준비하는 전체 순서", "도메인 연결부터 색인 확인, 신청 전 최종 점검까지 처음 운영자가 따라갈 승인 준비 흐름입니다.", ["사이트의 목적을 한 문장으로 정하고 메뉴를 먼저 나눕니다.", "소개, 문의, 개인정보처리방침, 이용약관, 면책 고지는 초기에 공개합니다.", "초기 글은 카테고리별로 고르게 발행하고 빈 메뉴를 만들지 않습니다.", "신청 전에는 색인, 모바일 화면, 깨진 링크, 중복 문장을 함께 확인합니다."]],
  ["approval", "site-structure-before-apply", "애드센스 신청 전 사이트 구조 체크리스트", "승인 심사자가 둘러보기 쉬운 사이트 구조를 만들기 위한 메뉴, 하단 링크, 내부 연결 기준입니다.", ["상단 메뉴는 주제를 분명히 보여 주어야 하며 너무 많은 항목을 숨기지 않습니다.", "각 카테고리에는 최소 여러 개의 실제 글이 있어야 합니다.", "하단에는 운영자 정보와 정책 페이지를 반복해서 노출합니다.", "홈은 최신 글만 나열하기보다 대표 가이드와 목적별 바로가기를 함께 둡니다."]],
  ["approval", "indexing-before-adsense", "애드센스 신청 전 색인 확인 방법", "Search Console에서 색인 여부를 확인하고 신청 타이밍을 판단하는 방법을 정리했습니다.", ["사이트맵을 제출한 뒤 주요 페이지가 검색엔진에 발견되는지 확인합니다.", "색인이 늦는 글은 내부 링크를 보강하고 제목과 첫 문단을 명확하게 다듬습니다.", "404 페이지, 임시 주소, 비공개 페이지가 심사 경로에 섞이지 않게 합니다.", "신청 직전에는 robots.txt가 주요 페이지를 막고 있지 않은지 확인합니다."]],
  ["approval", "minimum-content-myth", "애드센스 글 개수 기준에 대한 오해", "공식 최소 글 수보다 중요한 것은 독창성, 완성도, 탐색성이라는 점을 기준별로 설명합니다.", ["공식적으로 모든 사이트에 적용되는 동일한 최소 글 개수는 공개되어 있지 않습니다.", "다만 빈약해 보이는 사이트는 낮은 가치로 판단될 가능성이 큽니다.", "초기에는 글 수보다 카테고리별 균형과 페이지 완성도가 중요합니다.", "짧은 글을 많이 만드는 것보다 문제를 실제로 해결하는 글을 쌓아야 합니다."]],
  ["approval", "homepage-for-review", "승인 심사에 유리한 홈 화면 구성", "홈 화면에서 사이트의 주제, 신뢰, 탐색 경로가 바로 보이도록 구성하는 방법입니다.", ["첫 화면에는 사이트가 누구를 돕는지 바로 보여야 합니다.", "대표 카테고리와 체크리스트를 배치하면 탐색 의도가 선명해집니다.", "최근 글 영역은 업데이트가 계속되는 사이트라는 신호를 줍니다.", "과한 광고 자리나 클릭 유도 문구는 신청 전에는 배제합니다."]],
  ["approval", "domain-and-trust", "새 도메인에서 신뢰 신호를 만드는 방법", "새 도메인이라도 운영 목적, 문의 경로, 정책 페이지, 일관된 콘텐츠로 신뢰를 보강할 수 있습니다.", ["도메인 주제와 사이트명이 자연스럽게 연결되어야 합니다.", "운영자 소개는 거창하지 않아도 실제 운영 목적이 분명해야 합니다.", "연락 가능한 이메일과 문의 페이지를 공개합니다.", "주제와 무관한 글을 섞지 않아 전문성을 흐리지 않습니다."]],
  ["rejection", "low-value-content-fix", "가치가 낮은 콘텐츠 거절 사유 해결법", "Low value content로 보이는 원인과 글, 구조, 내부 링크를 고치는 순서를 정리했습니다.", ["검색 결과를 다시 말하는 글은 독자에게 새 도움을 주기 어렵습니다.", "글마다 상황, 판단 기준, 예시, 체크리스트를 넣어 실사용 가치를 높입니다.", "비슷한 제목의 글이 많다면 통합하거나 관점을 분리합니다.", "재신청 전에는 대표 글을 먼저 보강하고 얇은 글은 비공개 또는 병합합니다."]],
  ["rejection", "navigation-issue-fix", "탐색 문제로 거절될 때 확인할 항목", "메뉴, 링크, 카테고리, 모바일 탐색에서 생기는 문제를 점검하는 가이드입니다.", ["상단 메뉴와 하단 링크가 서로 모순되지 않아야 합니다.", "카테고리 페이지가 빈 목록으로 보이면 품질 신호가 약해집니다.", "모바일에서 메뉴 버튼, 링크 간격, 글자 크기를 확인합니다.", "광고처럼 보이는 버튼을 메뉴 근처에 두지 않습니다."]],
  ["rejection", "site-down-unavailable", "사이트 다운 또는 접근 불가 문제 해결", "심사 중 사이트 접근이 막히는 상황을 줄이기 위한 DNS, HTTPS, 리다이렉트 점검입니다.", ["도메인 루트와 www 주소가 모두 정상 접속되는지 확인합니다.", "HTTPS 인증서가 발급되기 전 신청하지 않습니다.", "Cloudflare Pages 배포 후 커스텀 도메인 상태가 Active인지 봅니다.", "국가나 봇 접근을 차단하는 보안 규칙은 신청 전 최소화합니다."]],
  ["rejection", "duplicate-content-cleanup", "중복 콘텐츠를 정리하는 방법", "비슷한 글이 많을 때 승인 전에 병합, 삭제, 리라이팅을 판단하는 기준입니다.", ["같은 질문에 답하는 글이 여러 개라면 하나의 종합 가이드로 묶습니다.", "제목만 바꾸고 본문 흐름이 같은 글은 중복으로 보일 수 있습니다.", "각 글은 대상 독자, 상황, 해결 단계 중 하나 이상이 달라야 합니다.", "정리 후에는 내부 링크와 사이트맵을 다시 생성합니다."]],
  ["rejection", "thin-category-pages", "빈 카테고리와 얇은 허브 페이지 보강법", "카테고리 페이지가 단순 목록에 그치지 않도록 소개문, 추천 순서, 관련 글을 보강합니다.", ["허브 페이지에는 해당 주제를 읽는 순서를 안내합니다.", "각 글 카드에는 단순 제목보다 해결하는 문제를 함께 적습니다.", "대표 글, 최신 글, 체크리스트를 함께 배치하면 페이지 가치가 올라갑니다.", "글이 부족한 카테고리는 신청 전 메뉴에서 빼는 것도 방법입니다."]],
  ["writing", "approval-friendly-article-format", "승인에 유리한 글 구성 템플릿", "초보 운영자가 얇은 글을 피하고 완성도 있는 정보 글을 쓰기 위한 본문 구조입니다.", ["첫 문단은 독자가 겪는 문제와 글에서 얻을 답을 분명히 말합니다.", "중간에는 판단 기준, 절차, 예시, 주의점을 나누어 설명합니다.", "표나 체크리스트는 글의 실용성을 높여 줍니다.", "마지막에는 관련 글로 이어지는 내부 링크를 배치합니다."]],
  ["writing", "topic-selection-for-adsense", "수익형 블로그 주제 선정 기준", "승인 가능성과 장기 수익성을 함께 고려해 주제를 고르는 방법입니다.", ["검색량만 높은 주제보다 꾸준히 새 글을 쓸 수 있는 주제가 좋습니다.", "정책 위험이 높은 주제는 초보 사이트에서 피하는 편이 안전합니다.", "정보 갱신이 필요한 주제라면 업데이트 날짜를 관리해야 합니다.", "카테고리는 3~6개 정도로 시작하면 운영 부담이 적습니다."]],
  ["writing", "internal-linking-guide", "내부 링크를 자연스럽게 넣는 방법", "승인 심사와 독자 경험에 모두 도움이 되는 내부 링크 설계 기준입니다.", ["관련 없는 글을 억지로 연결하면 탐색 품질이 떨어집니다.", "초보자는 시작 글, 심화 글, 체크리스트 순서로 연결하면 좋습니다.", "카테고리 허브에서 핵심 글로 가는 길을 명확히 만듭니다.", "본문 중간 링크와 글 하단 추천 링크를 함께 사용합니다."]],
  ["writing", "avoid-ai-like-writing", "AI 티가 나는 글을 줄이는 편집법", "반복 문장, 일반론, 과장 표현을 줄이고 실제 운영자의 판단이 보이게 다듬는 방법입니다.", ["모든 글이 같은 문단 구조와 표현을 반복하면 개성이 약해집니다.", "경험 기반 판단, 예외 상황, 실패 사례를 넣으면 글이 살아납니다.", "근거가 필요한 내용은 공식 문서나 신뢰 가능한 자료로 연결합니다.", "과도한 확신보다 조건과 한계를 함께 설명하는 문장이 좋습니다."]],
  ["writing", "evergreen-content-plan", "오래 가는 콘텐츠 발행 계획", "승인 후에도 검색 유입을 유지할 수 있는 에버그린 글을 설계하는 방법입니다.", ["한 번 쓰고 끝나는 뉴스성 글보다 꾸준히 찾는 문제 해결 글을 우선합니다.", "분기마다 업데이트할 글을 표시해 관리합니다.", "기초 가이드, 체크리스트, 용어 정리는 오래 유지되는 자산입니다.", "시즌성 글은 발행 시점과 업데이트 시점을 미리 정합니다."]],
  ["monetization", "after-approval-first-settings", "애드센스 승인 후 처음 확인할 설정", "승인 직후 광고를 무리하게 늘리기 전에 확인할 기본 설정과 운영 기준입니다.", ["자동 광고를 켜기 전 모바일에서 레이아웃이 깨지지 않는지 확인합니다.", "첫 주에는 광고 수익보다 광고가 콘텐츠를 가리지 않는지 봅니다.", "민감한 카테고리 차단은 수익과 브랜드 안정성의 균형으로 판단합니다.", "정책 알림과 이메일을 놓치지 않게 계정 상태를 확인합니다."]],
  ["monetization", "rpm-cpc-basics", "RPM과 CPC를 초보자 관점에서 이해하기", "수익 지표를 단순 금액이 아니라 콘텐츠, 방문자, 광고 위치와 연결해 해석합니다.", ["RPM은 방문 1,000회당 예상 수익으로 전체 효율을 보는 지표입니다.", "CPC는 클릭당 수익이지만 클릭 유도를 해서는 안 됩니다.", "페이지 주제, 체류 시간, 방문자 국가, 광고 수요가 지표에 영향을 줍니다.", "단기간 수치보다 글 묶음별 추세를 보는 편이 정확합니다."]],
  ["monetization", "ad-placement-principles", "콘텐츠를 해치지 않는 광고 배치 원칙", "승인 후 광고를 넣을 때 독자 경험과 정책을 함께 지키는 기준입니다.", ["광고는 메뉴, 다운로드, 다음 단계 버튼처럼 보이면 안 됩니다.", "첫 문단을 읽기도 전에 광고가 화면을 과도하게 차지하지 않게 합니다.", "본문 중간 광고는 문맥을 끊지 않는 위치에 제한적으로 배치합니다.", "모바일에서 실수 클릭이 생기지 않도록 간격을 확보합니다."]],
  ["monetization", "traffic-quality", "애드센스에서 트래픽 품질이 중요한 이유", "수익을 높이기 전에 무효 트래픽과 저품질 유입을 피해야 하는 이유를 설명합니다.", ["본인 클릭, 지인 클릭 요청, 클릭 교환은 절대 피해야 합니다.", "광고성 대량 유입은 체류 시간과 정책 위험을 함께 악화시킬 수 있습니다.", "검색 유입은 느리지만 장기적으로 가장 안정적인 기반입니다.", "SNS 유입은 글 주제와 기대치가 맞을 때만 품질이 좋아집니다."]],
  ["policy", "privacy-policy-for-adsense", "애드센스용 개인정보처리방침에 넣을 항목", "구글 광고 쿠키, 맞춤 광고, 제3자 공급업체 고지를 개인정보처리방침에 반영하는 방법입니다.", ["구글을 포함한 제3자 공급업체가 쿠키를 사용할 수 있음을 알려야 합니다.", "맞춤 광고 선택 해제 경로를 안내합니다.", "문의 이메일과 개인정보 관련 요청 방법을 명확히 적습니다.", "정책 문구는 사이트 운영 방식에 맞게 작성하고 정기적으로 검토합니다."]],
  ["policy", "cookie-notice-basics", "쿠키 고지와 동의 안내 기본", "방문자에게 쿠키와 광고 기술 사용을 알리는 기본 원칙을 정리했습니다.", ["쿠키 고지는 숨겨진 페이지가 아니라 쉽게 찾을 수 있어야 합니다.", "지역별 법률 요구가 다를 수 있으므로 방문자 범위를 고려합니다.", "애드센스의 Privacy & messaging 도구도 검토할 수 있습니다.", "초기에는 복잡한 추적 도구를 많이 붙이지 않는 것이 관리에 유리합니다."]],
  ["policy", "prohibited-content-check", "애드센스 금지 콘텐츠 사전 점검", "승인 전 피해야 할 콘텐츠 유형과 애매한 주제를 다루는 방법입니다.", ["성인, 불법, 폭력, 혐오, 사기성 내용은 광고 정책 위험이 큽니다.", "의료, 금융, 법률 정보는 단정적 조언을 피하고 출처를 명확히 합니다.", "수익 보장, 클릭 유도, 시스템 우회 표현은 사용하지 않습니다.", "애매하면 해당 글을 신청 이후로 미루는 편이 안전합니다."]],
  ["policy", "disclaimer-page-guide", "면책 고지 페이지 작성 기준", "정보 사이트가 제공하는 내용의 범위와 한계를 독자에게 설명하는 방법입니다.", ["정보 제공 목적임을 분명히 하되 책임 회피 문구만 길게 쓰지 않습니다.", "정책과 수익 관련 정보는 시간이 지나면 바뀔 수 있음을 안내합니다.", "공식 판단은 구글 애드센스의 최신 정책을 따라야 한다고 연결합니다.", "문의 경로를 함께 제공하면 신뢰가 높아집니다."]],
  ["resources", "pre-apply-checklist", "애드센스 신청 전 최종 점검표", "신청 직전 사이트 운영자가 하나씩 확인할 수 있는 실전 체크리스트입니다.", ["홈, 카테고리, 글, 정책 페이지가 모두 정상 접속됩니다.", "모바일에서 메뉴와 본문이 겹치지 않습니다.", "주요 글이 검색엔진에 색인되어 있습니다.", "개인정보처리방침과 문의 페이지가 하단에서 연결됩니다."]],
  ["resources", "content-calendar-30-days", "30일 콘텐츠 발행 계획표", "승인 준비 사이트를 한 달 동안 무리 없이 채우는 글 발행 순서입니다.", ["1주차에는 소개, 정책, 핵심 가이드처럼 뼈대를 만듭니다.", "2주차에는 카테고리별 대표 글을 고르게 채웁니다.", "3주차에는 거절 사유와 체크리스트형 글을 보강합니다.", "4주차에는 내부 링크, 색인, 업데이트를 점검합니다."]],
  ["resources", "rejection-message-map", "거절 메시지별 대응표", "애드센스 심사 메시지를 받았을 때 어떤 영역부터 고칠지 정리한 자료입니다.", ["가치가 낮은 콘텐츠는 글의 깊이와 중복성을 먼저 봅니다.", "탐색 문제는 메뉴, 링크, 모바일 화면을 확인합니다.", "접근 불가는 DNS, HTTPS, 리다이렉트, 보안 설정을 점검합니다.", "정책 문제는 해당 글을 수정하거나 신청 전 제외합니다."]],
  ["resources", "glossary-for-beginners", "애드센스 초보 용어 정리", "RPM, CPC, CTR, 무효 트래픽, 사이트맵 같은 기본 용어를 쉽게 정리했습니다.", ["RPM은 전체 수익 효율을 보는 지표입니다.", "CTR은 광고 클릭률이지만 인위적으로 높이려 해서는 안 됩니다.", "무효 트래픽은 계정 제한으로 이어질 수 있어 가장 조심해야 합니다.", "사이트맵은 검색엔진이 페이지를 찾는 데 도움을 주는 파일입니다."]],
  ["resources", "cloudflare-gabia-domain-guide", "가비아 도메인을 Cloudflare Pages에 연결하는 순서", "alphaadsense.com처럼 가비아에 있는 도메인을 Cloudflare Pages에 연결하는 기본 흐름입니다.", ["Cloudflare에 도메인을 추가하고 안내되는 네임서버를 확인합니다.", "가비아 도메인 관리에서 네임서버를 Cloudflare 값으로 바꿉니다.", "Cloudflare Pages에서 GitHub 저장소를 연결하고 커스텀 도메인을 추가합니다.", "HTTPS가 활성화된 뒤 Search Console과 AdSense 신청을 진행합니다."]]
];

const officialLinks = [
  ["AdSense eligibility requirements", "https://support.google.com/adsense/answer/9724?hl=ko"],
  ["Make sure your site's pages are ready for AdSense", "https://support.google.com/adsense/answer/7299563?hl=ko"],
  ["AdSense Program policies", "https://support.google.com/adsense/answer/48182?hl=ko"],
  ["Required content for privacy policy", "https://support.google.com/adsense/answer/1348695?hl=ko"],
  ["How AdSense uses cookies", "https://support.google.com/adsense/answer/7549925?hl=ko"]
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

function layout({ title, description, path = "/", content }) {
  const url = `${site.domain}${path === "/" ? "" : path}`;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | ${site.name}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${esc(title)} | ${site.name}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${site.domain}/assets/approval-workflow.png">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#content">콘텐츠로 건너뛰기</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/"><span>Alpha</span> AdSense</a>
      <nav class="nav" aria-label="주요 메뉴">
        ${nav.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
      </nav>
    </div>
  </header>
  <main id="content">
    ${content}
  </main>
  <footer class="footer">
    <div class="wrap footer-grid">
      <div>
        <strong>${site.name}</strong>
        <p>애드센스 승인 준비와 수익형 콘텐츠 운영을 정리하는 독립 정보 사이트입니다.</p>
      </div>
      <div>
        <strong>운영 정보</strong>
        <p>문의: <a href="mailto:${site.email}">${site.email}</a></p>
        <p><a href="/privacy/">개인정보처리방침</a> · <a href="/cookie-policy/">쿠키 정책</a> · <a href="/terms/">이용약관</a> · <a href="/disclaimer/">면책 고지</a> · <a href="/editorial-policy/">운영 원칙</a> · <a href="/sources/">출처</a></p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function articleCard(article) {
  const [cat, slug, title, description] = article;
  return `<article class="card">
    <p class="eyebrow">${categories[cat].title}</p>
    <h3><a href="${slugPath(slug)}">${esc(title)}</a></h3>
    <p>${esc(description)}</p>
  </article>`;
}

function articlePage(article) {
  const [cat, slug, title, description, points] = article;
  const related = articles.filter((item) => item[0] === cat && item[1] !== slug).slice(0, 3);
  const body = `<section class="article-head wrap">
    <p class="eyebrow">${categories[cat].title}</p>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
  </section>
  <article class="wrap article">
    <p>이 글은 애드센스 승인을 준비하는 초보 운영자가 실제로 점검할 수 있도록 작성했습니다. 승인 여부는 사이트 전체 품질, 정책 준수, 사용자 경험, 콘텐츠의 독창성에 따라 달라질 수 있으므로 단일 항목만 고치기보다 구조와 글 품질을 함께 확인하는 것이 좋습니다.</p>
    <h2>핵심 점검 항목</h2>
    <ul>${points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
    <h2>실행 순서</h2>
    <p>먼저 현재 사이트에서 이 주제와 관련된 페이지를 모두 열어 봅니다. 제목, 첫 문단, 메뉴 연결, 하단 정책 링크, 모바일 화면을 순서대로 확인하면 문제를 빠르게 찾을 수 있습니다. 수정 후에는 사이트맵을 다시 생성하고 주요 페이지의 색인 상태를 확인하세요.</p>
    <h2>주의할 점</h2>
    <p>승인 준비 과정에서 가장 흔한 실수는 글 수만 늘리고 실제 정보 밀도를 높이지 않는 것입니다. 독자가 바로 따라 할 수 있는 기준, 예시, 체크리스트, 공식 자료 링크를 넣으면 단순 요약 글보다 훨씬 신뢰도가 높아집니다.</p>
    <h2>공식 자료와 함께 보기</h2>
    <p>정책과 심사 기준은 바뀔 수 있으므로 최종 판단은 구글 애드센스 공식 도움말을 기준으로 확인해야 합니다. 특히 개인정보처리방침, 쿠키, 금지 콘텐츠, 사이트 탐색성은 신청 전 반드시 다시 검토하세요.</p>
    <div class="note">
      <strong>운영자 메모</strong>
      <p>이 글은 승인 보장을 약속하지 않습니다. 대신 신청 전 품질을 높이기 위한 실무 점검 기준을 제공합니다.</p>
    </div>
  </article>
  <section class="wrap section">
    <h2>같은 주제의 글</h2>
    <div class="grid three">${related.map(articleCard).join("")}</div>
  </section>`;

  return layout({ title, description, path: slugPath(slug), content: body });
}

function categoryPage(key) {
  const category = categories[key];
  const items = articles.filter((article) => article[0] === key);
  const body = `<section class="page-hero wrap">
    <p class="eyebrow">주제별 가이드</p>
    <h1>${category.title}</h1>
    <p>${category.description}</p>
  </section>
  <section class="wrap section">
    <div class="grid three">${items.map(articleCard).join("")}</div>
  </section>`;
  return layout({ title: category.title, description: category.description, path: `/${key}/`, content: body });
}

function staticPage(title, description, path, inner) {
  return layout({
    title,
    description,
    path,
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
  mkdirSync("dist/assets", { recursive: true });
  if (existsSync("public/assets/approval-workflow.png")) copyFileSync("public/assets/approval-workflow.png", "dist/assets/approval-workflow.png");
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
copyPublic();

const latest = articles.slice(0, 8);
const body = `<section class="home-hero">
  <div class="wrap hero-grid">
    <div>
      <p class="eyebrow">AdSense approval guide</p>
      <h1>애드센스 승인 준비를 한곳에서 정리하세요</h1>
      <p>사이트 구조, 글쓰기, 정책 점검, 거절 사유 해결, 승인 이후 수익화까지 초보 운영자가 따라갈 수 있는 실전 정보 허브입니다.</p>
      <div class="hero-actions">
        <a class="button primary" href="/checklist/">승인 전 체크리스트</a>
        <a class="button" href="/approval/">승인 가이드 보기</a>
      </div>
    </div>
    <figure class="hero-media">
      <img src="/assets/approval-workflow.png" alt="애드센스 승인 준비 흐름도">
    </figure>
  </div>
</section>
<section class="wrap section">
  <h2>원하는 방식으로 찾아보세요</h2>
  <div class="quick-grid">
    <a href="/approval/"><strong>승인 준비</strong><span>도메인, 구조, 색인, 신청 순서</span></a>
    <a href="/rejection/"><strong>거절 해결</strong><span>낮은 가치, 탐색, 접근 불가 대응</span></a>
    <a href="/writing/"><strong>글쓰기</strong><span>주제 선정, 본문 구성, 내부 링크</span></a>
    <a href="/policy/"><strong>정책 체크</strong><span>개인정보, 쿠키, 금지 콘텐츠</span></a>
  </div>
</section>
<section class="band">
  <div class="wrap split">
    <div>
      <p class="eyebrow">신청 전 핵심</p>
      <h2>승인 가능성을 높이는 기본 원칙</h2>
      <p>공식 도움말은 고유하고 흥미로운 콘텐츠, 쉬운 탐색, 정책 준수를 강조합니다. 이 사이트는 그 기준을 운영자가 실행 가능한 점검표로 바꾸는 데 집중합니다.</p>
    </div>
    <ol class="steps">
      <li><strong>주제 명확화</strong><span>방문자가 어떤 문제를 해결할 수 있는지 첫 화면에서 보여줍니다.</span></li>
      <li><strong>콘텐츠 완성도</strong><span>얇은 글보다 판단 기준과 예시가 있는 글을 우선합니다.</span></li>
      <li><strong>정책 페이지</strong><span>개인정보, 쿠키, 문의, 면책 고지를 공개합니다.</span></li>
      <li><strong>색인 확인</strong><span>Search Console에서 주요 페이지가 발견되는지 확인합니다.</span></li>
    </ol>
  </div>
</section>
<section class="wrap section">
  <h2>최근 업데이트된 가이드</h2>
  <div class="grid three">${latest.map(articleCard).join("")}</div>
</section>`;

write("index.html", layout({ title: "애드센스 승인 준비와 수익형 글쓰기 가이드", description: site.description, content: body }));

for (const key of Object.keys(categories)) {
  write(`${key}/index.html`, categoryPage(key));
}

for (const article of articles) {
  write(`guides/${article[1]}/index.html`, articlePage(article));
}

write("checklist/index.html", staticPage("애드센스 신청 전 체크리스트", "신청 직전 사이트 구조, 콘텐츠, 정책, 색인 상태를 확인하는 최종 점검표입니다.", "/checklist/", `
<h2>기본 페이지</h2>
<ul><li>소개, 문의, 개인정보처리방침, 이용약관, 면책 고지가 공개되어 있습니다.</li><li>상단 메뉴와 하단 링크가 모두 정상 작동합니다.</li><li>빈 카테고리와 임시 글이 없습니다.</li></ul>
<h2>콘텐츠</h2>
<ul><li>카테고리별 대표 글이 고르게 있습니다.</li><li>각 글은 독자 문제, 해결 순서, 주의점, 관련 링크를 포함합니다.</li><li>비슷한 글은 병합하거나 관점을 분리했습니다.</li></ul>
<h2>기술 점검</h2>
<ul><li>HTTPS가 정상 적용되어 있습니다.</li><li>모바일에서 텍스트와 메뉴가 겹치지 않습니다.</li><li>sitemap.xml과 robots.txt가 정상 배포됩니다.</li></ul>`));

write("about/index.html", staticPage("소개", "Alpha AdSense의 운영 목적과 콘텐츠 작성 원칙을 안내합니다.", "/about/", `
<p>Alpha AdSense는 애드센스 승인을 준비하는 초보 사이트 운영자를 위해 만들어진 독립 정보 사이트입니다. 승인 보장을 약속하지 않고, 공식 정책을 기준으로 사이트 구조와 콘텐츠 품질을 점검하는 방법을 정리합니다.</p>
<h2>운영 원칙</h2>
<ul><li>공식 도움말을 우선 참고합니다.</li><li>승인 꼼수보다 장기 운영에 도움이 되는 기준을 다룹니다.</li><li>수익 보장, 클릭 유도, 정책 우회 방법을 안내하지 않습니다.</li></ul>`));

write("contact/index.html", staticPage("문의", "사이트 내용 오류, 수정 요청, 운영 관련 문의를 보낼 수 있습니다.", "/contact/", `
<p>문의는 이메일로 보내 주세요.</p>
<p><a href="mailto:${site.email}">${site.email}</a></p>
<p>정책과 심사 결과는 구글 애드센스의 판단에 따라 달라질 수 있으므로 개별 승인 보장은 답변하지 않습니다.</p>`));

write("privacy/index.html", staticPage("개인정보처리방침", "Alpha AdSense의 개인정보 처리와 쿠키, 광고 관련 고지 사항입니다.", "/privacy/", `
<p>Alpha AdSense는 문의 응답을 위해 사용자가 직접 제공한 이메일 주소와 문의 내용을 처리할 수 있습니다.</p>
<h2>쿠키와 광고</h2>
<p>향후 Google AdSense가 적용될 경우 Google을 포함한 제3자 공급업체가 쿠키를 사용해 사용자의 이전 방문 기록을 기반으로 광고를 게재할 수 있습니다. 사용자는 Google 광고 설정에서 맞춤 광고를 선택 해제할 수 있습니다.</p>
<h2>문의</h2>
<p>개인정보 관련 요청은 <a href="mailto:${site.email}">${site.email}</a>로 보낼 수 있습니다.</p>`));

write("cookie-policy/index.html", staticPage("쿠키 정책", "Alpha AdSense에서 사용할 수 있는 쿠키와 광고 기술, 맞춤 광고 선택권을 안내합니다.", "/cookie-policy/", `
<p>Alpha AdSense는 사이트 품질 개선, 기본 보안, 검색 유입 분석, 광고 게재를 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.</p>
<h2>광고 쿠키</h2>
<p>Google AdSense가 적용될 경우 Google과 제3자 광고 공급업체는 쿠키를 사용해 방문자의 이전 방문 기록을 기반으로 광고를 게재할 수 있습니다. Google의 광고 쿠키는 방문자가 이 사이트와 다른 사이트를 방문한 정보를 바탕으로 맞춤 광고를 제공하는 데 사용될 수 있습니다.</p>
<h2>맞춤 광고 선택 해제</h2>
<p>방문자는 Google 광고 설정에서 맞춤 광고를 선택 해제할 수 있습니다. 또한 브라우저 설정에서 쿠키 저장을 제한하거나 기존 쿠키를 삭제할 수 있습니다.</p>
<h2>운영 기준</h2>
<p>이 사이트는 광고 클릭을 유도하거나 광고를 메뉴, 다운로드, 다음 단계 버튼처럼 오해하게 만드는 방식을 사용하지 않습니다. 광고와 콘텐츠는 독자가 구분할 수 있도록 배치하는 것을 원칙으로 합니다.</p>
<h2>문의</h2>
<p>쿠키와 광고 기술 관련 문의는 <a href="mailto:${site.email}">${site.email}</a>로 보낼 수 있습니다.</p>`));

write("terms/index.html", staticPage("이용약관", "Alpha AdSense 이용 시 적용되는 기본 약관입니다.", "/terms/", `
<p>이 사이트의 콘텐츠는 정보 제공 목적으로 작성되며, 사전 고지 없이 수정될 수 있습니다.</p>
<p>콘텐츠를 무단 복제하거나 승인 보장 자료로 오해하게 재배포하는 행위를 금지합니다.</p>`));

write("disclaimer/index.html", staticPage("면책 고지", "애드센스 승인, 정책, 수익 정보에 관한 책임 범위를 안내합니다.", "/disclaimer/", `
<p>Alpha AdSense는 애드센스 승인과 수익을 보장하지 않습니다. 정책과 심사 기준은 변경될 수 있으며, 최종 판단은 Google AdSense의 최신 정책과 심사 결과를 따릅니다.</p>
<p>수익 관련 정보는 일반적인 운영 참고 자료이며 투자, 법률, 세무 자문이 아닙니다.</p>`));

write("editorial-policy/index.html", staticPage("운영 원칙", "Alpha AdSense의 콘텐츠 작성 기준, 정책 준수 원칙, 광고 운영 기준을 안내합니다.", "/editorial-policy/", `
<p>Alpha AdSense는 애드센스 승인을 준비하는 운영자에게 실무적으로 도움이 되는 정보를 제공하기 위해 운영됩니다. 이 사이트는 승인 보장, 정책 우회, 클릭 유도, 무효 트래픽 유발 방법을 다루지 않습니다.</p>
<h2>콘텐츠 작성 기준</h2>
<ul><li>공식 도움말과 실제 사이트 운영에 필요한 점검 기준을 우선합니다.</li><li>단순 반복 문장보다 절차, 예시, 체크리스트, 주의점을 포함합니다.</li><li>정책이나 기능이 바뀔 수 있는 내용은 정기적으로 검토합니다.</li><li>타인의 글을 복제하지 않고 독자가 실행할 수 있는 설명을 제공합니다.</li></ul>
<h2>정책 준수 기준</h2>
<ul><li>애드센스 프로그램 정책과 Google 게시자 정책을 기준으로 콘텐츠를 점검합니다.</li><li>금지 콘텐츠, 오해를 부르는 수익 보장 표현, 광고 클릭 유도 표현을 사용하지 않습니다.</li><li>의료, 금융, 법률처럼 신중한 판단이 필요한 주제는 단정적인 조언을 피합니다.</li></ul>
<h2>광고 운영 기준</h2>
<p>광고가 적용될 경우 광고와 콘텐츠가 명확히 구분되도록 운영합니다. 사용자가 실수로 광고를 클릭하게 만드는 배치, 과도한 광고 밀도, 콘텐츠를 가리는 광고 방식은 사용하지 않습니다.</p>
<h2>수정 요청</h2>
<p>오류, 오래된 정보, 정책상 문제가 있는 표현을 발견하면 <a href="mailto:${site.email}">${site.email}</a>로 알려 주세요.</p>`));

write("sources/index.html", staticPage("출처 및 참고자료", "사이트 작성 시 우선 확인하는 공식 자료 목록입니다.", "/sources/", `
<ul>${officialLinks.map(([label, href]) => `<li><a href="${href}" rel="nofollow noopener">${esc(label)}</a></li>`).join("")}</ul>`));

const urls = [
  "/",
  ...Object.keys(categories).map((key) => `/${key}/`),
  "/checklist/",
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
.skip { position: absolute; left: -999px; top: 12px; background: var(--ink); color: white; padding: 8px 12px; z-index: 3; }
.skip:focus { left: 12px; }
.wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
.site-header { border-bottom: 1px solid var(--line); background: rgba(255,255,255,.95); position: sticky; top: 0; z-index: 2; }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 0; }
.brand { font-size: 22px; font-weight: 800; letter-spacing: 0; white-space: nowrap; }
.brand span { color: var(--blue); }
.nav { display: flex; flex-wrap: wrap; gap: 14px; justify-content: flex-end; font-size: 14px; color: var(--muted); }
.nav a { padding: 4px 0; }
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
.hero-media { margin: 0; }
.hero-media img { width: 100%; height: auto; display: block; border-radius: 8px; box-shadow: var(--shadow); border: 1px solid var(--line); }
.section { padding: 52px 0; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.quick-grid a, .card { border: 1px solid var(--line); border-radius: 8px; background: white; padding: 22px; box-shadow: 0 6px 18px rgba(21,32,51,.04); }
.quick-grid span, .card p { display: block; color: var(--muted); font-size: 15px; }
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
.article { max-width: 820px; padding-bottom: 34px; }
.article a { color: var(--blue); text-decoration: underline; text-underline-offset: 3px; }
.article h2 { margin-top: 34px; }
.article li { margin-bottom: 8px; }
.note { border-left: 4px solid var(--amber); background: #fff8ed; padding: 16px 18px; margin: 28px 0; }
.footer { background: #111827; color: #e5e7eb; padding: 34px 0; margin-top: 36px; }
.footer a { color: white; text-decoration: underline; text-underline-offset: 3px; }
.footer p { color: #cbd5e1; margin-bottom: 8px; }
.footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media (max-width: 860px) {
  .header-inner { align-items: flex-start; flex-direction: column; }
  .nav { justify-content: flex-start; }
  .hero-grid, .split, .footer-grid { grid-template-columns: 1fr; }
  .quick-grid, .grid.three { grid-template-columns: 1fr 1fr; }
  h1 { font-size: 36px; }
}
@media (max-width: 560px) {
  .wrap { width: min(100% - 24px, 1120px); }
  .quick-grid, .grid.three { grid-template-columns: 1fr; }
  .hero-grid { padding-top: 42px; }
  h1 { font-size: 30px; }
  h2 { font-size: 24px; }
  .nav { gap: 10px 12px; }
}
`);

console.log(`Built ${urls.length} pages for ${site.name}`);
