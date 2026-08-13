const CHECKLIST_RE = /^- \[([ xX])\] (.*)$/;
const BULLET_RE = /^- (.*)$/;

// A note's description is always just text — this only interprets
// it for display. Nothing is stored differently based on what a line
// parses as.
export function parseLine(line) {
  const checklistMatch = line.match(CHECKLIST_RE);
  if (checklistMatch) {
    return { type: 'checklist', checked: checklistMatch[1].toLowerCase() === 'x', text: checklistMatch[2] };
  }
  const bulletMatch = line.match(BULLET_RE);
  if (bulletMatch) {
    return { type: 'bullet', text: bulletMatch[1] };
  }
  return { type: 'text', text: line };
}

// Flips one checklist line's [ ] <-> [x] by rewriting that exact line
// within the description string — the "database" for checked state
// is just the text itself.
export function toggleChecklistLine(description, lineIndex) {
  const lines = description.split('\n');
  const line = lines[lineIndex];
  if (!line) return description;
  const match = line.match(CHECKLIST_RE);
  if (!match) return description;
  const nowChecked = match[1].toLowerCase() === 'x';
  lines[lineIndex] = line.replace(CHECKLIST_RE, `- [${nowChecked ? ' ' : 'x'}] $2`);
  return lines.join('\n');
}

// Used by displayTitle's fallback so an untitled checklist/bulleted
// note doesn't show raw "- [ ] " syntax as its pseudo-title.
export function stripLineMarker(line) {
  return line.replace(CHECKLIST_RE, '$2').replace(BULLET_RE, '$1');
}
