# 개인정보·쿠키 안내 검증

검사일: 2026-10-27. 구현 커밋 `7c0d5f1` 공개 배포 확인 완료.

## 변경 범위

- `privacy-policy-for-adsense`: 실제 작업표·계산기·편집 시간표·검색·이메일·호스팅의 처리 흐름, 제한된 공개 관찰, 삭제 범위와 운영자 확인 과제를 구분했다.
- `cookie-notice-basics`: 고지·동의·Google 광고 개인화 설정·브라우저 삭제를 분리했다. 제품·지역·목적과 공식 CMP 요구, 선택 전/거부/허용/철회/오류의 구현 검사 계획을 추가했다.
- 공개 개인정보·쿠키 페이지를 현재 기능과 향후 광고 계획으로 구분하고 실제 저장 키·삭제 범위·검색 URL과 호스팅 처리의 차이를 반영했다.
- 검색 입력 옆에 주소·방문 기록과 민감정보 주의 안내, 상세 처리 절 링크를 추가했다. 검색 동작은 변경하지 않았다.
- 정책 허브에서 실제 처리 흐름과 동의 검사 절로 직접 연결했다. 기존 주소·원래 발행일 유지. 개별 본문 28개, 남은 6개. 이는 편집 진척이며 승인 확률이 아니다.
- 공개 개인정보 절의 제목이 고정 메뉴에 가려지는 문제를 로컬 검사에서 발견했다. 정적 본문의 id 있는 직계 h2에도 기존 가이드와 같은 이동 여백·초점 표시를 적용하고 CSS 주소 버전을 갱신했다. 새 링크 이동으로 재검사했다. 기존 위치를 보존한 새로고침은 새 절 이동과 구분했다.
- 실제 광고·CMP·새 분석/추적 코드·동의 버튼·계정 설정·기록 삭제·재검토 요청은 실행하지 않았다.

## 실제 확인 근거

- 작업표: `content-audit.mjs`와 `tool-engine.mjs`의 localStorage 읽기·쓰기·해당 키 삭제·실패 처리. 키는 `alphaadsense.content-audit.v1`이며 고정 자동 만료일 없음.
- 계산기·시간표: 입력 전송·영구 저장 API 없음. CSV는 `tool-download.mjs`에서 기기 파일로 생성하며 원격 업로드 기능 없음.
- 검색: 공개 검색 자료를 fetch한 뒤 브라우저에서 비교. `history.pushState`로 q/page 주소 변경. 주소 변경 그 자체와 새로고침·직접 접속·공유 시 요청을 구분했다.
- 공개 `/privacy/`, `/tools/approval-score/`, `/search/`에 대한 일반 GET: 200, server=cloudflare, 세 응답의 Set-Cookie 헤더 없음. Cloudflare 이메일 표시용 스크립트 경로 확인. 해당 HTML에서 AdSense/대표 분석 태그 미발견.
- 위 HTTP 관찰은 브라우저 실행·저장소·모든 페이지·지역·시간의 전수 검사나 서버 로그 감사가 아니다. Cloudflare 계정 설정과 메일함·광고 계정은 미조회.
- 사용자는 이 대화에서 문의 이메일 보관·삭제 기준을 ‘미정’으로 확인했다. 공개 안내에 이를 반영했으며 특정 삭제 기간·법적 보관 근거·자동 파기를 만들어 넣지 않았다.

## 공식 자료와 한계

