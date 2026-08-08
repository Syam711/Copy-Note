import { useToastStore, TOAST_CONFIG } from '../../store/toastStore';
import Icon from '../icons/Icon';

export default function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => {
        const config = TOAST_CONFIG[t.action];
        if (!config) return null;
        return (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-full bg-stone-800 text-stone-50 px-4 py-2 text-sm shadow-lg animate-toast-in"
          >
            <Icon name={config.icon} size={15} />
            <span>{config.message(t.title)}</span>
          </div>
        );
      })}
    </div>
  );
}
