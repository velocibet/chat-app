/***********************************************/
/*** SCRIPT AUTHOR:                          ***/
/***    CREATED ON: 2026-02-12T10:25:11.690Z ***/
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

ALTER TABLE IF EXISTS "public"."users" ADD CONSTRAINT "users_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "users_id_not_null" ON "public"."users" IS NULL;

ALTER TABLE IF EXISTS "public"."users" ADD CONSTRAINT "users_username_not_null" NOT NULL username;

COMMENT ON CONSTRAINT "users_username_not_null" ON "public"."users" IS NULL;

ALTER TABLE IF EXISTS "public"."users" ADD CONSTRAINT "users_password_not_null" NOT NULL password;

COMMENT ON CONSTRAINT "users_password_not_null" ON "public"."users" IS NULL;

ALTER TABLE IF EXISTS "public"."users" ADD CONSTRAINT "users_email_not_null" NOT NULL email;

COMMENT ON CONSTRAINT "users_email_not_null" ON "public"."users" IS NULL;











--- END ALTER TABLE "public"."users" ---

--- BEGIN ALTER TABLE "public"."room" ---

ALTER TABLE IF EXISTS "public"."room" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL  ;

COMMENT ON COLUMN "public"."room"."deleted_at"  IS NULL;

ALTER TABLE IF EXISTS "public"."room" ADD CONSTRAINT "room_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "room_id_not_null" ON "public"."room" IS NULL;

ALTER TABLE IF EXISTS "public"."room" ADD CONSTRAINT "room_type_not_null" NOT NULL type;

COMMENT ON CONSTRAINT "room_type_not_null" ON "public"."room" IS NULL;

ALTER TABLE IF EXISTS "public"."room" ADD CONSTRAINT "room_created_at_not_null" NOT NULL created_at;

COMMENT ON CONSTRAINT "room_created_at_not_null" ON "public"."room" IS NULL;











--- END ALTER TABLE "public"."room" ---

--- BEGIN ALTER TABLE "public"."friend_requests" ---

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "friend_requests_id_not_null" ON "public"."friend_requests" IS NULL;

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_sender_id_not_null" NOT NULL sender_id;

COMMENT ON CONSTRAINT "friend_requests_sender_id_not_null" ON "public"."friend_requests" IS NULL;

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_not_null" NOT NULL receiver_id;

COMMENT ON CONSTRAINT "friend_requests_receiver_id_not_null" ON "public"."friend_requests" IS NULL;

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_status_not_null" NOT NULL status;

COMMENT ON CONSTRAINT "friend_requests_status_not_null" ON "public"."friend_requests" IS NULL;

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_created_at_not_null" NOT NULL created_at;

COMMENT ON CONSTRAINT "friend_requests_created_at_not_null" ON "public"."friend_requests" IS NULL;

ALTER TABLE IF EXISTS "public"."friend_requests" ADD CONSTRAINT "friend_requests_updated_at_not_null" NOT NULL updated_at;

COMMENT ON CONSTRAINT "friend_requests_updated_at_not_null" ON "public"."friend_requests" IS NULL;











--- END ALTER TABLE "public"."friend_requests" ---

--- BEGIN ALTER TABLE "public"."login_logs" ---

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "login_logs_id_not_null" ON "public"."login_logs" IS NULL;

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_username_not_null" NOT NULL username;

COMMENT ON CONSTRAINT "login_logs_username_not_null" ON "public"."login_logs" IS NULL;

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_ip_not_null" NOT NULL ip;

COMMENT ON CONSTRAINT "login_logs_ip_not_null" ON "public"."login_logs" IS NULL;

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_agent_not_null" NOT NULL agent;

COMMENT ON CONSTRAINT "login_logs_agent_not_null" ON "public"."login_logs" IS NULL;

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_created_at_not_null" NOT NULL created_at;

COMMENT ON CONSTRAINT "login_logs_created_at_not_null" ON "public"."login_logs" IS NULL;

ALTER TABLE IF EXISTS "public"."login_logs" ADD CONSTRAINT "login_logs_success_not_null" NOT NULL success;

COMMENT ON CONSTRAINT "login_logs_success_not_null" ON "public"."login_logs" IS NULL;











--- END ALTER TABLE "public"."login_logs" ---

--- BEGIN ALTER TABLE "public"."messages" ---

ALTER TABLE IF EXISTS "public"."messages" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL  ;

COMMENT ON COLUMN "public"."messages"."deleted_at"  IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "messages_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "messages_id_not_null" ON "public"."messages" IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "messages_sender_id_not_null" NOT NULL sender_id;

COMMENT ON CONSTRAINT "messages_sender_id_not_null" ON "public"."messages" IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "messages_content_not_null" NOT NULL content;

