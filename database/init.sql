-- 사용자 인증 시스템 데이터베이스 초기화 스크립트
-- 이 스크립트는 Docker 컨테이너 시작 시 자동으로 실행됩니다

USE water_sports_db;

-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스 추가
    INDEX idx_email (email),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Refresh Tokens 테이블 생성
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키 제약조건
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 인덱스 추가
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_token_hash (token_hash)
);

-- 만료된 토큰 정리를 위한 이벤트 스케줄러 (선택사항)
-- MySQL 8.0에서 지원
SET GLOBAL event_scheduler = ON;

DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_expired_tokens
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
END$$
DELIMITER ;

-- 테스트용 초기 데이터 (개발 환경에서만 사용)
-- 비밀번호: "testpassword123" (bcrypt 해시)
INSERT IGNORE INTO users (email, name, password_hash) VALUES 
('test@example.com', 'Test User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZrxnlO');

-- 데이터베이스 설정 확인
SELECT 'Database initialization completed successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as token_count FROM refresh_tokens;