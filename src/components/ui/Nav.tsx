import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <header className="bg-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-accent font-bold text-xl">⚄</span>
        <span className="font-bold text-lg tracking-tight">Yamb Portal</span>
      </Link>
      <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-white/80">
        <Link to="/lobby" className="hover:text-white transition-colors">Lobby</Link>
        <Link to="/tournaments" className="hover:text-white transition-colors">Turniri</Link>
        <Link to="/leaderboard" className="hover:text-white transition-colors">Rang lista</Link>
        <Link to="/profile" className="hover:text-white transition-colors">Profil</Link>
      </nav>
    </header>
  );
}
