
# 🌊 해양레저 추천 플랫폼

JWT 토큰 기반 사용자 인증 시스템이 포함된 실시간 해양 정보 기반 레저 추천 서비스입니다.

## 🚀 빠른 시작

> **⚡ 빠른 해결**: 백엔드 실행 오류가 발생하면 아래 명령어를 순서대로 실행하세요:
> ```bash
> cd backend
> pip install --upgrade pip
> pip install "python-jose[cryptography]" bcrypt aiomysql passlib[bcrypt]
> uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
> ```

### 1. 데이터베이스 설정 (Docker MySQL)

```bash
# Docker Compose로 MySQL 시작
docker-compose up -d mysql

# 또는 모든 서비스 시작 (MySQL + phpMyAdmin)
docker-compose up -d
```

**데이터베이스 연결 정보:**
- 호스트: localhost:3306
- 데이터베이스: water_sports_db
- 사용자: water_sports_user
- 비밀번호: water_sports_password

### 2. 환경변수 설정

#### 백엔드 환경변수 (backend/.env)
```env
# 기존 API 키들
KMA_API_KEY=your_kma_api_key_here
KHOA_API_KEY=your_khoa_api_key_here
KAKAO_API_KEY=your_kakao_rest_api_key_here
VITE_KAKAO_APPKEY=your_kakao_javascript_key_here
TOURIST_API_KEY=your_tourist_api_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# 데이터베이스 설정
DATABASE_URL=mysql://water_sports_user:water_sports_password@localhost:3306/water_sports_db
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=water_sports_db
MYSQL_USER=water_sports_user
MYSQL_PASSWORD=water_sports_password

# JWT 토큰 설정
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

#### 프론트엔드 환경변수 (frontend/.env)
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_KAKAO_APPKEY=your_kakao_api_key_here
```

### 카카오 API 키 발급 방법
1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 애플리케이션 생성
3. **프론트엔드용**: JavaScript 키 발급 → VITE_KAKAO_APPKEY
4. **백엔드용**: REST API 키 발급 → KAKAO_API_KEY
5. 플랫폼 > Web 플랫폼 등록에서 http://localhost:5173 추가

### 3. 백엔드 실행

```bash
cd backend

# Python 가상환경 생성 (Python 3.9-3.12 권장)
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

# pip 업그레이드
python -m pip install --upgrade pip

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **⚠️ Python 버전 호환성**: Python 3.13에서는 일부 타입 힌트 문제가 발생할 수 있습니다. **Python 3.9-3.12 사용을 권장**합니다.

### 의존성 설치 문제 해결

만약 의존성 설치 중 오류가 발생하면:

```bash
# 개별 패키지 설치 (JWT 관련 오류 해결)
pip install fastapi uvicorn[standard] httpx python-dotenv pydantic pydantic-settings
pip install aiomysql bcrypt "python-jose[cryptography]" "passlib[bcrypt]" python-multipart email-validator

# 또는 캐시 클리어 후 재설치
pip cache purge
pip install -r requirements.txt --no-cache-dir
python.exe -m pip install --upgrade pip

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **⚠️ Python 버전 호환성**: Python 3.13에서는 일부 타입 힌트 문제가 발생할 수 있습니다. **Python 3.9-3.12 사용을 권장**합니다.

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 🔧 DBeaver 연결 설정

1. **DBeaver 실행** 후 새 연결 생성
2. **데이터베이스 타입**: MySQL 선택
3. **연결 정보 입력**:
   - Server Host: `localhost`
   - Port: `3306`
   - Database: `water_sports_db`
   - Username: `water_sports_user`
   - Password: `water_sports_password`
4. **연결 테스트** 후 저장

## 🌐 웹 기반 데이터베이스 관리

phpMyAdmin 접속: `http://localhost:8080`
- 사용자명: water_sports_user
- 비밀번호: water_sports_password

# 연결 테스트
1. 백엔드가 http://localhost:8000 에서 실행 중인지 확인
2. 프론트엔드가 http://localhost:5173 에서 실행 중인지 확인
3. 브라우저에서 개발자 도구 > Network 탭에서 API 호출 확인
4. 지도가 로드되고 마커들이 표시되는지 확인
5. 마커 클릭 시 해양 정보가 표시되는지 확인

