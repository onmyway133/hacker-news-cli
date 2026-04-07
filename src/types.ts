export type Feed = 'top' | 'new' | 'best' | 'ask' | 'show' | 'jobs';
export type AppMode = 'browse' | 'comments' | 'search';

export interface Story {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  score: number;
  time: number;
  descendants: number;
  type: 'story' | 'ask' | 'show' | 'job';
  kids?: number[];
}

export interface Comment {
  id: number;
  by: string;
  text: string;
  time: number;
  depth: number;
  collapsed: boolean;
  kids?: number[];
}

export type PreviewContent =
  | { kind: 'article'; text: string }
  | { kind: 'metadata' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string };

export type ScoreColor = 'red' | 'yellow' | 'cyan' | 'white' | 'gray';

export function scoreColor(score: number): ScoreColor {
  if (score >= 300) return 'red';
  if (score >= 100) return 'yellow';
  if (score >= 50) return 'cyan';
  if (score >= 10) return 'white';
  return 'gray';
}

export function timeAgo(unix: number): string {
  const secs = Math.floor(Date.now() / 1000) - unix;
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

export function calcScrollOffset(selected: number, visible: number, total: number): number {
  return Math.max(0, Math.min(
    selected - Math.floor(visible / 2),
    Math.max(0, total - visible)
  ));
}

export const FEED_LABELS: Record<Feed, string> = {
  top: 'Top',
  new: 'New',
  best: 'Best',
  ask: 'Ask',
  show: 'Show',
  jobs: 'Jobs',
};

export const FEEDS: Feed[] = ['top', 'new', 'best', 'ask', 'show', 'jobs'];
