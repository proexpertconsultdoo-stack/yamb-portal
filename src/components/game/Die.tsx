import { useEffect, useRef } from 'react';

interface DieProps {
  value: number;
  held: boolean;
  rolling: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function Die({ value, held, rolling, onClick, disabled }: DieProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!rolling || !ref.current) return;
    ref.current.classList.remove('die-rolling');
    void ref.current.offsetWidth;
    ref.current.classList.add('die-rolling');
  }, [rolling]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-14 h-14 text-4xl rounded-xl flex items-center justify-center
        select-none transition-all duration-150
        press-active
        ${held
          ? 'bg-accent text-navy shadow-die-held scale-95'
          : 'bg-surface text-text1 shadow-die hover:scale-105'
        }
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
      `}
    >
      {FACES[value - 1]}
    </button>
  );
}
