import { supabase } from './client';

function generateShareToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// One share can now cover 1-to-many notes — a single note, several
// individually-selected notes, or every note in a group (groupTitle
// set in that case, null otherwise). This is two inserts rather than
// one atomic transaction: if the second insert fails, you'd get a
// share row with zero notes, which just renders as an empty page
// rather than corrupting anything. Acceptable trade-off for staying
// on plain client-side calls instead of a Postgres function.
export async function createShare(notes, user, groupTitle = null) {
  const share = {
    id: crypto.randomUUID(),
    share_token: generateShareToken(),
    shared_by: user.id,
    shared_by_name: user.user_metadata?.display_name || user.email.split('@')[0],
    group_title: groupTitle,
    shared_at: new Date().toISOString(),
  };
  const { error: shareError } = await supabase.from('shares').insert(share);
  if (shareError) throw shareError;

  const shareNotes = notes.map((note, index) => ({
    id: crypto.randomUUID(),
    share_id: share.id,
    title: note.title || '',
    description: note.description || '',
    position: index,
  }));
  const { error: notesError } = await supabase.from('share_notes').insert(shareNotes);
  if (notesError) throw notesError;

  return share;
}

// Powers the standalone /share/:token page — runs while logged out.
// Two queries rather than a join because the anon RLS policies are
// separately scoped per table (see the migration).
export async function fetchShareByToken(token) {
  const { data: share, error: shareError } = await supabase
    .from('shares')
    .select('*')
    .eq('share_token', token)
    .maybeSingle();
  if (shareError) throw shareError;
  if (!share) return null;

  const { data: notes, error: notesError } = await supabase
    .from('share_notes')
    .select('*')
    .eq('share_id', share.id)
    .order('position', { ascending: true });
  if (notesError) throw notesError;

  return { ...share, notes };
}

export async function revokeShare(shareId) {
  const { error } = await supabase.from('shares').delete().eq('id', shareId);
  if (error) throw error;
}

// Powers the Shared Notes page — every bundle this user has created,
// each with its notes attached.
export async function fetchSharesByUser(userId) {
  const { data: shares, error: sharesError } = await supabase
    .from('shares')
    .select('*')
    .eq('shared_by', userId)
    .order('shared_at', { ascending: false });
  if (sharesError) throw sharesError;
  if (shares.length === 0) return [];

  const { data: notes, error: notesError } = await supabase
    .from('share_notes')
    .select('*')
    .in('share_id', shares.map((s) => s.id))
    .order('position', { ascending: true });
  if (notesError) throw notesError;

  return shares.map((share) => ({
    ...share,
    notes: notes.filter((n) => n.share_id === share.id),
  }));
}

export function shareUrl(token) {
  return `${window.location.origin}/share/${token}`;
}
