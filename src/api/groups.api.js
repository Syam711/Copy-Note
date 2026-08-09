import { supabase } from './client';

export async function fetchAllGroups(userId) {
  const { data, error } = await supabase.from('groups').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function insertGroup(group) {
  const { error } = await supabase.from('groups').insert(group);
  if (error) throw error;
}

export async function updateGroup(id, changes) {
  const { error } = await supabase.from('groups').update(changes).eq('id', id);
  if (error) throw error;
}

// Deleting a group IS "ungroup" — there is no cascading-delete-the-
// notes variant. RLS + the FK's `on delete set null` (see the
// migration) take care of clearing group_id on every note that
// referenced it; this function doesn't need to touch notes at all
// server-side. The caller (groupsStore) still updates the LOCAL
// Dexie cache explicitly, since the client has no way to observe a
// server-side cascade happening.
export async function deleteGroup(id) {
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) throw error;
}
