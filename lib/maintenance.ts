import { prisma } from "@/lib/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type MaintenanceResult = {
  authEnv: "error" | "ok";
  checks: {
    abnormalJobs: number;
    cityEmpty: number;
    sourceEmpty: number;
  };
  database: "ok";
  expiresAtMaintenance: "skipped";
  message: string;
  ok: true;
  timestamp: string;
  counts: {
    activeJobs: number;
    applications: number;
    expiredJobs: number;
    favorites: number;
    inactiveJobs: number;
    jobs: number;
    userProfiles: number;
  };
};

export type HealthResult =
  | {
      authEnv: "error" | "ok";
      database: "ok";
      ok: true;
      timestamp: string;
      counts: {
        activeJobs: number;
        applications: number;
        favorites: number;
        jobs: number;
        userProfiles: number;
      };
    }
  | {
      authEnv: "error" | "ok";
      database: "error";
      message: "Database unavailable";
      ok: false;
      timestamp: string;
    };

export function getAuthEnvStatus() {
  return isSupabaseConfigured() ? "ok" : "error";
}

export async function getHealthStatus(): Promise<HealthResult> {
  const timestamp = new Date().toISOString();
  const authEnv = getAuthEnvStatus();

  try {
    const [jobs, activeJobs, userProfiles, applications, favorites] =
      await Promise.all([
        prisma.job.count(),
        prisma.job.count({
          where: {
            status: "active",
          },
        }),
        prisma.userProfile.count(),
        prisma.applicationRecord.count(),
        prisma.favoriteJob.count(),
      ]);

    return {
      authEnv,
      database: "ok",
      ok: true,
      timestamp,
      counts: {
        activeJobs,
        applications,
        favorites,
        jobs,
        userProfiles,
      },
    };
  } catch (error) {
    console.error("Health check database error", error);

    return {
      authEnv,
      database: "error",
      message: "Database unavailable",
      ok: false,
      timestamp,
    };
  }
}

export async function runMaintenanceCheck(): Promise<MaintenanceResult> {
  const timestamp = new Date().toISOString();
  const authEnv = getAuthEnvStatus();
  const [
    jobs,
    activeJobs,
    inactiveJobs,
    expiredJobs,
    userProfiles,
    applications,
    favorites,
    sourceEmpty,
    cityEmpty,
    abnormalJobs,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({
      where: {
        status: "active",
      },
    }),
    prisma.job.count({
      where: {
        status: "inactive",
      },
    }),
    prisma.job.count({
      where: {
        status: "expired",
      },
    }),
    prisma.userProfile.count(),
    prisma.applicationRecord.count(),
    prisma.favoriteJob.count(),
    prisma.job.count({
      where: {
        source: "",
      },
    }),
    prisma.job.count({
      where: {
        city: "",
      },
    }),
    prisma.job.count({
      where: {
        OR: [
          {
            title: "",
          },
          {
            company: "",
          },
        ],
      },
    }),
  ]);

  return {
    authEnv,
    checks: {
      abnormalJobs,
      cityEmpty,
      sourceEmpty,
    },
    counts: {
      activeJobs,
      applications,
      expiredJobs,
      favorites,
      inactiveJobs,
      jobs,
      userProfiles,
    },
    database: "ok",
    expiresAtMaintenance: "skipped",
    message: "Maintenance check completed",
    ok: true,
    timestamp,
  };
}
