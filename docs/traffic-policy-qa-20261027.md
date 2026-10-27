# 트래픽 품질·콘텐츠 정책 분류 검증

검사일: 2026-10-27. 공개 배포 확인 대기.

## 변경 범위

- `traffic-quality`: 유입 변화·무효 광고 트래픽·계정 안내를 구분. 비교 조건, 설명용 CTR 계산, 근거에 맞는 대응과 조사 한계를 정리했다.
- `prohibited-content-check`: 게시자 정책 위반·제한사항·미확인을 구분. 문맥·권리·연결·기능 검토, 가상 사례와 수정 기록을 추가했다.
- 검색 유입이면 안전하다는 단정, 애매한 콘텐츠를 승인 이후로 미루면 안전하다는 안내를 제거했다. 면책 문구나 심사 때만 숨기는 방법을 해결책으로 삼지 않는다.
- 정책 허브의 추천 순서·판단표·직접 연결과 거절 진단의 정책 선택 결과를 맞췄다. 다른 허브 순서·공통 스타일은 변경하지 않았다.
- 개별 본문 26개, 남은 8개. 이 수치는 편집 진척이며 승인 확률이나 Google의 점수가 아니다. 기존 URL·원래 발행일과 인증 태그를 유지했다.
- 실제 광고 계정·경고·유입 보고서·개별 요청의 무효 여부는 조회하지 않았다. 광고 클릭·코드 추가·유입 차단·계정 설정·재검토 요청을 실행하지 않았다.

## 공식 자료

다음 Google 공식 원문을 확인하고 각 글에 출처와 확인 범위를 연결했다. 예시 표는 정책 전체 목록이나 실제 계정 판정이 아니다.

- [무효 트래픽](https://support.google.com/adsense/answer/16737?hl=ko)
- [무효 트래픽 방지](https://support.google.com/adsense/answer/1112983)
- [광고 게재 제한](https://support.google.com/adsense/answer/9437976?hl=ko)
- [프로그램 정책](https://support.google.com/adsense/answer/48182?hl=ko)
- [게시자 정책](https://support.google.com/adsense/answer/10502938?hl=ko)
- [게시자 제한사항](https://support.google.com/adsense/answer/10437795?hl=ko)
- [정책과 제한사항 구분](https://support.google.com/adsense/answer/10008391?hl=ko)

정책·법적 문제와 광고 수요 감소를 같은 결론으로 쓰지 않았다. 필요한 법률·전문 검토나 현재 계정 확인을 대신하지 않는다. 제한 해제 일수·안전 CTR·정상 유입 비율을 고정 기준으로 제시하지 않았다.

## 자동 검사

- `npm test`: 83개 통과, 실패 0.
- 두 글의 고유 절·실제/가상/미확인 경계, 구형 단정 제거, 광고 코드 미추가 검사.
- 표의 region·키보드 초점·caption·행/열 제목, 내부 절 목적지와 관련 문서 검사.
- 정책 허브 순서·수정일과 진단 결과, 업데이트 기록 검사.
- 63개 HTML·62개 사이트맵 URL, 기존 링크·자산·인증 태그·구조화 데이터와 발행일 보존 검사 통과.
- 미개정 날짜 보존 검사 대상은 이번에 개정한 트래픽 글 대신 `privacy-policy-for-adsense`로 변경했다.

## 로컬 브라우저 검사

Chromium 인앱 브라우저. 실물 휴대폰·스크린리더 사용자·실제 광고 조합 시험은 수행하지 않았다.

| 대상 | 실제 관찰 |
| --- | --- |
| 트래픽 글 1440px | clientWidth/scrollWidth 1425px, 잘린 본문 없음. 가상 수치 목차 Enter 후 제목 초점·상단 약 150px |
| 트래픽 글 320px | clientWidth/scrollWidth 305px, 잘린 본문 없음. 표 281px 내부에서 640px 내용 이동, ArrowRight 두 번 후 scrollLeft 76px |
| 트래픽 글 390px | clientWidth/scrollWidth 375px, 계정 안내 목차 제목 초점·상단 약 180px |
| 트래픽→승인 후 안내 | 390px 본문 링크 Enter로 #status-boundaries 도달, 제목 초점·상단 약 180px |
| 정책 글 1440px | clientWidth/scrollWidth 1425px, 잘린 본문 없음. 분류 목차 제목 초점·상단 약 150px |
| 정책 글 320px | clientWidth/scrollWidth 305px, 잘린 본문 없음. 분류 목차 제목 초점·상단 약 180px, 표 키보드 이동 76px |
| 정책 글 390px | clientWidth/scrollWidth 375px, 가상 사례 목차 제목 초점·상단 약 180px |
| 정책 허브 320px | clientWidth/scrollWidth 305px, 잘린 본문 없음. 정책 분류→개인정보→쿠키→면책 순서와 분류 절 실제 도달 확인 |
| 거절 진단 320px | 정책 위반 의심 선택 후 새 우선순위·근거·주의 문구 표시. 잘림·문서 넘침 없음, 정책 분류 링크 Enter 후 제목 초점 확인 |

브라우저 콘솔 오류 없음. 표의 가로 이동은 문서 전체의 가로 넘침과 구분했다.

## 화면 기록

- [트래픽 가상 수치 데스크톱](qa/traffic-evidence-desktop-20261027.jpg)
- [트래픽 가상 수치 모바일](qa/traffic-evidence-mobile-20261027.jpg)
- [정책 분류 데스크톱](qa/policy-classification-desktop-20261027.jpg)
- [정책 분류 모바일](qa/policy-classification-mobile-20261027.jpg)

## 다음 단계

개인정보·쿠키 안내 두 글을 실제 수집·저장·전송과 현재 동의 요구에 맞춰 검토한다. 문구를 늘리는 것만으로 법률 준수나 재검토 준비 완료를 선언하지 않는다. 남은 본문·실제 계정 상태 확인 전 재검토는 미실행으로 유지한다.
