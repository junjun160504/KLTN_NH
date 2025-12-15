-- ============================================
-- Migration: Chatbot V2 - OpenAI Assistants API
-- Version: 2.0
-- Date: 2025-11-29
-- Description: Tạo tables cho hệ thống chatbot mới
-- ============================================

-- Bảng chat_threads: Lưu mapping giữa QR session và OpenAI thread
CREATE TABLE IF NOT EXISTS chat_threads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id BIGINT NOT NULL,
    openai_thread_id VARCHAR(100) NOT NULL,
    assistant_id VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    message_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to qr_sessions (optional - có thể bỏ nếu không cần strict reference)
    -- FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    
    -- Indexes
    UNIQUE KEY idx_thread_id (openai_thread_id),
    INDEX idx_qr_session (qr_session_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng chat_messages: Lưu lịch sử messages (optional - để analytics)
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    thread_id BIGINT NULL,
    qr_session_id BIGINT NOT NULL,
    role ENUM('USER', 'ASSISTANT') NOT NULL,
    content TEXT NOT NULL,
    
    -- Analytics fields
    intent VARCHAR(100) NULL,
    sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') NULL,
    
    -- Metadata
    tokens_used INT DEFAULT 0,
    response_time_ms INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_thread (thread_id),
    INDEX idx_session (qr_session_id),
    INDEX idx_role (role),
    INDEX idx_intent (intent),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng chat_analytics: Thống kê tổng hợp theo ngày
CREATE TABLE IF NOT EXISTS chat_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Time dimension
    date DATE NOT NULL,
    
    -- Metrics
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    
    -- Intent breakdown (JSON)
    intent_counts JSON NULL,
    
    -- Sentiment breakdown
    positive_count INT DEFAULT 0,
    neutral_count INT DEFAULT 0,
    negative_count INT DEFAULT 0,
    
    -- Performance
    avg_response_time_ms INT DEFAULT 0,
    total_tokens_used INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique date
    UNIQUE KEY unique_date (date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample data for testing (optional)
-- ============================================

-- Bạn có thể uncomment để test

-- INSERT INTO chat_threads (qr_session_id, openai_thread_id, assistant_id, status)
-- VALUES (1, 'thread_test_123', 'asst_test_456', 'ACTIVE');

-- ============================================
-- Notes
-- ============================================

-- 1. Bảng chats cũ vẫn được giữ nguyên, không xóa
-- 2. Hệ thống chatbot cũ (chatbot.service.js) vẫn hoạt động
-- 3. Chatbot V2 (services/chatbotV2/) sử dụng các bảng mới này
-- 4. Có thể chạy song song cả 2 hệ thống
