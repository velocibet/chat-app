--- BEGIN ALTER TABLE "public"."users" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."users" ---


--- BEGIN ALTER TABLE "public"."room" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."room" ---


--- BEGIN ALTER TABLE "public"."friend_requests" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."friend_requests" ---


--- BEGIN ALTER TABLE "public"."login_logs" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."login_logs" ---


--- BEGIN ALTER TABLE "public"."messages" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."messages" ---


--- BEGIN ALTER TABLE "public"."room_user" ---

ALTER TABLE "public"."room_user"
ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false;

ALTER TABLE "public"."room_user"
ADD CONSTRAINT IF NOT EXISTS "unique_room_user" UNIQUE (room_id, user_id);

--- END ALTER TABLE "public"."room_user" ---


--- BEGIN ALTER TABLE "public"."blocks" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."blocks" ---


--- BEGIN ALTER TABLE "public"."email_verifications" ---
-- 변경 없음 (NOT NULL 강제 제거)
--- END ALTER TABLE "public"."email_verifications" ---
