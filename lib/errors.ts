export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const fail = (error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> => ({ ok: false, error, fieldErrors });
export const success = <T = undefined>(data?: T, message?: string): ActionResult<T> => ({ ok: true, data, message });

/** Map database errors to safe, user-facing messages (never leak internals). */
export function safeDbError(err: { code?: string; message?: string } | null | undefined): string {
  if (!err) return 'Something went wrong. Please try again.';
  switch (err.code) {
    case '23505': return 'That already exists.';
    case '23503': return 'That item is still in use or no longer exists.';
    case '23514': return 'One of the values is not allowed.';
    case '42501': return 'You do not have permission to do that.';
    case 'P0001': return err.message?.startsWith('Category') ? err.message : 'Invalid category for this entry.';
    default: return 'Something went wrong. Please try again.';
  }
}
