# 환경 설정
## 백엔드 환경변수 (필수)
backend 폴더에 .env 파일 생성:
```
KMA_API_KEY=your_kma_api_key_here
KHOA_API_KEY=your_khoa_api_key_here
KAKAO_API_KEY=your_kakao_rest_api_key_here
VITE_KAKAO_APPKEY=your_kakao_javascript_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 프론트엔드 환경변수 (필수)
frontend 폴더에 .env 파일 생성:
```
VITE_BACKEND_URL=http://localhost:8000
VITE_KAKAO_APPKEY=your_kakao_api_key_here
```

### 카카오 API 키 발급 방법
1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. **프론트엔드용**: JavaScript 키 발급 → VITE_KAKAO_APPKEY
4. **백엔드용**: REST API 키 발급 → KAKAO_API_KEY
5. 플랫폼 > Web 플랫폼 등록에서 http://localhost:5173 추가

# 실행 방법
## 백엔드
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## 프론트엔드
cd frontend
npm install
npm run dev

# 연결 테스트
1. 백엔드가 http://localhost:8000 에서 실행 중인지 확인
2. 프론트엔드가 http://localhost:5173 에서 실행 중인지 확인
3. 브라우저에서 개발자 도구 > Network 탭에서 API 호출 확인
4. 지도가 로드되고 마커들이 표시되는지 확인
5. 마커 클릭 시 해양 정보가 표시되는지 확인

# 프로젝트 구조
```
water-sports-reco/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 앱
│   │   ├── config.py        # 환경 설정
│   │   ├── schemas.py       # 데이터 모델
│   │   └── services/        # 외부 API 클라이언트
│   │       ├── kma_client.py
│   │       └── khoa_client.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── geo/
│   │       └── korea_sido_simple.json  # 시/도 경계 데이터
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── MapView.jsx  # 카카오맵 지도
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── RegionFilter.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── hooks/
│   │   │   └── useKakaoLoader.js
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
└── README.md
```

# 주요 기능
- 🗺️ 카카오맵 기반 인터랙티브 지도
- 🌊 실시간 해양 정보 표시 (수온, 파고, 조류)
- 🏄 지역별 해양레저 사업장 검색 및 표시
- 🎯 활동별 필터링 (스쿠버다이빙, 카약, 요트 등)
- 💬 AI 챗봇 인터페이스
- 📍 시/도 단위 지역 선택 및 애니메이션
- 📍 활동별 색상 구분 마커 표시

# 문제 해결
자세한 문제 해결 가이드는 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 참고하세요.

# 개발 환경
- Frontend: React 18, Vite, 카카오맵 API
- Backend: FastAPI, Python 3.9+
- External APIs: 기상청(KMA), 국립해양조사원(KHOA)