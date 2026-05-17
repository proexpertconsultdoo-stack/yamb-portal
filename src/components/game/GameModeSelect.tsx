import { useNavigate } from 'react-router-dom';
import type { GameMode, BotLevel } from '../../types/game';

interface GameModeSelectProps {
  onSelect: (mode: GameMode, botLevel?: BotLevel) => void;
}

export default function GameModeSelect({ onSelect }: GameModeSelectProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3 p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-navy text-center mb-2">Izaberi mod igre</h2>

      <button
        onClick={() => onSelect('solo')}
        className="w-full flex items-center gap-4 bg-surface border border-gborder rounded-card p-4 hover:border-blue hover:bg-blue/5 transition-all text-left"
      >
        <span className="text-3xl">👤</span>
        <div>
          <div className="font-semibold text-navy">Solo</div>
          <div className="text-sm text-text3">Igraj sam, poboljšaj lični rekord</div>
        </div>
      </button>

      <div className="bg-surface border border-gborder rounded-card p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-3xl">🤖</span>
          <div>
            <div className="font-semibold text-navy">Vs Bot</div>
            <div className="text-sm text-text3">Igraj protiv AI protivnika</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as BotLevel[]).map(level => (
            <button
              key={level}
              onClick={() => onSelect('vs_bot', level)}
              className={`py-2 text-sm font-semibold rounded-btn border transition-colors ${
                level === 'easy'   ? 'border-ggreen text-ggreen hover:bg-ggreen hover:text-white' :
                level === 'medium' ? 'border-accent2 text-accent2 hover:bg-accent2 hover:text-white' :
                                     'border-gred text-gred hover:bg-gred hover:text-white'
              }`}
            >
              {level === 'easy' ? 'Lako' : level === 'medium' ? 'Srednje' : 'Teško'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSelect('training')}
        className="w-full flex items-center gap-4 bg-surface border border-gborder rounded-card p-4 hover:border-blue hover:bg-blue/5 transition-all text-left"
      >
        <span className="text-3xl">📚</span>
        <div>
          <div className="font-semibold text-navy">Trening</div>
          <div className="text-sm text-text3">Vežbaj bez pritiska, bez beleženja rezultata</div>
        </div>
      </button>

      <button
        onClick={() => onSelect('multiplayer')}
        className="w-full flex items-center gap-4 bg-surface border border-gborder rounded-card p-4 hover:border-blue hover:bg-blue/5 transition-all text-left"
      >
        <span className="text-3xl">🌐</span>
        <div>
          <div className="font-semibold text-navy">Multiplayer</div>
          <div className="text-sm text-text3">Igraj online sa prijateljima</div>
        </div>
      </button>

      <button
        onClick={() => onSelect('team')}
        className="w-full flex items-center gap-4 bg-surface border border-gborder rounded-card p-4 hover:border-blue hover:bg-blue/5 transition-all text-left"
      >
        <span className="text-3xl">👥</span>
        <div>
          <div className="font-semibold text-navy">Tim / Parovi (online)</div>
          <div className="text-sm text-text3">Timska igra — zajedno do pobede</div>
        </div>
      </button>

      <button
        onClick={() => navigate('/live')}
        className="w-full flex items-center gap-4 bg-navy border border-navy2 rounded-card p-4 hover:bg-navy2 transition-all text-left"
      >
        <span className="text-3xl">🏟️</span>
        <div>
          <div className="font-semibold text-white">Uživo turnir</div>
          <div className="text-sm text-white/60">Parovi / solo — igrači fizički prisutni, listić deljeni</div>
        </div>
      </button>
    </div>
  );
}
