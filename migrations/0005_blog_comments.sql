CREATE TABLE IF NOT EXISTS "blog_comments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "blog_post_id" varchar NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_blog_comments_post_id" ON "blog_comments"("blog_post_id");
CREATE INDEX IF NOT EXISTS "idx_blog_comments_user_id" ON "blog_comments"("user_id");
