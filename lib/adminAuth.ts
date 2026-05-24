export const ADMIN_AUTH_COOKIE = "admin_auth";
export const ADMIN_AUTH_VALUE = "1";
export const DEFAULT_ADMIN_PASSWORD = "dev-admin-password";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function isUsingDefaultAdminPassword() {
  return !process.env.ADMIN_PASSWORD;
}
