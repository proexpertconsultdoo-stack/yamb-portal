import { useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { useToast } from '../../hooks/useToast';
import DiceArea from './DiceArea';
import Scorecard from './Scorecard';
import ResultScreen from './ResultScreen';
import Modal from '../ui/Modal';
import Toast from '../ui/Toast';
import type { ColName, RowName, GameMode } from '../../types/game';
import { isCellAvailable } from '../../utils/gameRules';
import { calcScore } from '../../utils/scoring';

interface GameBoardProps {
  onExit?: () => void;
  playerName?: string;
  training?: boolean;
  mode?: GameMode;
}

export default function GameBoard({ onExit, playerName, training, mode = 'solo' }: GameBoardProps) {
  const { state, rollDice, toggleHold, commitEntry, announce, cancelAnnounce, newGame } = useGameState(mode);
  const { toasts, addToast, removeToast } = useToast();
  const [zeroModal, setZeroModal] = useState<{ col: ColName; row: RowName; score: number } | null>(null);
  const [announceMode, setAnnounceMode] = useState(false);

  function handleCommit(col: ColName, row: RowName) {
    if (!isCellAvailable(col, row, state)) return;

    // Ako je announceMode aktivan i kliknuto u N kolonu → najava
    if (announceMode && col === 'announce') {
      announce(row);
      setAnnounceMode(false);
      return;
    }

    // R kolona: ako bacanje nije ručno → samo 0
    const effectiveScore = (col === 'manual' && !state.wasRucno)
      ? 0
      : calcScore(row, state.dice, state.rollCount);

    if (effectiveScore === 0 && row !== 'min') {
      setZeroModal({ col, row, score: 0 });
    } else {
      commitEntry(col, row);
      if (effectiveScore > 0 && ['yamb', 'poker'].includes(row)) {
        addToast(`🎲 ${row === 'yamb' ? 'YAMB!' : 'POKER!'} +${effectiveScore}`, 'success');
      }
    }
  }

  if (state.gameOver) {
    return <ResultScreen state={state} onNewGame={newGame} playerName={playerName} />;
  }

  return (
    <div className="flex flex-col gap-3 pb-24 px-2">
      <div className="flex items-center justify-between pt-3 px-2">
        <div className="text-sm text-text3 font-medium">
          Potez {state.turnCount + 1}
          {training && <span className="ml-2 text-accent font-semibold">Trening</span>}
        </div>
        {onExit && (
          <button onClick={onExit} className="text-sm text-text3 hover:text-gred transition-colors">
            ✕ Izlaz
          </button>
        )}
      </div>

      <DiceArea
        state={state}
        onRoll={rollDice}
        onToggleHold={toggleHold}
        onCancelAnnounce={cancelAnnounce}
        announceMode={announceMode}
        onToggleAnnounceMode={() => setAnnounceMode(a => !a)}
      />

      <Scorecard
        state={state}
        onCommit={handleCommit}
        announceMode={announceMode}
      />

      <Modal open={!!zeroModal} onClose={() => setZeroModal(null)} title="Upiši nulu?">
        <p className="text-text2 text-sm mb-4">
          {zeroModal?.col === 'manual' && !state.wasRucno
            ? 'Bacanje nije bilo ručno (bilo je zadržanih kockica). Može se upisati samo 0.'
            : 'Rezultat za ovo polje je 0. Da li želiš da upišeš nulu?'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (zeroModal) commitEntry(zeroModal.col, zeroModal.row);
              setZeroModal(null);
            }}
            className="flex-1 bg-gred text-white font-semibold py-2 rounded-btn hover:opacity-90"
          >
            Upiši nulu
          </button>
          <button
            onClick={() => setZeroModal(null)}
            className="flex-1 border border-gborder text-text2 font-semibold py-2 rounded-btn hover:bg-surface2"
          >
            Odustani
          </button>
        </div>
      </Modal>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
