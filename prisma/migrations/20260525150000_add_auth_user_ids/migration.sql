ALTER TABLE "favorite_jobs" ADD COLUMN "user_id" TEXT;
ALTER TABLE "search_histories" ADD COLUMN "user_id" TEXT;
ALTER TABLE "application_records" ADD COLUMN "user_id" TEXT;

DROP INDEX IF EXISTS "application_records_job_id_key";

CREATE UNIQUE INDEX "favorite_jobs_user_id_job_id_key" ON "favorite_jobs"("user_id", "job_id");
CREATE UNIQUE INDEX "application_records_user_id_job_id_key" ON "application_records"("user_id", "job_id");

CREATE INDEX "favorite_jobs_user_id_idx" ON "favorite_jobs"("user_id");
CREATE INDEX "search_histories_user_id_idx" ON "search_histories"("user_id");
CREATE INDEX "application_records_job_id_idx" ON "application_records"("job_id");
CREATE INDEX "application_records_user_id_idx" ON "application_records"("user_id");
