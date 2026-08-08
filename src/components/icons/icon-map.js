import {
  Copy,
  Trash2,
  Archive,
  ArchiveRestore,
  Share2,
  Pin,
  PinOff,
  Edit3,
  MoreVertical,
  X,
  RotateCcw,
  Mail,
  Lock,
  Search,
  CheckSquare,
  CheckCircle2,
} from 'lucide-react';

// Every icon used anywhere in the app is registered here, once. To
// swap the whole icon set later (say, from lucide to Phosphor), this
// is the only file that changes — nothing else imports an icon
// library directly, including components/shared/Toast.jsx, which only
// knows string names like 'copy' or 'trash'.
export const ICONS = {
  copy: Copy,
  trash: Trash2,
  archive: Archive,
  restore: ArchiveRestore,
  share: Share2,
  pin: Pin,
  unpin: PinOff,
  edit: Edit3,
  more: MoreVertical,
  close: X,
  undo: RotateCcw,
  email: Mail,
  lock: Lock,
  search: Search,
  select: CheckSquare,
  check: CheckCircle2,
};
