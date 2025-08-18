# 환경 설정
## 백엔드 환경변수 (선택사항)
backend 폴더에 .env 파일 생성:
```
KMA_API_KEY=your_kma_api_key_here
KHOA_API_KEY=your_khoa_api_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 프론트엔드 환경변수 (선택사항)
frontend 폴더에 .env 파일 생성:
```
VITE_BACKEND_URL=http://localhost:8000
VITE_KAKAO_APPKEY=your_kakao_api_key_here
```

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

# 문제 해결
- CORS 오류: 백엔드 재시작 후 다시 시도
- API 키 오류: .env 파일에 올바른 API 키 설정
- 지도 로드 실패: VITE_KAKAO_APPKEY 설정 확인