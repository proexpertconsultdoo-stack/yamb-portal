import { useState } from 'react';
import type { LiveTeam, PlayerRoll } from '../../types/live';
import type { ColName, RowName } from '../../types/game';
import { COLS, COL_LABELS, ROW_LABELS, DICE_FACES } from '../../constants/game';
import { calcScore, calcColTotal, calcGrandTotal } from '../../utils/scoring';
import { isCellAvailable } from '../../utils/gameRules';
import type { GameState } from '../../types/game';
import Modal from '../ui/Modal';

interface TeamGamePageProps {
  team: LiveTeam;
  myPlayerId: string;
  partnerRoll: PlayerRoll | null;
  directedRow: RowName | null;
  onCommit: (col: ColName, row: RowName, chosenDice: number[], rollCount: number) => void;
  onMyRollChange: (dice: number[], held: boolean[], rollCount: number, locked: boolean) => void;
}

const TOP_ROWS: RowName[] = ['r1','r2','r3','r4','r5','r6'];
const MID_ROWS: RowName[] = ['max','min'];
const BOT_ROWS: RowName[] = ['kenta','triling','ful','poker','yamb'];

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

export default function TeamGamePage({ team, myPlayerId, partnerRoll, directedRow, onCommit, onMyRollChange }: TeamGamePageProps) {
  const [myDice, setMyDice] = useState([1,1,1,1,1]);
  const [myHeld, setMyHeld] = useState([false,false,false,false,false]);
  const [myRollCount, setMyRollCount] = useState(0);
  const [myLocked, setMyLocked] = useState(false);

  const [chosenPlayerId, setChosenPlayerId] = useState<string | null>(null);
  const [zeroModal, setZeroModal] = useState<{col:ColName; row:RowName; dice:number[]; rc:number} | null>(null);

  const activeDice  = chosenPlayerId === myPlayerId ? myDice
                    : chosenPlayerId && partnerRoll  ? partnerRoll.dice
                    : myDice;
  const activeRc    = chosenPlayerId === myPlayerId ? myRollCount
                    : chosenPlayerId && partnerRoll  ? partnerRoll.roll_count
                    : myRollCount;

  // Fake GameState za isCellAvailable
  const fakeState: GameState = {
    dice: activeDice,
    held: [false,false,false,false,false],
    rollCount: activeRc,
    manualMode: false,
    manualRolls: [],
    announced: null,
    directed: directedRow,
    scores: team.scorecard,
    gameOver: false,
    diceCount: 5,
    turnCount: 0,
    colPointers: { down:0, free:0, up:12, announce:0, manual:0, directed:0, diamond:0, hourglass:0, obligatory:0, max:0 },
    diamondTopPtr: 0, diamondBotPtr: 0, hourglassTopPtr: 0, hourglassBotPtr: 0,
    mode: 'team',
    wasRucno: !myHeld.some(h=>h),
  };

  function handleMyRoll() {
    if (myRollCount >= 3 || myLocked) return;
    const newDice = myDice.map((d,i) => myHeld[i] ? d : rollDie());
    const newRc   = myRollCount + 1;
    setMyDice(newDice);
    setMyRollCount(newRc);
    onMyRollChange(newDice, myHeld, newRc, false);
  }

  function toggleMyHold(i: number) {
    if (myRollCount === 0 || myRollCount >= 3 || myLocked) return;
    const h = [...myHeld];
    h[i] = !h[i];
    setMyHeld(h);
  }

  function handleLock() {
    setMyLocked(true);
    onMyRollChange(myDice, myHeld, myRollCount, true);
  }

  function handleCellClick(col: ColName, row: RowName) {
    if (!chosenPlayerId) return;
    if (!isCellAvailable(col, row, fakeState)) return;
    const score = calcScore(row, activeDice, activeRc);
    if (score === 0 && row !== 'min') {
      setZeroModal({ col, row, dice: activeDice, rc: activeRc });
    } else {
      onCommit(col, row, activeDice, activeRc);
    }
  }

  const bothLocked = myLocked && (partnerRoll?.locked ?? true);

  return (
    <div className="flex flex-col gap-4 p-3 pb-24">
      {/* Baner: dirigovano */}
      {directedRow && (
        <div className="bg-blue/10 border border-blue rounded-btn px-4 py-2 text-sm font-semibold text-blue text-center">
          Dirigovano: {ROW_LABELS[directedRow]}
        </div>
      )}

      {/* Dva panela kockica */}
      <div className="grid grid-cols-2 gap-3">
        {/* Moje kockice */}
        <div className={`bg-surface border-2 rounded-card p-3 ${chosenPlayerId === myPlayerId ? 'border-ggreen' : 'border-gborder'}`}>
          <div className="text-xs font-semibold text-text3 mb-2">Moje kockice</div>
          <div className="flex gap-1 justify-center flex-wrap">
            {myDice.map((v,i) => (
              <button
                key={i}
                onClick={() => toggleMyHold(i)}
                className={`text-2xl w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                  myHeld[i] ? 'bg-accent border-accent2 scale-95' : 'bg-surface2 border-gborder hover:scale-105'
                } ${myLocked ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
              >
                {DICE_FACES[v-1]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 justify-center mt-2">
            {[0,1,2].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i<myRollCount?'bg-blue':'bg-gborder'}`}/>
            ))}
          </div>
          {!myLocked && (
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={handleMyRoll}
                disabled={myRollCount>=3}
                className="flex-1 py-1.5 bg-blue text-white text-xs font-semibold rounded-btn disabled:opacity-40"
              >
                {myRollCount===0?'Baci':myRollCount===1?'Ponovo':'Poslednji'}
              </button>
              {myRollCount>0 && (
                <button
                  onClick={handleLock}
                  className="px-2 py-1.5 border border-ggreen text-ggreen text-xs font-semibold rounded-btn hover:bg-ggreen/10"
                >
                  ✓
                </button>
              )}
            </div>
          )}
          {myLocked && <div className="text-center text-xs text-ggreen font-semibold mt-2">Zaključano ✓</div>}
        </div>

        {/* Partner kockice */}
        <div className={`bg-surface border-2 rounded-card p-3 ${chosenPlayerId && chosenPlayerId !== myPlayerId ? 'border-ggreen' : 'border-gborder'}`}>
          <div className="text-xs font-semibold text-text3 mb-2">
            {team.player2 ? team.player2.display_name : 'Partner'}
          </div>
          {partnerRoll ? (
            <>
              <div className="flex gap-1 justify-center flex-wrap">
                {partnerRoll.dice.map((v,i) => (
                  <span key={i} className="text-2xl w-9 h-9 rounded-lg flex items-center justify-center bg-surface2 border border-gborder">
                    {DICE_FACES[v-1]}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 justify-center mt-2">
                {[0,1,2].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i<partnerRoll.roll_count?'bg-blue':'bg-gborder'}`}/>
                ))}
              </div>
              {partnerRoll.locked
                ? <div className="text-center text-xs text-ggreen font-semibold mt-2">Zaključano ✓</div>
                : <div className="text-center text-xs text-text3 mt-2">Baca...</div>
              }
            </>
          ) : (
            <div className="text-center text-xs text-text3 py-4">Čeka se partner...</div>
          )}
        </div>
      </div>

      {/* Izbor čiji rezultat koristiti */}
      {bothLocked && !chosenPlayerId && (
        <div className="bg-accent/10 border border-accent rounded-card p-4">
          <div className="text-sm font-semibold text-navy mb-3 text-center">Čiji rezultat upisujete?</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setChosenPlayerId(myPlayerId)}
              className="py-2.5 bg-blue text-white font-semibold rounded-btn text-sm hover:bg-blue-light"
            >
              Moje kockice
            </button>
            {partnerRoll && team.player2 && (
              <button
                onClick={() => setChosenPlayerId(team.player2!.id)}
                className="py-2.5 border-2 border-blue text-blue font-semibold rounded-btn text-sm hover:bg-blue/10"
              >
                {team.player2.display_name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Listić */}
      {chosenPlayerId && (
        <div className="overflow-x-auto rounded-card border border-gborder">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-navy text-white">
                <th className="text-left pl-3 py-2 font-semibold w-16 border-r border-navy2">Polje</th>
                {COLS.map(col => (
                  <th key={col} className="py-2 font-semibold w-10 border-r border-navy2 last:border-0">
                    {COL_LABELS[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...TOP_ROWS, ...MID_ROWS, ...BOT_ROWS].map(row => (
                <tr key={row} className="hover:bg-surface2/50">
                  <td className="pl-3 py-1.5 font-medium text-text2 border-b border-r border-gborder">{ROW_LABELS[row]}</td>
                  {COLS.map(col => {
                    const val     = team.scorecard[col][row];
                    const avail   = isCellAvailable(col, row, fakeState);
                    const filled  = val !== null;
                    const preview = avail && activeRc > 0;
                    return (
                      <td
                        key={col}
                        onClick={() => handleCellClick(col, row)}
                        className={`text-center text-xs px-1 py-1.5 border-b border-r border-gborder last:border-r-0 cursor-pointer transition-colors ${
                          col==='max' ? 'bg-surface2 cursor-default text-text3' :
                          filled      ? 'bg-surface text-text2' :
                          preview     ? 'cell-pulse font-semibold text-blue hover:bg-accent/20' :
                                        'bg-surface text-text3/40'
                        }`}
                      >
                        {filled ? val : (preview ? calcScore(row, activeDice, activeRc) : '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-navy text-white font-bold">
                <td className="pl-3 py-2 border-r border-navy2">Ukupno</td>
                {COLS.map(col => (
                  <td key={col} className="text-center py-2 border-r border-navy2 last:border-r-0">
                    {calcColTotal(col, team.scorecard[col]) || '–'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gborder flex justify-between bg-navy rounded-b-card">
            <span className="text-white/70 text-sm">Ukupno tim</span>
            <span className="text-accent font-bold text-xl">{calcGrandTotal(team.scorecard)}</span>
          </div>
        </div>
      )}

      <Modal open={!!zeroModal} onClose={() => setZeroModal(null)} title="Upiši nulu?">
        <p className="text-text2 text-sm mb-4">Rezultat je 0. Da li želiš da upišeš nulu?</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (zeroModal) onCommit(zeroModal.col, zeroModal.row, zeroModal.dice, zeroModal.rc);
              setZeroModal(null);
            }}
            className="flex-1 bg-gred text-white font-semibold py-2 rounded-btn"
          >Upiši nulu</button>
          <button onClick={() => setZeroModal(null)} className="flex-1 border border-gborder text-text2 font-semibold py-2 rounded-btn">
            Odustani
          </button>
        </div>
      </Modal>
    </div>
  );
}
