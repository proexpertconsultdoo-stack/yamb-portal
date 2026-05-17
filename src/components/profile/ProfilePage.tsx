import { useAuth } from '../../hooks/useAuth';
import { getRankFromXP } from '../../constants/game';
import { useNavigate } from 'react-router-dom';

const ACHIEVEMENTS = [
  { id: 'first_yamb',     icon: '🎲', name: 'Prvi Yamb',      desc: 'Upiši Yamb po prvi put' },
  { id: 'score_300',      icon: '🏅', name: 'Tri stotine',    desc: 'Postavi rezultat ≥ 300' },
  { id: 'score_500',      icon: '🥈', name: 'Pet stotina',    desc: 'Postavi rezultat ≥ 500' },
  { id: 'kenta_first_roll',icon:'⚡', name: 'Bleskava kenta', desc: 'Kenta na prvom bacaju (+31)' },
  { id: 'win_multiplayer',icon: '👑', name: 'Prvak',          desc: 'Pobedi u online igri' },
  { id: 'streak_7',       icon: '🔥', name: 'Serija 7',       desc: 'Igraj 7 dana zaredom' },
];

export default function ProfilePage() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center text-text3">Učitavanje...</div>;

  if (!user || !profile) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <div className="text-5xl">👤</div>
        <h2 className="text-xl font-bold text-navy">Niste prijavljeni</h2>
        <p className="text-text3 text-sm text-center">Prijavite se da biste videli profil i pratili napredak.</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-2.5 bg-blue text-white font-semibold rounded-btn hover:bg-blue-light"
        >
          Prijavite se
        </button>
      </div>
    );
  }

  const { rank, next, progress } = getRankFromXP(profile.xp);
  const winRate = profile.games_played > 0
    ? Math.round((profile.wins / profile.games_played) * 100)
    : 0;

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="bg-navy rounded-card p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-navy2 flex items-center justify-center text-3xl font-bold overflow-hidden">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : profile.display_name[0]?.toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg">{profile.display_name}</div>
          <div className="text-white/60 text-sm">@{profile.username}</div>
          <div className="text-accent text-sm font-semibold mt-0.5">{rank}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-surface border border-gborder rounded-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text2 font-medium">XP: <strong>{profile.xp}</strong></span>
          <span className="text-text3">Sledeći rang: {next} XP</span>
        </div>
        <div className="w-full bg-surface2 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 bg-gradient-to-r from-blue to-blue-light rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right text-xs text-text3 mt-1">{progress}%</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Igara', value: profile.games_played },
          { label: 'Pobeda', value: profile.wins },
          { label: 'Win %', value: `${winRate}%` },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-gborder rounded-card p-3 text-center">
            <div className="text-2xl font-bold text-navy">{s.value}</div>
            <div className="text-xs text-text3">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-gborder rounded-card p-3 flex justify-between items-center">
        <span className="text-sm text-text2">Rekord</span>
        <span className="text-xl font-bold text-accent">{profile.best_score}</span>
      </div>

      {/* Achievements */}
      <div className="bg-surface border border-gborder rounded-card p-4">
        <h3 className="font-semibold text-navy mb-3">Dostignuća</h3>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map(a => (
            <div
              key={a.id}
              title={a.desc}
              className="flex flex-col items-center gap-1 p-2 rounded-btn border border-gborder opacity-40 text-center"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs text-text3 leading-tight">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full border border-gred text-gred font-semibold py-2.5 rounded-btn hover:bg-gred/10 transition-colors"
      >
        Odjavi se
      </button>
    </div>
  );
}
