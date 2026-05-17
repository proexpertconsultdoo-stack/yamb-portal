import { useState } from 'react';
import Die from './Die';
import type { GameState, RowName } from '../../types/game';
import { ROW_LABELS } from '../../constants/game';

interface DiceAreaProps {
  state: GameState;
  onRoll: () => void;
  onToggleHold: (i: number) => void;
  onCancelAnnounce: () => void;
  announceMode: boolean;
  onToggleAnnounceMode: () => void;
}

export default function DiceArea({
  state, onRoll, onToggleHold, onCancelAnnounce, announceMode, onToggleAnnounceMode,
}: DiceAreaProps) {
  const { dice, held, rollCount, announced, directed } = state;
  const [rolling, setRolling] = useState(false);

  function handleRoll() {
    if (rollCount >= 3) return;
    setRolling(true);
    onRoll();
    setTimeout(() => setRolling(false), 550);
  }

  const canRoll     = rollCount < 3;
  const canAnnounce = rollCount === 1 && announced === null && !directed;
  const rollLabel   = rollCount === 0 ? 'Baci' : rollCount === 1 ? 'Baci ponovo' : 'Poslednji bacaj';

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Baneri */}
      {announced && (
        <div className="flex items-center gap-2 bg-accent/20 border border-accent rounded-btn px-4 py-2 text-sm font-semibold text-navy">
          <span>Najava: {ROW_LABELS[announced]}</span>
          {rollCount < 2 && (
            <button onClick={onCancelAnnounce} className="text-gred hover:opacity-80 ml-2">✕</button>
          )}
          {rollCount >= 2 && (
            <span className="text-xs text-text2 ml-2 font-normal">(zaključano)</span>
          )}
        </div>
      )}
      {directed && !announced && (
        <div className="bg-blue/10 border border-blue rounded-btn px-4 py-2 text-sm font-semibold text-blue">
          Dirigovano: {ROW_LABELS[directed]}
        </div>
      )}
      {announceMode && (
        <div className="bg-ggreen/10 border border-ggreen rounded-btn px-4 py-2 text-sm font-semibold text-ggreen">
          Klikni polje u N koloni da najaviš
        </div>
      )}

      {/* Kockice */}
      <div className="flex gap-3">
        {dice.map((val, i) => (
          <Die
            key={i}
            value={val}
            held={held[i]}
            rolling={rolling && !held[i]}
            onClick={() => onToggleHold(i)}
            disabled={rollCount === 0 || rollCount >= 3}
          />
        ))}
      </div>

      {/* Indikator bacanja */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < rollCount ? 'bg-blue' : 'bg-gborder'}`} />
        ))}
      </div>

      {/* Dugmad */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={handleRoll}
          disabled={!canRoll}
          className="px-6 py-2.5 bg-blue hover:bg-blue-light text-white font-semibold rounded-btn transition-colors disabled:opacity-40 press-active"
        >
          {rollLabel}
        </button>

        {canAnnounce && (
          <button
            onClick={onToggleAnnounceMode}
            className={`w-11 h-11 font-bold rounded-btn border-2 transition-colors press-active text-lg ${
              announceMode
                ? 'bg-ggreen text-white border-ggreen shadow-lg scale-105'
                : 'border-ggreen text-ggreen hover:bg-ggreen/10'
            }`}
          >
            N
          </button>
        )}
      </div>
    </div>
  );
}
