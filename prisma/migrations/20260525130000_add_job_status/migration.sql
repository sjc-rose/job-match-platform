ALTER TABLE "jobs" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

CREATE INDEX "jobs_status_idx" ON "jobs"("status");
