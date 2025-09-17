# 데이터베이스 설정 가이드

## Docker MySQL 설정

### 1. Docker Compose 실행

```bash
# MySQL 컨테이너 시작
docker-compose up -d mysql

# 모든 서비스 시작 (MySQL + phpMyAdmin)
docker-compose up -d
```

### 2. 데이터베이스 연결 정보

- **호스트**: localhost
- **포트**: 3306
- **데이터베이스**: water_sports_db
- **사용자명**: water_sports_user
- **비밀번호**: water_sports_password
- **루트 비밀번호**: rootpassword

### 3. DBeaver 연결 설정

1. **DBeaver 실행** 후 새 연결 생성
2. **데이터베이스 타입**: MySQL 선택
3. **연결 정보 입력**:
   - Server Host: `localhost`
   - Port: `3306`
   - Database: `water_sports_db`
   - Username: `water_sports_user`
   - Password: `water_sports_password`

4. **연결 테스트** 클릭하여 연결 확인
5. **완료** 클릭하여 연결 저장

### 4. phpMyAdmin 접속 (선택사항)

웹 브라우저에서 `http://localhost:8080` 접속
- **사용자명**: water_sports_user
- **비밀번호**: water_sports_password

### 5. 데이터베이스 상태 확인

```bash
# MySQL 컨테이너 로그 확인
docker-compose logs mysql

# MySQL 컨테이너 접속
docker exec -it water-sports-mysql mysql -u water_sports_user -p water_sports_db

# 테이블 확인
SHOW TABLES;
DESCRIBE users;
DESCRIBE refresh_tokens;
```

### 6. 환경변수 설정

백엔드 `.env` 파일에 다음 설정 추가:

```env
# 데이터베이스 설정
DATABASE_URL=mysql://water_sports_user:water_sports_password@localhost:3306/water_sports_db
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=water_sports_db
MYSQL_USER=water_sports_user
MYSQL_PASSWORD=water_sports_password
```

## 문제 해결

### 포트 충돌 문제
만약 3306 포트가 이미 사용 중이라면:

```yaml
# docker-compose.yml에서 포트 변경
ports:
  - "3307:3306"  # 호스트 포트를 3307로 변경
```

### 권한 문제
MySQL 8.0에서 인증 플러그인 문제가 발생할 경우:

```sql
-- MySQL 컨테이너 내에서 실행
ALTER USER 'water_sports_user'@'%' IDENTIFIED WITH mysql_native_password BY 'water_sports_password';
FLUSH PRIVILEGES;
```

### 데이터 초기화
데이터베이스를 완전히 초기화하려면:

```bash
# 컨테이너와 볼륨 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d
```

## 보안 고려사항

### 프로덕션 환경에서는:
1. **강력한 비밀번호 사용**
2. **환경변수로 민감한 정보 관리**
3. **방화벽 설정으로 포트 접근 제한**
4. **SSL/TLS 연결 사용**
5. **정기적인 백업 수행**

### 개발 환경 전용 설정
현재 설정은 개발 환경용입니다. 프로덕션에서는 다음을 변경해야 합니다:
- 모든 비밀번호 변경
- 네트워크 보안 강화
- 백업 및 모니터링 설정