## 📁 프로젝트 구조

```
water-sports-reco/
├── docker-compose.yml       # Docker MySQL 설정
├── database/
│   ├── init.sql            # 데이터베이스 초기화 스크립트
│   └── README.md           # 데이터베이스 설정 가이드
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI 메인 애플리케이션
│   │   ├── config.py       # 환경 설정 관리
│   │   ├── database.py     # 데이터베이스 연결 관리
│   │   ├── routers/        # API 라우터
│   │   │   ├── auth.py     # 인증 API (회원가입, 로그인, 토큰 갱신)
│   │   │   └── users.py    # 사용자 관리 API (프로필, 비밀번호 변경)
│   │   ├── schemas/        # Pydantic 데이터 모델
│   │   │   └── auth.py     # 인증 관련 스키마
│   │   ├── services/       # 비즈니스 로직 서비스
│   │   │   ├── jwt_service.py      # JWT 토큰 관리
│   │   │   ├── password_service.py # 비밀번호 해시화
│   │   │   ├── user_service.py     # 사용자 데이터베이스 작업
│   │   │   ├── kma_client.py       # 기상청 API
│   │   │   └── tourist_client.py   # 관광 API
│   │   └── exceptions/     # 커스텀 예외 클래스
│   │       └── auth_exceptions.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # 메인 앱 (라우터 설정)
│   │   ├── contexts/       # React 컨텍스트
│   │   │   └── AuthContext.jsx  # 인증 상태 관리
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── HomePage.jsx     # 메인 페이지 (지도 + 채팅)
│   │   │   ├── LoginPage.jsx    # 로그인 페이지
│   │   │   ├── RegisterPage.jsx # 회원가입 페이지
│   │   │   └── ProfilePage.jsx  # 마이페이지
│   │   ├── components/     # 재사용 컴포넌트
│   │   │   ├── Header.jsx       # 헤더 (인증 상태 표시)
│   │   │   ├── ProtectedRoute.jsx # 보호된 라우트
│   │   │   ├── MapView.jsx      # 카카오맵
│   │   │   └── ChatWindow.jsx   # AI 챗봇
│   │   └── api/            # API 클라이언트
│   │       ├── client.js        # HTTP 클라이언트 (인터셉터 포함)
│   │       └── auth.js          # 인증 API 함수
│   └── package.json
└── README.md
```

## ✨ 주요 기능

### 🔐 사용자 인증 시스템
- **회원가입/로그인**: 이메일 기반 사용자 등록 및 인증
- **JWT 토큰 인증**: Access Token (15분) + Refresh Token (7일)
- **자동 토큰 갱신**: 만료 5분 전 자동 갱신으로 끊김 없는 사용
- **마이페이지**: 프로필 수정, 비밀번호 변경
- **보안 기능**: 계정 잠금, 비밀번호 해시화 (bcrypt)

### 🗺️ 해양 정보 서비스
- **카카오맵 기반 인터랙티브 지도**
- **실시간 해양 정보 표시** (수온, 파고, 조류)
- **지역별 해양레저 사업장 검색 및 표시**
- **활동별 필터링** (스쿠버다이빙, 카약, 요트 등)
- **시/도 단위 지역 선택 및 애니메이션**
- **활동별 색상 구분 마커 표시**

### 💬 AI 서비스
- **AI 챗봇 인터페이스**
- **개인화된 추천** (로그인 사용자 대상)

# 문제 해결
자세한 문제 해결 가이드는 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 참고하세요.

## 🛠️ 기술 스택

### Backend
- **Framework**: FastAPI 0.111.0
- **Python**: 3.9-3.12 (3.13 호환성 이슈 있음)
- **Database**: MySQL 8.0 (Docker)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **Database ORM**: aiomysql (비동기)
- **Validation**: Pydantic

### Frontend  
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Routing**: React Router DOM 6.26.1
- **HTTP Client**: Axios 1.11.0
- **Map API**: 카카오맵 JavaScript API

### Infrastructure
- **Database**: MySQL 8.0 (Docker Container)
- **Database Management**: DBeaver, phpMyAdmin
- **External APIs**: 기상청(KMA), 국립해양조사원(KHOA), 한국관광공사

## 🔒 보안 기능

