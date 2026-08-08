import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../icons/Icon';
import { useAuthStore } from '../../store/authStore';

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-full text-sm transition-colors ${
    isActive ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-200'
  }`;

export default function Navbar() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="font-serif text-lg text-stone-800 shrink-0">Notes</h1>

        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink to="/" end className={linkClass}>Notes</NavLink>
          <NavLink to="/archive" className={linkClass}>Archive</NavLink>
          <NavLink to="/shared" className={linkClass}>Shared</NavLink>
          <NavLink to="/trash" className={linkClass}>Trash</NavLink>
        </nav>

        <div className="shrink-0">
          {status === 'loading' ? null : status === 'guest' ? (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-full text-sm bg-teal-600 text-white hover:bg-teal-700"
            >
              Sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={signOut}
              className="px-3 py-1.5 rounded-full text-sm text-stone-500 hover:bg-stone-200"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
