import { ActivityType } from '../../generated/graphql';

/**
 * Format activity type + metadata into a short human-readable message (English).
 */
export function formatActivityMessage(
  type: ActivityType,
  metadata: Record<string, any> | null | undefined,
  boardTitle?: string | null
): string {
  const m = metadata || {};
  const board = boardTitle ? ` on board "${boardTitle}"` : '';

  switch (type) {
    case 'WORKSPACE_CREATED':
      return `created the workspace "${m.name ?? 'Workspace'}"`;
    case 'WORKSPACE_UPDATED':
      return `updated the workspace (name: ${m.name ?? '—'})`;
    case 'WORKSPACE_MEMBER_ADDED':
      return `added a member to the workspace`;
    case 'WORKSPACE_MEMBER_REMOVED':
      return `removed a member from the workspace`;
    case 'WORKSPACE_MEMBER_LEFT':
      return `left the workspace`;
    case 'BOARD_CREATED':
      return `created the board "${m.title ?? 'Board'}"`;
    case 'BOARD_UPDATED':
      return `updated the board${board}`;
    case 'LIST_CREATED':
      return `created the list "${m.title ?? 'List'}"${board}`;
    case 'LIST_UPDATED':
      return `renamed the list "${m.title ?? '—'}"${board}`;
    case 'LIST_ARCHIVED':
      return `archived the list "${m.title ?? '—'}"${board}`;
    case 'LIST_REORDERED':
      return `reordered lists${board}`;
    case 'CARD_CREATED':
      return `created the card "${m.title ?? 'Card'}"${board}`;
    case 'CARD_UPDATED':
      return `updated a card${board}`;
    case 'CARD_ARCHIVED':
      return `archived the card "${m.title ?? '—'}"${board}`;
    case 'CARD_DELETED':
      return `deleted the card "${m.title ?? '—'}"${board}`;
    case 'CARD_MOVED':
      return `moved a card${board}`;
    case 'CARD_DUE_DATE_SET':
      return `set a due date on a card${board}`;
    case 'CARD_DUE_DATE_CLEARED':
      return `cleared the due date on a card${board}`;
    case 'CARD_DONE_SET':
      return `marked a card as ${m.done ? 'done' : 'to do'}${board}`;
    case 'CARD_LABEL_ADDED':
      return `added the label "${m.labelName ?? '—'}" to a card${board}`;
    case 'CARD_LABEL_REMOVED':
      return `removed the label "${m.labelName ?? '—'}" from a card${board}`;
    case 'CARD_ASSIGNEE_ADDED':
      return `assigned a member to a card${board}`;
    case 'CARD_ASSIGNEE_REMOVED':
      return `removed an assignee from a card${board}`;
    case 'CARD_ASSIGNEES_SET':
      return `updated assignees on a card${board}`;
    case 'COMMENT_ADDED':
      return `added a comment${board}`;
    case 'COMMENT_DELETED':
      return `deleted a comment${board}`;
    case 'ATTACHMENT_UPLOADED':
      return `added an attachment${board}`;
    case 'ATTACHMENT_DELETED':
      return `deleted an attachment${board}`;
    case 'LABEL_CREATED':
      return `created the label "${m.name ?? '—'}"`;
    case 'LABEL_UPDATED':
      return `updated the label "${m.name ?? '—'}"`;
    case 'LABEL_DELETED':
      return `deleted the label "${m.name ?? '—'}"`;
    default:
      return `action (${type})`;
  }
}

/**
 * Format a date as relative time (e.g. "5 min ago").
 */
export function formatActivityDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { dateStyle: 'short' });
}
