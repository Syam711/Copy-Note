import { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import ToastStack from './components/shared/ToastStack';
import ImportGuestNotesPrompt from './components/shared/ImportGuestNotesPrompt';
import Home from './pages/Home';
import Archive from './pages/Archive';
import SharedNotes from './pages/SharedNotes';
import Trash from './pages/Trash';
import Login from './pages/Login';
import SharedNote from './pages/SharedNote';
import { useAuthStore } from './store/authStore';
import { useNotesStore } from './store/notesStore';

function AppLayout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Outlet />
      <ImportGuestNotesPrompt />
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const guestId = useAuthStore((s) => s.guestId);
  const initNotes = useNotesStore((s) => s.init);

  // Runs once — checks for an existing Supabase session and falls
  // back to guest mode. See store/authStore.js.
  useEffect(() => {
    init();
  }, [init]);

  // Whenever the "owner" of the notes changes (guest -> signed in,
  // signed in -> signed out, or first load), point the notes store at
  // the right local cache. See store/notesStore.js.
  useEffect(() => {
    if (status === 'authenticated' && user) initNotes(user.id, false);
    else if (status === 'guest' && guestId) initNotes(guestId, true);
  }, [status, user, guestId, initNotes]);

  return (
    <>
      <Routes>
        {/* No Navbar on these two — a login form and a public,
            logged-out-visitor page shouldn't show app navigation. */}
        <Route path="/login" element={<Login />} />
        <Route path="/share/:token" element={<SharedNote />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/shared" element={<SharedNotes />} />
          <Route path="/trash" element={<Trash />} />
        </Route>
      </Routes>
      <ToastStack />
    </>
  );
}
