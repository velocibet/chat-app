--- BEGIN ALTER TABLE "public"."users" ---

ALTER TABLE "public"."users" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."users" ALTER COLUMN username SET NOT NULL;
ALTER TABLE "public"."users" ALTER COLUMN password SET NOT NULL;
ALTER TABLE "public"."users" ALTER COLUMN email SET NOT NULL;

--- END ALTER TABLE "public"."users" ---


--- BEGIN ALTER TABLE "public"."room" ---

ALTER TABLE "public"."room" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."room" ALTER COLUMN type SET NOT NULL;
ALTER TABLE "public"."room" ALTER COLUMN created_at SET NOT NULL;

--- END ALTER TABLE "public"."room" ---


--- BEGIN ALTER TABLE "public"."friend_requests" ---

ALTER TABLE "public"."friend_requests" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."friend_requests" ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE "public"."friend_requests" ALTER COLUMN receiver_id SET NOT NULL;
ALTER TABLE "public"."friend_requests" ALTER COLUMN status SET NOT NULL;
ALTER TABLE "public"."friend_requests" ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE "public"."friend_requests" ALTER COLUMN updated_at SET NOT NULL;

--- END ALTER TABLE "public"."friend_requests" ---


--- BEGIN ALTER TABLE "public"."login_logs" ---

ALTER TABLE "public"."login_logs" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."login_logs" ALTER COLUMN username SET NOT NULL;
ALTER TABLE "public"."login_logs" ALTER COLUMN ip SET NOT NULL;
ALTER TABLE "public"."login_logs" ALTER COLUMN agent SET NOT NULL;
ALTER TABLE "public"."login_logs" ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE "public"."login_logs" ALTER COLUMN success SET NOT NULL;

--- END ALTER TABLE "public"."login_logs" ---


--- BEGIN ALTER TABLE "public"."messages" ---

ALTER TABLE "public"."messages" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN content SET NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN isfile SET NOT NULL;
ALTER TABLE "public"."messages" ALTER COLUMN room_id SET NOT NULL;

--- END ALTER TABLE "public"."messages" ---


--- BEGIN ALTER TABLE "public"."room_user" ---

ALTER TABLE "public"."room_user"
ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false;

ALTER TABLE "public"."room_user" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."room_user" ALTER COLUMN room_id SET NOT NULL;
ALTER TABLE "public"."room_user" ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE "public"."room_user" ALTER COLUMN role SET NOT NULL;
ALTER TABLE "public"."room_user" ALTER COLUMN joined_at SET NOT NULL;

ALTER TABLE "public"."room_user"
ADD CONSTRAINT IF NOT EXISTS "unique_room_user" UNIQUE (room_id, user_id);

--- END ALTER TABLE "public"."room_user" ---


--- BEGIN ALTER TABLE "public"."blocks" ---

ALTER TABLE "public"."blocks" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."blocks" ALTER COLUMN blocker_id SET NOT NULL;
ALTER TABLE "public"."blocks" ALTER COLUMN blocked_id SET NOT NULL;

--- END ALTER TABLE "public"."blocks" ---


--- BEGIN ALTER TABLE "public"."email_verifications" ---

ALTER TABLE "public"."email_verifications" ALTER COLUMN id SET NOT NULL;
ALTER TABLE "public"."email_verifications" ALTER COLUMN email SET NOT NULL;
ALTER TABLE "public"."email_verifications" ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE "public"."email_verifications" ALTER COLUMN expires_at SET NOT NULL;
ALTER TABLE "public"."email_verifications" ALTER COLUMN created_at SET NOT NULL;

--- END ALTER TABLE "public"."email_verifications" ---
