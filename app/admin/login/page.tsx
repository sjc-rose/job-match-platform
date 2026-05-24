import {
  DEFAULT_ADMIN_PASSWORD,
  isUsingDefaultAdminPassword,
} from "@/lib/adminAuth";
import { AdminLoginForm } from "./AdminLoginForm";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <AdminLoginForm
      defaultPassword={DEFAULT_ADMIN_PASSWORD}
      nextPath={params.next || "/admin"}
      showDefaultPassword={isUsingDefaultAdminPassword()}
    />
  );
}
