import { useRef, useLayoutEffect, useCallback } from 'react';

const CHECKLIST_LINE_RE = /^- \[[ xX]\] ?(.*)$/;
const BULLET_LINE_RE = /^- (.*)$/;

// Returns { textareaRef, onChange, onKeyDown } to spread onto a plain
// <textarea>. Cursor position after a programmatic rewrite is applied
// via a ref + useLayoutEffect, since a controlled textarea's DOM value
// only catches up to React state on the next render — setting
// selectionRange has to happen after that commit, not before it.
export function useMarkdownShortcuts(value, setValue) {
  const textareaRef = useRef(null);
  const pendingCursor = useRef(null);

  useLayoutEffect(() => {
    if (pendingCursor.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  }, [value]);

  const applyChange = (newValue, cursorPos) => {
    pendingCursor.current = cursorPos;
    setValue(newValue);
  };

  // Enter: continue the current line's marker onto the next line, or
  // — if the current item has no text yet — clear the marker instead
  // of continuing it, which is how you exit a list in most editors.
  const onKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return;
    const pos = e.target.selectionStart;
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
    const currentLine = value.slice(lineStart, pos);

    const checklistMatch = currentLine.match(CHECKLIST_LINE_RE);
    const bulletMatch = !checklistMatch && currentLine.match(BULLET_LINE_RE);

    if (checklistMatch) {
      e.preventDefault();
      if (checklistMatch[1].trim() === '') {
        applyChange(value.slice(0, lineStart) + value.slice(pos), lineStart);
      } else {
        const insert = '\n- [ ] ';
        applyChange(value.slice(0, pos) + insert + value.slice(pos), pos + insert.length);
      }
      return;
    }

    if (bulletMatch) {
      e.preventDefault();
      if (bulletMatch[1].trim() === '') {
        applyChange(value.slice(0, lineStart) + value.slice(pos), lineStart);
      } else {
        const insert = '\n- ';
        applyChange(value.slice(0, pos) + insert + value.slice(pos), pos + insert.length);
      }
    }
  }, [value]);

  // "- " / "* " typed as the whole line so far -> normalized bullet.
  // "[] " or "[ ] " typed right after that -> checklist marker.
  const onChange = useCallback((e) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart;
    const lineStart = newValue.lastIndexOf('\n', pos - 1) + 1;
    const currentLine = newValue.slice(lineStart, pos);

    if (currentLine === '- ' || currentLine === '* ') {
      applyChange(`${newValue.slice(0, lineStart)}- ${newValue.slice(pos)}`, lineStart + 2);
      return;
    }
    if (currentLine === '- [] ' || currentLine === '- [ ] ') {
      applyChange(`${newValue.slice(0, lineStart)}- [ ] ${newValue.slice(pos)}`, lineStart + 6);
      return;
    }
    setValue(newValue);
  }, []);

  return { textareaRef, onChange, onKeyDown };
}
