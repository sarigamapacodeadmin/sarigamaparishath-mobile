// Copied from the web app (sarigamaparishath/lib/members/default-login.ts). Keep the two in sync.

// Members start with (or are reset to) this password and must set their own
// email and password on their next login.
export const DEFAULT_MEMBER_PASSWORD = '123456';
export const MUST_CHANGE_FLAG = 'must_change_password';

export function mustChangePassword(user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return Boolean(user?.user_metadata?.[MUST_CHANGE_FLAG]);
}
