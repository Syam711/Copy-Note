const TRASH_RETENTION_DAYS = 30;

// The server (pg_cron, see supabase/schema.sql) is what actually
// deletes expired notes — this is only for showing the countdown in
// the UI ("2 days left" in the Trash view).
export function daysUntilPurge(deletedAt) {
  if (!deletedAt) return null;
  const deletedTime = new Date(deletedAt).getTime();
  const purgeTime = deletedTime + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = purgeTime - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}
