// Copied from the web app (sarigamaparishath/lib/members/default-login.ts). Keep the two in sync.

// An admin reset gives a member a one-time code as their password. It works for
// TEMP_PASSWORD_HOURS, and at their next login they must set their own email
// and password.

// The old shared reset password: never accepted as a member's own password
export const DEFAULT_MEMBER_PASSWORD = '123456';
export const MUST_CHANGE_FLAG = 'must_change_password';
export const TEMP_EXPIRES_KEY = 'temp_password_expires_at';
export const TEMP_PASSWORD_HOURS = 24;

// Letters and digits that can't be mistaken for each other when read out
// (no 0/O or 1/I). 32 symbols, so byte % 32 is unbiased.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function makeTempPassword(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function tempPasswordExpiry(from = Date.now()): string {
  return new Date(from + TEMP_PASSWORD_HOURS * 3600_000).toISOString();
}

type MaybeUser = { user_metadata?: Record<string, unknown> } | null | undefined;

export function mustChangePassword(user: MaybeUser): boolean {
  return Boolean(user?.user_metadata?.[MUST_CHANGE_FLAG]);
}

// A login still on its reset code after the code's 24 hours are up
export function tempPasswordExpired(user: MaybeUser, now = Date.now()): boolean {
  if (!mustChangePassword(user)) return false;
  const expires = Date.parse(String(user?.user_metadata?.[TEMP_EXPIRES_KEY] ?? ''));
  return Number.isFinite(expires) && expires < now;
}
