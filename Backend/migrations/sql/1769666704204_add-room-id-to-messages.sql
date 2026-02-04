-- 1. 타입 생성
CREATE TYPE room_type AS ENUM ('dm', 'group');
CREATE TYPE room_user_role AS ENUM ('owner', 'member');

-- 2. room 테이블 (제약 조건 정리)
CREATE TABLE public.room (
    id bigserial PRIMARY KEY,
    type room_type NOT NULL,
    title text,
    owner_user_id bigint,
    dm_hash text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
    -- 여기서 전체 UNIQUE를 걸지 않고 아래에서 Partial Index로 처리하는 것이 좋습니다.
);

-- DM일 때만 dm_hash 중복 방지 (가장 깔끔한 방법)
CREATE UNIQUE INDEX uniq_room_dm_hash ON public.room (dm_hash) 
WHERE type = 'dm';

-- 3. room_user 테이블
CREATE TABLE public.room_user (
    id bigserial PRIMARY KEY,
    room_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role room_user_role NOT NULL DEFAULT 'member',
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    left_at timestamp with time zone,
    CONSTRAINT fk_room_user_room FOREIGN KEY (room_id) 
        REFERENCES public.room(id) ON DELETE CASCADE
);

CREATE INDEX idx_room_user_room_id ON public.room_user (room_id);
CREATE INDEX idx_room_user_user_id ON public.room_user (user_id);
CREATE UNIQUE INDEX uniq_room_user_active ON public.room_user (room_id, user_id) 
WHERE left_at IS NULL;

-- 4. 기존 데이터 마이그레이션 (messages 테이블)
ALTER TABLE messages ADD COLUMN room_id bigint;
-- (주의) room 테이블에 데이터가 먼저 들어있어야 UPDATE가 작동합니다.
UPDATE messages m SET room_id = r.id FROM room r WHERE m.room_name = r.dm_hash;
ALTER TABLE messages ALTER COLUMN room_id SET NOT NULL;

-- 5. 부가 기능 (차단 및 유저 bio)
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE users ADD COLUMN bio VARCHAR(255);
ALTER TABLE users ADD COLUMN profile_url_name character varying(255);

CREATE UNIQUE INDEX friend_requests_unique_pair
ON friend_requests (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id)
);

CREATE TABLE email_verifications (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_email_verifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
