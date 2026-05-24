-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_job_id" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_text" TEXT,
    "education_requirement" TEXT NOT NULL,
    "experience_requirement" INTEGER,
    "description" TEXT NOT NULL,
    "apply_url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_jobs" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_histories" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT,
    "education_level" TEXT,
    "expected_salary_min" INTEGER,
    "expected_salary_max" INTEGER,
    "city" TEXT,
    "keywords" TEXT,
    "experience_years" INTEGER,
    "source" TEXT,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_source_idx" ON "jobs"("source");

-- CreateIndex
CREATE INDEX "jobs_province_city_idx" ON "jobs"("province", "city");

-- CreateIndex
CREATE INDEX "jobs_city_idx" ON "jobs"("city");

-- CreateIndex
CREATE INDEX "jobs_published_at_idx" ON "jobs"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_source_job_id_key" ON "jobs"("source", "source_job_id");

-- CreateIndex
CREATE INDEX "favorite_jobs_visitor_id_idx" ON "favorite_jobs"("visitor_id");

-- CreateIndex
CREATE INDEX "favorite_jobs_job_id_idx" ON "favorite_jobs"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_jobs_visitor_id_job_id_key" ON "favorite_jobs"("visitor_id", "job_id");

-- CreateIndex
CREATE INDEX "search_histories_visitor_id_idx" ON "search_histories"("visitor_id");

-- CreateIndex
CREATE INDEX "search_histories_city_idx" ON "search_histories"("city");

-- CreateIndex
CREATE INDEX "search_histories_created_at_idx" ON "search_histories"("created_at");

-- AddForeignKey
ALTER TABLE "favorite_jobs" ADD CONSTRAINT "favorite_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