- **JWT 토큰 기반 인증** (Access Token 15분, Refresh Token 7일)
- **자동 토큰 갱신** (만료 5분 전 자동 갱신)
- **비밀번호 해시화** (bcrypt, 12 rounds)
- **계정 잠금** (5회 로그인 실패 시 30분 잠금)
- **CORS 정책** 적용
- **보안 헤더** 설정 (XSS, CSRF 방지)
- **SQL 인젝션 방지** (파라미터화된 쿼리)

## 📊 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### refresh_tokens 테이블
```sql
CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

### 사용자 관리 API
- `GET /api/users/me` - 내 정보 조회
- `PUT /api/users/me` - 프로필 수정
- `PUT /api/users/me/password` - 비밀번호 변경
- `DELETE /api/users/me` - 계정 비활성화

### 해양 정보 API
- `GET /api/stations` - 해양 관측소 데이터
- `GET /api/surface-obs` - 지상 관측 데이터
- `GET /api/tourist-spots` - 관광지 정보
## 
✅ 연결 테스트

### 1. 서비스 상태 확인
- 백엔드: http://localhost:8000/health
- 프론트엔드: http://localhost:5173
- API 문서: http://localhost:8000/docs
- phpMyAdmin: http://localhost:8080

### 2. 기능 테스트
1. **회원가입**: 새 계정 생성 테스트
2. **로그인**: 생성한 계정으로 로그인
3. **지도 로드**: 카카오맵과 마커 표시 확인
4. **해양 정보**: 마커 클릭 시 정보 표시 확인
5. **마이페이지**: 프로필 수정 및 비밀번호 변경 테스트
6. **자동 로그아웃**: 토큰 만료 시 자동 로그아웃 확인

### 3. 데이터베이스 확인
```sql
-- 사용자 테이블 확인
SELECT * FROM users;

-- 토큰 테이블 확인  
SELECT * FROM refresh_tokens;
```

## 🚨 문제 해결

### Python 버전 호환성 문제
```bash
# Python 3.13에서 typing 오류 발생 시
# Python 3.9-3.12로 다운그레이드 권장

# Windows에서 Python 버전 확인
python --version

# 다른 Python 버전 사용 (예: Python 3.11)
py -3.11 -m venv .venv
```

### 백엔드 실행 오류

#### ModuleNotFoundError: No module named 'jwt' 오류
```bash
# JWT 관련 패키지 설치
pip install "python-jose[cryptography]"

# 또는 전체 의존성 재설치
pip install -r requirements.txt
```

#### ImportError: cannot import name 'str' from 'typing' 오류
```bash
# Python 3.13에서 발생하는 문제
# 해결방법 1: Python 3.9-3.12 사용 권장
py -3.12 -m venv .venv

# 해결방법 2: 코드 수정 (이미 수정됨)
# from typing import str → 제거
```

#### 의존성 설치 실패 시
```bash
# 가상환경 재생성
deactivate
rmdir /s .venv  # Windows
rm -rf .venv    # Linux/Mac

python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
pip install --upgrade pip
pip install -r requirements.txt
```

### 포트 충돌 문제
```bash
# MySQL 포트 변경 (docker-compose.yml)
ports:
  - "3307:3306"  # 3306 → 3307로 변경

# 백엔드 포트 변경
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 데이터베이스 초기화
```bash
# 컨테이너와 데이터 완전 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d

# 데이터베이스 연결 테스트
docker exec -it water-sports-mysql mysql -u water_sports_user -p water_sports_db
```

### JWT 토큰 문제
- JWT_SECRET_KEY가 설정되어 있는지 확인
- 토큰 만료 시간 설정 확인
- 브라우저 localStorage에서 토큰 확인
- 브라우저 개발자 도구 > Application > Local Storage 확인

## 📝 개발 가이드

### 새로운 API 엔드포인트 추가
1. `backend/app/routers/`에 라우터 파일 생성
2. `backend/app/schemas/`에 Pydantic 모델 정의
3. `backend/app/services/`에 비즈니스 로직 구현
4. `backend/app/main.py`에 라우터 등록

### 새로운 React 페이지 추가
1. `frontend/src/pages/`에 페이지 컴포넌트 생성
2. `frontend/src/App.jsx`에 라우트 추가
3. 필요시 `frontend/src/api/`에 API 함수 추가

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.