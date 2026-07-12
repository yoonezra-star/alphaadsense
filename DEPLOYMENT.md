# alphaadsense.com 배포 체크리스트

## 1. GitHub 저장소 만들기

1. GitHub에서 새 저장소를 만듭니다.
2. 추천 저장소 이름은 `alphaadsense`입니다.
3. Public 또는 Private 둘 다 가능하지만, Cloudflare Pages 연결을 편하게 하려면 GitHub 권한 연결이 필요합니다.

## 2. 로컬 저장소와 GitHub 연결

GitHub 저장소를 만든 뒤 아래 형식의 원격 주소를 연결합니다.

```powershell
git remote add origin https://github.com/계정명/alphaadsense.git
git push -u origin main
```

## 3. Cloudflare Pages 연결

1. Cloudflare 대시보드에서 Workers & Pages로 이동합니다.
2. Pages 프로젝트를 새로 만듭니다.
3. GitHub 저장소 `alphaadsense`를 선택합니다.
4. 빌드 설정은 아래처럼 입력합니다.

```text
Build command: npm run build
Build output directory: dist
Root directory: /
```

## 4. 가비아 도메인을 Cloudflare로 연결

1. Cloudflare에 `alphaadsense.com` 사이트를 추가합니다.
2. Cloudflare가 제공하는 네임서버 2개를 확인합니다.
3. 가비아 도메인 관리에서 네임서버를 Cloudflare 값으로 변경합니다.
4. DNS 전파가 완료될 때까지 기다립니다.

## 5. 커스텀 도메인 연결

Cloudflare Pages 프로젝트에서 아래 도메인을 연결합니다.

```text
alphaadsense.com
www.alphaadsense.com
```

## 6. 배포 후 확인

아래 주소가 모두 정상 접속되는지 확인합니다.

```text
https://alphaadsense.com/
https://alphaadsense.com/sitemap.xml
https://alphaadsense.com/privacy/
https://alphaadsense.com/contact/
```

## 7. Search Console과 AdSense

1. Google Search Console에 `alphaadsense.com`을 등록합니다.
2. `https://alphaadsense.com/sitemap.xml`을 제출합니다.
3. 주요 페이지가 색인되기 시작하면 애드센스 신청을 진행합니다.

신청 전에는 빈 카테고리, 깨진 링크, 임시 페이지, 개인정보처리방침 누락이 없는지 다시 확인하세요.
