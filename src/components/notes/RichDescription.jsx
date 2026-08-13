import { parseLine } from '../../utils/richText';
import Icon from '../icons/Icon';

const MAX_PREVIEW_LINES = 6;

export default function RichDescription({ description, onToggleChecklist, interactive = false, className = '' }) {
  const lines = (description || '').split('\n');
  const visible = lines.slice(0, MAX_PREVIEW_LINES);
  const hasMore = lines.length > MAX_PREVIEW_LINES;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {visible.map((line, i) => {
        const parsed = parseLine(line);

        if (parsed.type === 'checklist') {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <button
                type="button"
                aria-label={parsed.checked ? 'Mark item unchecked' : 'Mark item checked'}
                disabled={!interactive}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleChecklist?.(i);
                }}
                className={`mt-[3px] w-3.5 h-3.5 shrink-0 rounded-sm border flex items-center justify-center ${
                  parsed.checked ? 'bg-teal-600 border-teal-600' : 'border-stone-400 bg-white/60'
                }`}
              >
                {parsed.checked && <Icon name="check" size={10} className="text-white" />}
              </button>
              <span className={`text-sm leading-relaxed ${parsed.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                {parsed.text || '\u00A0'}
              </span>
            </div>
          );
        }

        if (parsed.type === 'bullet') {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-stone-400 text-sm leading-relaxed">•</span>
              <span className="text-sm leading-relaxed text-stone-700">{parsed.text || '\u00A0'}</span>
            </div>
          );
        }

        return parsed.text.trim() ? (
          <p key={i} className="text-sm leading-relaxed text-stone-700">{parsed.text}</p>
        ) : (
          <div key={i} className="h-2" />
        );
      })}
      {hasMore && <span className="text-xs text-stone-400">+ more</span>}
    </div>
  );
}
