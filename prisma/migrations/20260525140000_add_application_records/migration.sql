CREATE TABLE "application_records" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_applied',
    "note" TEXT,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_records_job_id_key" ON "application_records"("job_id");
CREATE INDEX "application_records_status_idx" ON "application_records"("status");
CREATE INDEX "application_records_updated_at_idx" ON "application_records"("updated_at");

ALTER TABLE "application_records" ADD CONSTRAINT "application_records_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
