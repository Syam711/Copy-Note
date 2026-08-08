import { supabase } from './client';

// URL-safe, unguessable token — this string IS the access control for
// the public share page (see the "public read by token" RLS policy).
function generateShareToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// Sharing requires an account (per the product decision), so `user`
// here is always a signed-in Supabase user, never a guest.
export async function createShare(note, user) {
  const share = {
    id: crypto.randomUUID(),
    share_token: generateShareToken(),
    note_id: note.id,
    shared_by: user.id,
    shared_by_name: user.user_metadata?.display_name || user.email.split('@')[0],
    title: note.title,
    description: note.description,
    shared_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('shares').insert(share);
  if (error) throw error;
  return share;
}

// Used by the standalone /share/:token page — runs while logged out,
// so it relies entirely on the `public read by token` RLS policy.
export async function fetchShareByToken(token) {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('share_token', token)
    .maybeSingle();
  if (error) throw error;
  return data; // null if the token doesn't exist (revoked or mistyped)
}

export async function revokeShare(shareId) {
  const { error } = await supabase.from('shares').delete().eq('id', shareId);
  if (error) throw error;
}

// Powers the Shared Notes page — every link this user has ever
// created, newest first. RLS's "select own shares" policy is what
// makes eq('shared_by', userId) safe to trust here.
export async function fetchSharesByUser(userId) {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('shared_by', userId)
    .order('shared_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Convenience so components don't need to also import noteHelpers
// just to build the clipboard string for a "copy share link" toast.
export function shareUrl(token) {
  return `${window.location.origin}/share/${token}`;
}