COMMENT ON CONSTRAINT "messages_content_not_null" ON "public"."messages" IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "messages_isfile_not_null" NOT NULL isfile;

COMMENT ON CONSTRAINT "messages_isfile_not_null" ON "public"."messages" IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "messages_room_id_not_null" NOT NULL room_id;

COMMENT ON CONSTRAINT "messages_room_id_not_null" ON "public"."messages" IS NULL;

ALTER TABLE IF EXISTS "public"."messages" ADD CONSTRAINT "fk_messages_room" FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT "fk_messages_room" ON "public"."messages" IS NULL;











--- END ALTER TABLE "public"."messages" ---

--- BEGIN ALTER TABLE "public"."room_user" ---

ALTER TABLE IF EXISTS "public"."room_user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp NULL  ;

COMMENT ON COLUMN "public"."room_user"."deleted_at"  IS NULL;

ALTER TABLE IF EXISTS "public"."room_user" ADD CONSTRAINT "room_user_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "room_user_id_not_null" ON "public"."room_user" IS NULL;

ALTER TABLE IF EXISTS "public"."room_user" ADD CONSTRAINT "room_user_room_id_not_null" NOT NULL room_id;

COMMENT ON CONSTRAINT "room_user_room_id_not_null" ON "public"."room_user" IS NULL;

ALTER TABLE IF EXISTS "public"."room_user" ADD CONSTRAINT "room_user_user_id_not_null" NOT NULL user_id;

COMMENT ON CONSTRAINT "room_user_user_id_not_null" ON "public"."room_user" IS NULL;

ALTER TABLE IF EXISTS "public"."room_user" ADD CONSTRAINT "room_user_role_not_null" NOT NULL role;

COMMENT ON CONSTRAINT "room_user_role_not_null" ON "public"."room_user" IS NULL;

ALTER TABLE IF EXISTS "public"."room_user" ADD CONSTRAINT "room_user_joined_at_not_null" NOT NULL joined_at;

COMMENT ON CONSTRAINT "room_user_joined_at_not_null" ON "public"."room_user" IS NULL;











--- END ALTER TABLE "public"."room_user" ---

--- BEGIN ALTER TABLE "public"."blocks" ---

ALTER TABLE IF EXISTS "public"."blocks" ADD CONSTRAINT "blocks_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "blocks_id_not_null" ON "public"."blocks" IS NULL;

ALTER TABLE IF EXISTS "public"."blocks" ADD CONSTRAINT "blocks_blocker_id_not_null" NOT NULL blocker_id;

COMMENT ON CONSTRAINT "blocks_blocker_id_not_null" ON "public"."blocks" IS NULL;

ALTER TABLE IF EXISTS "public"."blocks" ADD CONSTRAINT "blocks_blocked_id_not_null" NOT NULL blocked_id;

COMMENT ON CONSTRAINT "blocks_blocked_id_not_null" ON "public"."blocks" IS NULL;











--- END ALTER TABLE "public"."blocks" ---

--- BEGIN ALTER TABLE "public"."email_verifications" ---

ALTER TABLE IF EXISTS "public"."email_verifications" ADD CONSTRAINT "email_verifications_id_not_null" NOT NULL id;

COMMENT ON CONSTRAINT "email_verifications_id_not_null" ON "public"."email_verifications" IS NULL;

ALTER TABLE IF EXISTS "public"."email_verifications" ADD CONSTRAINT "email_verifications_email_not_null" NOT NULL email;

COMMENT ON CONSTRAINT "email_verifications_email_not_null" ON "public"."email_verifications" IS NULL;

ALTER TABLE IF EXISTS "public"."email_verifications" ADD CONSTRAINT "email_verifications_token_hash_not_null" NOT NULL token_hash;

COMMENT ON CONSTRAINT "email_verifications_token_hash_not_null" ON "public"."email_verifications" IS NULL;

ALTER TABLE IF EXISTS "public"."email_verifications" ADD CONSTRAINT "email_verifications_expires_at_not_null" NOT NULL expires_at;

COMMENT ON CONSTRAINT "email_verifications_expires_at_not_null" ON "public"."email_verifications" IS NULL;

ALTER TABLE IF EXISTS "public"."email_verifications" ADD CONSTRAINT "email_verifications_created_at_not_null" NOT NULL created_at;

COMMENT ON CONSTRAINT "email_verifications_created_at_not_null" ON "public"."email_verifications" IS NULL;











--- END ALTER TABLE "public"."email_verifications" ---

--- BEGIN SYNCHRONIZE TABLE "public"."my_table_example" RECORDS ---

--ERROR: Table "public"."my_table_example" not found on SOURCE database for comparison!

--- END SYNCHRONIZE TABLE "public"."my_table_example" RECORDS ---
