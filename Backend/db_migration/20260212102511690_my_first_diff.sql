/***********************************************/
/*** SCRIPT AUTHOR:                          ***/
/*** CREATED ON: 2026-02-12T10:25:11.690Z ***/
/***********************************************/

--- BEGIN ALTER SEQUENCE "public"."users_id_seq" ---
--- END ALTER SEQUENCE "public"."users_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."friend_requests_id_seq" ---
--- END ALTER SEQUENCE "public"."friend_requests_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."login_logs_id_seq" ---
--- END ALTER SEQUENCE "public"."login_logs_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."messages_id_seq" ---
--- END ALTER SEQUENCE "public"."messages_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."room_id_seq" ---
--- END ALTER SEQUENCE "public"."room_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."room_user_id_seq" ---
--- END ALTER SEQUENCE "public"."room_user_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."blocks_id_seq" ---
--- END ALTER SEQUENCE "public"."blocks_id_seq" ---
--- BEGIN ALTER SEQUENCE "public"."email_verifications_id_seq" ---
--- END ALTER SEQUENCE "public"."email_verifications_id_seq" ---

--- BEGIN ALTER TABLE "public"."users" ---
ALTER TABLE IF EXISTS "public"."users" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."users" ALTER COLUMN "password" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."users" ALTER COLUMN "email" SET NOT NULL;
--- END ALTER TABLE "public"."users" ---

--- BEGIN ALTER TABLE "public"."room" ---
ALTER TABLE IF EXISTS "public"."room" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL;
ALTER TABLE IF EXISTS "public"."room" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room" ALTER COLUMN "created_at" SET NOT NULL;
--- END ALTER TABLE "public"."room" ---

--- BEGIN ALTER TABLE "public"."friend_requests" ---
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "sender_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "receiver_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."friend_requests" ALTER COLUMN "updated_at" SET NOT NULL;
--- END ALTER TABLE "public"."friend_requests" ---

--- BEGIN ALTER TABLE "public"."login_logs" ---
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "ip" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "agent" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."login_logs" ALTER COLUMN "success" SET NOT NULL;
--- END ALTER TABLE "public"."login_logs" ---

--- BEGIN ALTER TABLE "public"."messages" ---
ALTER TABLE IF EXISTS "public"."messages" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL;
ALTER TABLE IF EXISTS "public"."messages" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."messages" ALTER COLUMN "sender_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."messages" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."messages" ALTER COLUMN "isfile" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."messages" ALTER COLUMN "room_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "fk_messages_room" FOREIGN KEY (room_id) REFERENCES "public"."room"(id) ON DELETE CASCADE ON UPDATE NO ACTION;
--- END ALTER TABLE "public"."messages" ---

--- BEGIN ALTER TABLE "public"."room_user" ---
ALTER TABLE IF EXISTS "public"."room_user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL;
ALTER TABLE IF EXISTS "public"."room_user" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room_user" ALTER COLUMN "room_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room_user" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room_user" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."room_user" ALTER COLUMN "joined_at" SET NOT NULL;
--- END ALTER TABLE "public"."room_user" ---

--- BEGIN ALTER TABLE "public"."blocks" ---
ALTER TABLE IF EXISTS "public"."blocks" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."blocks" ALTER COLUMN "blocker_id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."blocks" ALTER COLUMN "blocked_id" SET NOT NULL;
--- END ALTER TABLE "public"."blocks" ---

--- BEGIN ALTER TABLE "public"."email_verifications" ---
ALTER TABLE IF EXISTS "public"."email_verifications" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."email_verifications" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."email_verifications" ALTER COLUMN "token_hash" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."email_verifications" ALTER COLUMN "expires_at" SET NOT NULL;
ALTER TABLE IF EXISTS "public"."email_verifications" ALTER COLUMN "created_at" SET NOT NULL;
--- END ALTER TABLE "public"."email_verifications" ---


