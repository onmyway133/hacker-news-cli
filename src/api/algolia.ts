import type { Feed, Story, Comment } from '../types.js';

const BASE = 'https://hn.algolia.com/api/v1';

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  author: string;
  points?: number;
  story_text?: string;
  comment_text?: string;
  created_at_i: number;
  num_comments?: number;
  _tags?: string[];
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbPages: number;
  page: number;
}

interface AlgoliaItem {
  id: number;
  title?: string;
  url?: string;
  author: string;
  points?: number;
  text?: string;
  created_at_i: number;
  children?: AlgoliaItem[];
  _tags?: string[];
}

function hitToStory(hit: AlgoliaHit): Story | null {
  const id = parseInt(hit.objectID);
  if (isNaN(id)) return null;

  const title = hit.title ?? hit.story_title ?? '(untitled)';
  const tags = hit._tags ?? [];
  let type: Story['type'] = 'story';
  if (tags.includes('ask_hn')) type = 'ask';
  else if (tags.includes('show_hn')) type = 'show';
  else if (tags.includes('job')) type = 'job';

  return {
    id,
    title,
    url: hit.url ?? hit.story_url,
    text: hit.story_text,
    by: hit.author,
    score: hit.points ?? 0,
    time: hit.created_at_i,
    descendants: hit.num_comments ?? 0,
    type,
  };
}

function flattenComments(item: AlgoliaItem, depth = 0): Comment[] {
  const result: Comment[] = [];

  // Skip deleted/dead items
  if (!item.author && !item.text) return result;

  const comment: Comment = {
    id: item.id,
    by: item.author ?? '[deleted]',
    text: item.text ?? '',
    time: item.created_at_i ?? 0,
    depth,
    collapsed: false,
  };

  result.push(comment);

  for (const child of item.children ?? []) {
    result.push(...flattenComments(child, depth + 1));
  }

  return result;
}

const FEED_PARAMS: Record<Feed, string> = {
  top: 'tags=front_page',
  new: 'tags=story&numericFilters=created_at_i>0',
  best: 'tags=story&numericFilters=points>100',
  ask: 'tags=ask_hn',
  show: 'tags=show_hn',
  jobs: 'tags=job',
};

const FEED_SORT: Record<Feed, 'search' | 'search_by_date'> = {
  top: 'search',
  new: 'search_by_date',
  best: 'search',
  ask: 'search',
  show: 'search',
  jobs: 'search_by_date',
};

export async function fetchFeed(
  feed: Feed,
  page = 0,
  hitsPerPage = 30
): Promise<{ stories: Story[]; totalPages: number }> {
  const params = FEED_PARAMS[feed];
  const sort = FEED_SORT[feed];
  const url = `${BASE}/${sort}?${params}&page=${page}&hitsPerPage=${hitsPerPage}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Algolia API error: ${res.status}`);

  const data = (await res.json()) as AlgoliaResponse;

  const stories = data.hits
    .map(hitToStory)
    .filter((s): s is Story => s !== null);

  return { stories, totalPages: data.nbPages };
}

export async function searchStories(
  query: string,
  page = 0
): Promise<{ stories: Story[]; totalPages: number }> {
  if (!query.trim()) return { stories: [], totalPages: 0 };

  const url = `${BASE}/search?query=${encodeURIComponent(query)}&tags=story&page=${page}&hitsPerPage=30`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Algolia search error: ${res.status}`);

  const data = (await res.json()) as AlgoliaResponse;

  const stories = data.hits
    .map(hitToStory)
    .filter((s): s is Story => s !== null);

  return { stories, totalPages: data.nbPages };
}

export async function fetchStoryWithComments(
  id: number
): Promise<{ story: Story; comments: Comment[] }> {
  const url = `${BASE}/items/${id}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Algolia item fetch error: ${res.status}`);

  const data = (await res.json()) as AlgoliaItem;

  const story: Story = {
    id: data.id,
    title: data.title ?? '(untitled)',
    url: data.url,
    text: data.text,
    by: data.author ?? '[deleted]',
    score: data.points ?? 0,
    time: data.created_at_i ?? 0,
    descendants: data.children?.length ?? 0,
    type: 'story',
    kids: data.children?.map(c => c.id),
  };

  const comments = (data.children ?? []).flatMap(c => flattenComments(c, 0));

  return { story, comments };
}

if (import.meta.main) {
  const { stories } = await fetchFeed('top');
  console.log('Top stories:');
  stories.slice(0, 5).forEach(s => console.log(`  [${s.score}] ${s.title}`));
}