- [AdSense 필수 콘텐츠](https://support.google.com/adsense/answer/1348695?hl=ko): 실제 광고 적용 시 고지 항목·선택권.
- [Google EU 사용자 동의 정책](https://www.google.com/about/company/user-consent-policy/): 적용 제품·지역·목적, 동의 기록과 철회.
- [게시자 CMP 요구](https://support.google.com/adsense/answer/13554116?hl=ko): 개인 맞춤 광고의 인증 CMP/TCF 요구와 인증의 한계. 첫 조회는 시간 초과, 재조회 성공.
- [개인 맞춤/비맞춤 광고](https://support.google.com/adsense/answer/9007336?hl=ko), [CMP 설정](https://support.google.com/adsense/answer/7670013?hl=ko): 비맞춤 광고를 무쿠키·무동의라고 단정하지 않음. 실제 제공자와 구현 범위 구분.
- [Cloudflare 쿠키](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/): 제품별 설명을 현재 활성 쿠키 목록으로 복사하지 않음.
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState): 브라우저 저장과 주소 변경의 기술 범위.
- [2026 개인정보 처리방침 작성지침 게시 안내](https://www.privacy.go.kr/front/bbs/bbsView.do?bbsNo=BBSMSTR_000000000049&bbscttNo=20885): 공식 검색 결과의 게시 사실 확인. 상세 조회는 502 오류였으며 첨부 PDF의 법적 항목 대조 완료로 표현하지 않았다.

법률 준수·계약/국외 처리 검토 완료·동의 수집 성공·승인을 인증하지 않는다. 해당 지역·계정·실제 처리 조건과 최신 원문 확인은 별도다.

## 자동 검사

- `npm test`: 87개 통과, 실패 0. 최종 CSS·이메일 기준 미정 반영 후 재실행.
- 실제/가상/미확인 경계, 구형 반복 본문 제거, 현재 처리와 계획 구분 검사.
- 네 문서의 표 region·caption·행/열 제목·키보드 초점, 내부 절 목적지 검사.
- 검색 고지·정책 허브 연결, 정적 본문 h2 이동 여백과 버전 CSS 검사.
- 63개 HTML·62개 사이트맵 URL·인증 태그·자산·기존 링크·구조화 데이터·발행일 보존 검사 통과.
- 미개정 날짜 보존 검사 대상은 새로 개정한 개인정보 글 대신 `disclaimer-page-guide`로 변경.
- `git diff --check` 오류 없음. 줄바꿈 변환 경고만 표시.

## 로컬 화면·상호작용 검사

Chromium 인앱 브라우저. 실제 휴대폰·스크린리더 사용자·실제 광고/CMP·지역별 동의 메시지 시험은 미실행.

| 대상 | 실제 관찰 |
| --- | --- |
| 개인정보 글 1440px | clientWidth/scrollWidth 1425px, 본문 잘림 없음. 처리 흐름 목차 Enter 후 제목 초점·상단 약 150px |
| 개인정보 글 320px | clientWidth/scrollWidth 305px, 본문 잘림 없음. 목차 제목 초점·상단 약 180px, 표 ArrowRight 두 번 후 scrollLeft 76px |
| 개인정보 글 390px | clientWidth/scrollWidth 375px, 삭제 범위 목차 제목 초점·상단 약 180px |
| 쿠키 글 1440px | clientWidth/scrollWidth 1425px, 본문 잘림 없음. 동의 검사 목차 제목 초점·상단 약 150px |
| 쿠키 글 390px | clientWidth/scrollWidth 375px, 본문 잘림 없음. 동의 검사 목차 제목 초점·상단 약 180px |
| 쿠키 글 320px | clientWidth/scrollWidth 305px, 본문 잘림 없음. 표 키보드 가로 이동 약 79px |
| 공개 안내 로컬 320px | 개인정보·쿠키 페이지 문서 가로 넘침·잘린 본문 없음. 쿠키 글→개인정보 #local-tools 링크 Enter 후 제목 초점·상단 약 180px |
| 쿠키 정책→검색 범위 | 320px 실제 링크 Enter 후 #search-requests 제목 초점·상단 약 180px |
| 검색 320px | 주의 안내·상세 링크 표시. 비민감 검색어 ‘개인정보 안내 작성’의 결과·주소 반영, 잘림 없음. 처리 범위 링크 Enter 정상 도달 |
| 정책 허브 320px | 실제 처리 흐름 링크 Enter 후 #processing-inventory 제목 초점·상단 약 180px |

브라우저 콘솔 오류 없음. 실제 사용자 저장 자료·메일함을 열거나 삭제하지 않았다.

## 화면 기록

- [개인정보 흐름 데스크톱](qa/privacy-processing-desktop-20261027.jpg)
- [개인정보 흐름 모바일](qa/privacy-processing-mobile-20261027.jpg)
- [동의 검사 계획 데스크톱](qa/cookie-consent-desktop-20261027.jpg)
- [동의 검사 계획 모바일](qa/cookie-consent-mobile-20261027.jpg)

## 남은 작업

- 운영자: 실제 문의 보관 사유·필요 기간·삭제 방법과 메일/백업 처리를 결정해야 한다. 현재 미정이며 이 단계에서 법적 근거·기간을 대신 확정하지 않았다.
- 운영자 계정: Cloudflare 활성 기능·실제 로그 보관·계약상 처리, 실제 위탁/제공/국외 처리에 필요한 검토가 남아 있다.
- 다음 편집 단계: 면책 고지와 개인정보·쿠키 페이지 사례의 중복·독립 가치를 검토한다. 현재 여섯 글은 아직 개별 재작성/병합 미실행이다.
- 광고·CMP 도입은 별도 범위다. 안내 페이지·자동 검사 완료를 재검토 준비 완료나 법률 준수 인증으로 삼지 않는다.

## 공개 배포 검증

- 두 글·개인정보·쿠키·검색·정책 허브·업데이트 GET 200 응답. 각각 새 본문·고지와 소유권 인증 태그, 새 버전 CSS 주소 확인.
- `/styles.css?v=20261027-privacy-notice` 200 응답과 정적 본문 절의 이동 여백 규칙 확인.
- 검색 자료 200 응답과 두 글의 새 제목 확인. 공개 검색에서 ‘쿠키 고지와 동의’ 제출 후 결과 1개와 새 제목·목적지 확인.
- 개인정보 글 1440px 목차 Enter 후 #processing-inventory 제목 초점·상단 약 150px, 문서 clientWidth/scrollWidth 1425px 확인.
- 320px 공개 본문 링크로 개인정보 #local-tools 도달. 제목 초점·상단 약 180px, clientWidth/scrollWidth 305px, 이메일 보관 기준 미정 고지 확인.
- 쿠키 글 320px 동의 검사 목차 Enter 후 제목 초점·상단 약 180px, 문서 넘침 없음. 표의 접근 가능한 영역 이름 확인.
- 공개 검색의 주의 고지·처리 범위 링크 Enter 후 #search-requests 제목 초점·상단 약 180px 확인.
- 브라우저 콘솔 오류 없음. [공개 개인정보 처리 흐름표](qa/privacy-cookie-live-20261027.jpg) 확인. 실제 계정·동의 수집·법률 준수·승인 결과 화면이 아니다.
