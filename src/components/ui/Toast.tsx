import type { ToastItem } from '../../hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const styles: Record<ToastItem['type'], string> = {
  success: 'bg-ggreen text-white',
  error:   'bg-gred text-white',
  info:    'bg-navy text-white',
};

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center justify-between px-4 py-3 rounded-btn shadow-lg text-sm font-medium ${styles[t.type]}`}
          onClick={() => onRemove(t.id)}
        >
          <span>{t.message}</span>
          <button className="ml-4 opacity-70 hover:opacity-100">&times;</button>
        </div>
      ))}
    </div>
  );
}
