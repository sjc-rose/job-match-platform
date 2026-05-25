CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_title" TEXT,
    "target_city" TEXT,
    "expected_salary_min" INTEGER,
    "expected_salary_max" INTEGER,
    "education" TEXT,
    "experience_years" INTEGER,
    "skills" TEXT,
    "self_introduction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles"("user_id");
