import { create } from 'zustand';
import * as authApi from '../api/auth.api';
import { getOrCreateGuestId, clearGuestId } from '../utils/localFlags';

export const useAuthStore = create((set, get) => ({
  user: null,
  guestId: null,
  status: 'loading', // 'loading' | 'guest' | 'authenticated'

  // Called once, at app startup (see App.jsx). Checks for an existing
  // Supabase session; falls back to guest mode if there isn't one.
  init: async () => {
    const session = await authApi.getSession();
    if (session) {
      set({ user: session.user, guestId: null, status: 'authenticated' });
    } else {
      set({ user: null, guestId: getOrCreateGuestId(), status: 'guest' });
    }
    authApi.onAuthStateChange((session) => {
      if (session) {
        set({ user: session.user, guestId: null, status: 'authenticated' });
      } else {
        set({ user: null, guestId: getOrCreateGuestId(), status: 'guest' });
      }
    });
  },

  signIn: async (email, password) => {
    await authApi.signIn(email, password);
    // onAuthStateChange (registered in init) picks up the resulting
    // session and updates state — nothing else to do here.
  },

  // Returns whether this was a fresh sign-up on top of an existing
  // guest session (so the caller knows whether to offer the "import
  // your local notes?" prompt), and whether Supabase handed back an
  // active session immediately — it only does that when "Confirm
  // email" is off for the project. When it's on, there's no session
  // yet and the caller should show a "check your email" notice instead.
  signUp: async (email, password) => {
    const hadGuestNotes = get().status === 'guest';
    const data = await authApi.signUp(email, password);
    return { hadGuestNotes, hasSession: !!data.session };
  },

  signOut: async () => {
    await authApi.signOut();
    clearGuestId();
  },
}));
