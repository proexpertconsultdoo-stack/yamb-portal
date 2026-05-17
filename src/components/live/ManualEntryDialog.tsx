import { useState } from 'react';
import type { RowName } from '../../types/game';
import { ROW_LABELS } from '../../constants/game';

interface ManualEntryDialogProps {
  row: RowName;
  onConfirm: (score: number) => void;
  onCancel: () => void;
}

export default function ManualEntryDialog({ row, onConfirm, onCancel }: ManualEntryDialogProps) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<number[]>([]);

  function pick(v: number) {
    const next = [...vals, v];
    setVals(next);

    switch (row) {
      case 'r1': case 'r2': case 'r3': case 'r4': case 'r5': case 'r6': {
        const num = parseInt(row.slice(1));
        onConfirm(v * num);
        return;
      }
      case 'max': case 'min': {
        onConfirm(v);
        return;
      }
      case 'kenta': {
        if (step === 0) { setStep(1); return; } // mali/veliki odabran
        // step 0 = mali(0)/veliki(1), step 1 = bacanje(1/2/3)
        const base   = vals[0] === 0 ? 35 : 45;
        const bonus  = v === 1 ? 31 : v === 2 ? 21 : 11;
        onConfirm(base + bonus);
        return;
      }
      case 'triling': {
        onConfirm(v * 3 + 20);
        return;
      }
      case 'ful': {
        if (step === 0) { setStep(1); return; } // first = triling broj
        onConfirm(vals[0] * 3 + v * 2 + 30);
        return;
      }
      case 'poker': {
        onConfirm(v * 4 + 40);
        return;
      }
      case 'yamb': {
        onConfirm(v * 5 + 50);
        return;
      }
    }
  }

  function numBtns(from: number, to: number, label?: (n:number)=>string) {
    return Array.from({length: to - from + 1}, (_,i) => from + i).map(n => (
      <button
        key={n}
        onClick={() => pick(n)}
        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold text-lg transition-all hover:scale-110 active:scale-95"
      >
        {label ? label(n) : n}
      </button>
    ));
  }

  function renderContent() {
    switch (row) {
      case 'r1': case 'r2': case 'r3': case 'r4': case 'r5': case 'r6': {
        const num = parseInt(row.slice(1));
        return (
          <>
            <p className="text-white/70 text-sm mb-4">Koliko {num}-ica imaš?</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {numBtns(0, 5, n => n === 0 ? '0' : `${n}×${num}=${n*num}`)}
            </div>
          </>
        );
      }
      case 'max': case 'min': {
        return <SumInput label="Unesi zbir svih kockica" onConfirm={onConfirm} />;
      }
      case 'kenta': {
        if (step === 0) return (
          <>
            <p className="text-white/70 text-sm mb-4">Koja kenta?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => pick(0)} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold transition-all hover:scale-105">
                Mali 1–5
              </button>
              <button onClick={() => pick(1)} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold transition-all hover:scale-105">
                Veliki 2–6
              </button>
            </div>
          </>
        );
        return (
          <>
            <p className="text-white/70 text-sm mb-4">Na kom bacanju?</p>
            <div className="flex gap-3 justify-center">
              {[1,2,3].map(b => {
                const base = vals[0] === 0 ? 35 : 45;
                const bonus = b===1?31:b===2?21:11;
                return (
                  <button key={b} onClick={() => pick(b)}
                    className="flex flex-col items-center px-5 py-3 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold transition-all hover:scale-105"
                  >
                    <span className="text-xs text-white/60 mb-1">{b}. bacanje</span>
                    <span className="text-xl">{base + bonus}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      }
      case 'triling': return (
        <>
          <p className="text-white/70 text-sm mb-4">Triling od kojeg broja?</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {numBtns(1, 6, n => `${n}×3+20=${n*3+20}`)}
          </div>
        </>
      );
      case 'ful': {
        if (step === 0) return (
          <>
            <p className="text-white/70 text-sm mb-4">Triling od kojeg broja?</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => pick(n)}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold text-lg transition-all hover:scale-110"
                >{n}</button>
              ))}
            </div>
          </>
        );
        return (
          <>
            <p className="text-white/70 text-sm mb-1">Par od kojeg broja? <span className="text-accent">(triling={vals[0]})</span></p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[1,2,3,4,5,6].filter(n => n !== vals[0]).map(n => (
                <button key={n} onClick={() => pick(n)}
                  className="flex flex-col items-center w-14 py-2 rounded-xl bg-white/10 hover:bg-accent hover:text-navy border border-white/20 text-white font-bold transition-all hover:scale-110"
                >
                  <span>{n}</span>
                  <span className="text-xs text-white/60">{vals[0]*3+n*2+30}</span>
                </button>
              ))}
            </div>
          </>
        );
      }
      case 'poker': return (
        <>
          <p className="text-white/70 text-sm mb-4">Poker od kojeg broja?</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {numBtns(1, 6, n => `${n}×4+40=${n*4+40}`)}
          </div>
        </>
      );
      case 'yamb': return (
        <>
          <p className="text-white/70 text-sm mb-4">Yamb od kojeg broja?</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {numBtns(1, 6, n => `${n}×5+50=${n*5+50}`)}
          </div>
        </>
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4">
      <div className="w-full max-w-sm bg-gradient-to-br from-navy to-navy2 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Upiši rezultat</div>
            <h3 className="text-white font-bold text-lg">{ROW_LABELS[row]}</h3>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>
        <div className="p-5">
          {renderContent()}
          <button onClick={() => onConfirm(0)}
            className="mt-5 w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Upiši 0 (nema rezultata)
          </button>
        </div>
      </div>
    </div>
  );
}

function SumInput({ label, onConfirm }: { label: string; onConfirm: (n:number)=>void }) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-3">
      <p className="text-white/70 text-sm">{label}</p>
      <input
        type="number"
        min="0"
        max="30"
        autoFocus
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold outline-none focus:border-accent"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val && onConfirm(Number(val))}
        placeholder="0"
      />
      <button
        onClick={() => val !== '' && onConfirm(Number(val))}
        disabled={val === ''}
        className="w-full py-3 bg-accent text-navy font-bold rounded-xl hover:bg-accent2 disabled:opacity-40 transition-colors"
      >
        Potvrdi
      </button>
    </div>
  );
}
