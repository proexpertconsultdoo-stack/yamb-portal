import type { GameState, ColName, RowName } from '../../types/game';
import { COLS, COL_LABELS, ROW_LABELS } from '../../constants/game';
import { isCellAvailable } from '../../utils/gameRules';
import { calcScore, topSectionSum, topBonus, middleSectionValue, calcColTotal, calcGrandTotal } from '../../utils/scoring';

interface ScorecardProps {
  state: GameState;
  onCommit: (col: ColName, row: RowName) => void;
  announceMode?: boolean;
}

const TOP_ROWS: RowName[]    = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
const MID_ROWS: RowName[]    = ['max', 'min'];
const BOT_ROWS: RowName[]    = ['kenta', 'triling', 'ful', 'poker', 'yamb'];

export default function Scorecard({ state, onCommit, announceMode }: ScorecardProps) {
  const { scores, dice, rollCount } = state;

  function cellClass(col: ColName, row: RowName): string {
    const available = isCellAvailable(col, row, state);
    const filled    = scores[col][row] !== null;
    const preview   = available && rollCount > 0;
    const base      = 'text-center text-xs px-1 py-1.5 border-b border-r border-gborder cursor-pointer transition-colors';
    if (col === 'max') return `${base} bg-surface2 cursor-default text-text3`;
    if (filled)   return `${base} bg-surface text-text2`;
    // N kolona u announce modu — zeleno svetli
    if (col === 'announce' && announceMode && !filled)
      return `${base} bg-ggreen/20 border-ggreen font-semibold text-ggreen cursor-pointer hover:bg-ggreen/40 animate-pulse`;
    if (preview)  return `${base} cell-pulse font-semibold text-blue cursor-pointer hover:bg-accent/20`;
    return `${base} bg-surface text-text3/40`;
  }

  function cellContent(col: ColName, row: RowName): string {
    const val = scores[col][row];
    if (val !== null) return String(val);
    if (col === 'max') return '–';
    const available = isCellAvailable(col, row, state);
    if (available && rollCount > 0) {
      return String(calcScore(row, dice, rollCount));
    }
    return '';
  }

  function handleCell(col: ColName, row: RowName) {
    if (isCellAvailable(col, row, state)) onCommit(col, row);
  }

  return (
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
          {/* Top section */}
          {TOP_ROWS.map(row => (
            <tr key={row} className="hover:bg-surface2/50">
              <td className="pl-3 py-1.5 font-medium text-text2 border-b border-r border-gborder">{ROW_LABELS[row]}</td>
              {COLS.map(col => (
                <td key={col} className={cellClass(col, row)} onClick={() => handleCell(col, row)}>
                  {cellContent(col, row)}
                </td>
              ))}
            </tr>
          ))}

          {/* Top sum row */}
          <tr className="bg-surface2">
            <td className="pl-3 py-1.5 text-text3 text-xs border-b border-r border-gborder">Zbir 1-6</td>
            {COLS.map(col => (
              <td key={col} className="text-center text-xs text-text2 border-b border-r border-gborder last:border-r-0">
                {topSectionSum(scores[col]) || ''}
              </td>
            ))}
          </tr>

          {/* Top bonus row */}
          <tr className="bg-accent/10">
            <td className="pl-3 py-1.5 text-text3 text-xs border-b border-r border-gborder">Bonus (+30)</td>
            {COLS.map(col => (
              <td key={col} className="text-center text-xs font-semibold text-accent2 border-b border-r border-gborder last:border-r-0">
                {topBonus(scores[col]) > 0 ? '+30' : ''}
              </td>
            ))}
          </tr>

          {/* Mid section */}
          {MID_ROWS.map(row => (
            <tr key={row} className="hover:bg-surface2/50">
              <td className="pl-3 py-1.5 font-medium text-text2 border-b border-r border-gborder">{ROW_LABELS[row]}</td>
              {COLS.map(col => (
                <td key={col} className={cellClass(col, row)} onClick={() => handleCell(col, row)}>
                  {cellContent(col, row)}
                </td>
              ))}
            </tr>
          ))}

          {/* Middle section formula row */}
          <tr className="bg-surface2">
            <td className="pl-3 py-1.5 text-text3 text-xs border-b border-r border-gborder">(M-m)×1</td>
            {COLS.map(col => (
              <td key={col} className="text-center text-xs text-text2 border-b border-r border-gborder last:border-r-0">
                {middleSectionValue(scores[col], scores[col]['r1']) || ''}
              </td>
            ))}
          </tr>

          {/* Bottom section */}
          {BOT_ROWS.map(row => (
            <tr key={row} className="hover:bg-surface2/50">
              <td className="pl-3 py-1.5 font-medium text-text2 border-b border-r border-gborder">{ROW_LABELS[row]}</td>
              {COLS.map(col => (
                <td key={col} className={cellClass(col, row)} onClick={() => handleCell(col, row)}>
                  {cellContent(col, row)}
                </td>
              ))}
            </tr>
          ))}

          {/* Column totals */}
          <tr className="bg-navy text-white font-bold">
            <td className="pl-3 py-2 border-r border-navy2">Ukupno</td>
            {COLS.map(col => (
              <td key={col} className="text-center py-2 border-r border-navy2 last:border-r-0">
                {calcColTotal(col, scores[col]) || '–'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="px-4 py-3 border-t border-gborder flex justify-between items-center bg-navy rounded-b-card">
        <span className="text-white/70 text-sm">Ukupan rezultat</span>
        <span className="text-accent font-bold text-xl">{calcGrandTotal(scores)}</span>
      </div>
    </div>
  );
}
