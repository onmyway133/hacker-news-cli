import type { Story, Comment } from '../types.js';

const BASE = 'https://hacker-news.firebaseio.com/v0';

interface HNItem {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  text?: string;
  by?: string;
  score?: number;
  time?: number;
  descendants?: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${BASE}/item/${id}.json`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json() as HNItem;
  } catch {
    return null;
  }
}

async function buildCommentTree(id: number, depth: number, maxDepth: number): Promise<Comment[]> {
  if (depth > maxDepth) return [];

  const item = await fetchItem(id);
  if (!item || item.deleted || item.dead || item.type !== 'comment') return [];

  const comment: Comment = {
    id: item.id,
    by: item.by ?? '[deleted]',
    text: item.text ?? '',
    time: item.time ?? 0,
    depth,
    collapsed: false,
    kids: item.kids,
  };

  const children = await Promise.all(
    (item.kids ?? []).map(kid => buildCommentTree(kid, depth + 1, maxDepth))
  );

  return [comment, ...children.flat()];
}

export async function fetchStoryFallback(id: number): Promise<{ story: Story; comments: Comment[] }> {
  const item = await fetchItem(id);
  if (!item) throw new Error(`Item ${id} not found`);

  const story: Story = {
    id: item.id,
    title: item.title ?? '(untitled)',
    url: item.url,
    text: item.text,
    by: item.by ?? '[deleted]',
    score: item.score ?? 0,
    time: item.time ?? 0,
    descendants: item.descendants ?? 0,
    type: 'story',
    kids: item.kids,
  };

  const comments = await Promise.all(
    (item.kids ?? []).slice(0, 50).map(kid => buildCommentTree(kid, 0, 4))
  );

  return { story, comments: comments.flat() };
}
