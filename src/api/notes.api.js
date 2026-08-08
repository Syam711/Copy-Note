import { supabase } from './client';

// Every function here assumes RLS is doing the security check (see
// supabase/schema.sql) — none of these filter by user_id themselves,
// because the database refuses to return or accept rows that aren't
// the caller's regardless of what we ask for. That's the point of
// calling Supabase directly instead of through a custom API server.

export async function fetchAllNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function insertNote(note) {
  const { error } = await supabase.from('notes').insert(note);
  if (error) throw error;
}

export async function updateNote(id, changes) {
  const { error } = await supabase.from('notes').update(changes).eq('id', id);
  if (error) throw error;
}

// Real, permanent delete — used only when a note has been edited down
// to empty and should vanish entirely (see useNotes). This is NOT
// what the trash/recently-deleted feature uses; that's a soft delete
// via updateNote(id, { deleted_at: ... }) instead.
export async function hardDeleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}
