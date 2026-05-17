import type { GameState } from '../../types/game';
import { calcGrandTotal } from '../../utils/scoring';
import { COLS, COL_LABELS } from '../../constants/game';
import { calcColTotal } from '../../utils/scoring';

interface ResultScreenProps {
  state: GameState;
  onNewGame: () => void;
  playerName?: string;
}

export default function ResultScreen({ state, onNewGame, playerName }: ResultScreenProps) {
  const total = calcGrandTotal(state.scores);

  const colTotals = COLS.filter(c => c !== 'max').map(col => ({
    col,
    label: COL_LABELS[col],
    total: calcColTotal(col, state.scores[col]),
  }));

  const best = Math.max(...colTotals.map(c => c.total));

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-6xl mb-2">🏆</div>
        <h2 className="text-2xl font-bold text-navy">
          {playerName ? `${playerName} — kraj igre!` : 'Kraj igre!'}
        </h2>
        <p className="text-text3 text-sm mt-1">Ukupan rezultat</p>
        <div className="text-5xl font-bold text-accent mt-2">{total}</div>
      </div>

      {/* Column breakdown */}
      <div className="w-full bg-surface rounded-card border border-gborder p-4">
        <h3 className="text-sm font-semibold text-text2 mb-3">Rezultati po kolonama</h3>
        <div className="grid grid-cols-3 gap-2">
          {colTotals.map(c => (
            <div
              key={c.col}
              className={`text-center py-2 rounded-btn border ${
                c.total === best ? 'border-accent bg-accent/10' : 'border-gborder'
              }`}
            >
              <div className="text-lg font-bold text-navy">{c.label}</div>
              <div className={`font-semibold ${c.total === best ? 'text-accent2' : 'text-text2'}`}>
                {c.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-card border border-gborder p-3 text-center">
          <div className="text-2xl font-bold text-navy">{state.turnCount}</div>
          <div className="text-xs text-text3">Poteza</div>
        </div>
        <div className="bg-surface rounded-card border border-gborder p-3 text-center">
          <div className="text-2xl font-bold text-ggreen">{best}</div>
          <div className="text-xs text-text3">Best kolona</div>
        </div>
      </div>

      <button
        onClick={onNewGame}
        className="w-full bg-blue hover:bg-blue-light text-white font-bold py-3 rounded-btn transition-colors press-active"
      >
        Nova igra
      </button>
    </div>
  );
}
