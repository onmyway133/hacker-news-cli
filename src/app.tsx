import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useInput } from 'ink';
import type { Feed, Story, Comment, PreviewContent, AppMode } from './types.js';
import { FEEDS } from './types.js';
import { fetchStoryWithComments } from './api/algolia.js';
import { extractArticle } from './api/article.js';
import type { HNCache } from './cache/db.js';
import { useStories, useSearch } from './hooks/useStories.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { useMouseScroll } from './hooks/useMouseScroll.js';
import { Layout } from './components/Layout.js';
import { CommentView } from './components/CommentView.js';

interface Props {
  cache: HNCache;
  initialFeed: Feed;
  initialSearch?: string;
}

export default function App({ cache, initialFeed, initialSearch }: Props) {
  const { cols, rows } = useTerminalSize();

  // Feed / browse state
  const [mode, setMode] = useState<AppMode>('browse');
  const [activeFeed, setActiveFeed] = useState<Feed>(initialFeed);
  const [page, setPage] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [activePane, setActivePane] = useState<'stories' | 'preview'>('stories');

  // Search state
  const [searchActive, setSearchActive] = useState(!!initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch ?? '');

  // Comment state
  const [commentStory, setCommentStory] = useState<Story | null>(null);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState(0);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // Preview / article state
  const [previewContent, setPreviewContent] = useState<PreviewContent>({ kind: 'metadata' });
  const [articleScrollOffset, setArticleScrollOffset] = useState(0);
  const articleFetchRef = useRef<AbortController | null>(null);

  // Per-feed page memory
  const [pageMap, setPageMap] = useState<Map<Feed, number>>(new Map());

  // Read tracking
  const [readIds, setReadIds] = useState<Set<number>>(() => cache.getReadIds());

  // Data hooks
  const browseResult = useStories(activeFeed, page, cache);
  const searchResult = useSearch(searchQuery, cache);

  const activeStories = searchActive ? searchResult.stories : browseResult.stories;
  const isLoading = searchActive ? searchResult.isLoading : browseResult.isLoading;
  const totalPages = browseResult.totalPages;

  // Clamp selected index when stories change
  useEffect(() => {
    setSelectedStoryIndex(i => Math.min(i, Math.max(0, activeStories.length - 1)));
    setArticleScrollOffset(0);
  }, [activeStories.length, activeFeed, page]);

  // Fetch article preview when selected story changes
  useEffect(() => {
    const story = activeStories[selectedStoryIndex];
    if (!story) return;

    // Cancel previous fetch
    if (articleFetchRef.current) {
      articleFetchRef.current.abort();
    }

    if (!story.url) {
      setPreviewContent(story.text ? { kind: 'metadata' } : { kind: 'metadata' });
      setArticleScrollOffset(0);
      return;
    }

    // Check cache first
    const cached = cache.getArticle(story.url);
    if (cached) {
      setPreviewContent({ kind: 'article', text: cached });
      setArticleScrollOffset(0);
      return;
    }

    // Debounce: wait 300ms before fetching
    setPreviewContent({ kind: 'loading' });
    setArticleScrollOffset(0);

    const timer = setTimeout(() => {
      const controller = new AbortController();
      articleFetchRef.current = controller;

      extractArticle(story.url!)
        .then(text => {
          if (controller.signal.aborted) return;
          cache.setArticle(story.url!, text);
          setPreviewContent({ kind: 'article', text });
        })
        .catch(e => {
          if (controller.signal.aborted) return;
          setPreviewContent({ kind: 'error', message: (e as Error).message });
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      articleFetchRef.current?.abort();
    };
  }, [selectedStoryIndex, activeFeed, page, searchQuery]);

  // Open in browser helper
  const openUrl = useCallback((url: string) => {
    Bun.spawn(['open', url]);
  }, []);

  // Load comments for a story
  const openComments = useCallback(async (story: Story) => {
    cache.markRead(story.id);
    setReadIds(cache.getReadIds());
    setCommentStory(story);
    setCommentList([]);
    setCommentLoading(true);
    setSelectedCommentIndex(0);
    setCollapsedIds(new Set());
    setMode('comments');

    try {
      const { comments } = await fetchStoryWithComments(story.id);
      setCommentList(comments);
    } catch {
      // keep empty list
    } finally {
      setCommentLoading(false);
    }
  }, [cache]);

  // Article line count (for scroll bounds)
  const articleLineCount = useMemo(() => {
    if (previewContent.kind !== 'article') return 0;
    return previewContent.text.split('\n').length;
  }, [previewContent]);

  // Mouse scroll
  useMouseScroll(useCallback((direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -3 : 3;

    if (mode === 'comments') {
      setSelectedCommentIndex(i => Math.max(0, i + delta));
      return;
    }

    if (activePane === 'preview') {
      setArticleScrollOffset(o => Math.max(0, Math.min(o + delta, articleLineCount - 1)));
      return;
    }

    setSelectedStoryIndex(i => Math.max(0, Math.min(i + delta, activeStories.length - 1)));
  }, [mode, activePane, activeStories.length, articleLineCount]));

  // Keyboard input — mode-gated
  useInput((input, key) => {
    if (mode === 'comments') {
      handleCommentsInput(input, key);
      return;
    }
    if (searchActive) {
      // TextInput handles character input; we only handle special keys
      if (key.ctrl && input === 'c') process.exit(0);
      if (key.escape) {
        setSearchActive(false);
        setSearchQuery('');
        setMode('browse');
        setSelectedStoryIndex(0);
      }
      return;
    }
    handleBrowseInput(input, key);
  }, { isActive: true });

  function handleBrowseInput(input: string, key: { upArrow: boolean; downArrow: boolean; leftArrow: boolean; rightArrow: boolean; tab: boolean; return: boolean; escape: boolean; ctrl: boolean }) {
    // Quit
    if (input === 'q' || (key.ctrl && input === 'c')) {
      process.exit(0);
    }

    // Navigation — route j/k to the active pane
    if (activePane === 'preview') {
      if (input === 'j' || key.downArrow) {
        setArticleScrollOffset(o => Math.min(o + 1, Math.max(0, articleLineCount - 1)));
      } else if (input === 'k' || key.upArrow) {
        setArticleScrollOffset(o => Math.max(o - 1, 0));
      }
    } else {
      if (input === 'j' || key.downArrow) {
        setSelectedStoryIndex(i => Math.min(i + 1, activeStories.length - 1));
      } else if (input === 'k' || key.upArrow) {
        setSelectedStoryIndex(i => Math.max(i - 1, 0));
      }
    }

    // Pane switch
    if (key.tab || key.rightArrow) {
      setActivePane(p => p === 'stories' ? 'preview' : 'stories');
    } else if (key.leftArrow) {
      setActivePane('stories');
    }

    // Feed navigation
    if (input === '[') {
      const idx = FEEDS.indexOf(activeFeed);
      const next = FEEDS[(idx - 1 + FEEDS.length) % FEEDS.length];
      setActiveFeed(next);
      setPage(pageMap.get(next) ?? 0);
      setSelectedStoryIndex(0);
    } else if (input === ']') {
      const idx = FEEDS.indexOf(activeFeed);
      const next = FEEDS[(idx + 1) % FEEDS.length];
      setActiveFeed(next);
      setPage(pageMap.get(next) ?? 0);
      setSelectedStoryIndex(0);
    }

    // Feed number shortcuts 1-6
    const feedIdx = parseInt(input) - 1;
    if (feedIdx >= 0 && feedIdx < FEEDS.length) {
      const next = FEEDS[feedIdx];
      setActiveFeed(next);
      setPage(pageMap.get(next) ?? 0);
      setSelectedStoryIndex(0);
    }

    // Pagination
    if (input === 'n') {
      const next = Math.min(page + 1, totalPages - 1);
      setPage(next);
      setPageMap(m => new Map(m).set(activeFeed, next));
      setSelectedStoryIndex(0);
    } else if (input === 'p') {
      const prev = Math.max(page - 1, 0);
      setPage(prev);
      setPageMap(m => new Map(m).set(activeFeed, prev));
      setSelectedStoryIndex(0);
    }

    // Search
    if (input === '/') {
      setSearchActive(true);
      setMode('search');
      setActivePane('stories');
    }

    // Open comments
    if (key.return) {
      const story = activeStories[selectedStoryIndex];
      if (story) openComments(story);
    }

    // Open article URL
    if (input === 'o') {
      const story = activeStories[selectedStoryIndex];
      if (story?.url) openUrl(story.url);
    }

    // Open HN discussion page
    if (input === 'O') {
      const story = activeStories[selectedStoryIndex];
      if (story) openUrl(`https://news.ycombinator.com/item?id=${story.id}`);
    }

    // Refresh
    if (input === 'r') {
      browseResult.refresh();
    }
  }

  function handleCommentsInput(input: string, key: { upArrow: boolean; downArrow: boolean; escape: boolean; ctrl: boolean; return: boolean }) {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      process.exit(0);
    }

    if (key.escape || input === 'q') {
      setMode('browse');
      setCommentStory(null);
      return;
    }

    if (input === 'j' || key.downArrow) {
      setSelectedCommentIndex(i => i + 1);
    } else if (input === 'k' || key.upArrow) {
      setSelectedCommentIndex(i => Math.max(i - 1, 0));
    }

    // Collapse/expand with Space
    if (input === ' ') {
      const visibleComments = buildVisibleComments(commentList, collapsedIds);
      const comment = visibleComments[selectedCommentIndex];
      if (!comment) return;
      setCollapsedIds(prev => {
        const next = new Set(prev);
        if (next.has(comment.id)) next.delete(comment.id);
        else next.add(comment.id);
        return next;
      });
    }

    // Open article
    if (input === 'o' && commentStory?.url) {
      openUrl(commentStory.url);
    }

    // Open HN discussion page
    if (input === 'O' && commentStory) {
      openUrl(`https://news.ycombinator.com/item?id=${commentStory.id}`);
    }
  }

  // Render
  if (mode === 'comments' && commentStory) {
    return (
      <CommentView
        story={commentStory}
        comments={commentList}
        collapsedIds={collapsedIds}
        selectedIndex={selectedCommentIndex}
        isLoading={commentLoading}
      />
    );
  }

  return (
    <Layout
      activeFeed={activeFeed}
      page={page}
      totalPages={totalPages}
      isLoading={isLoading}
      stories={activeStories}
      selectedStoryIndex={selectedStoryIndex}
      readIds={readIds}
      searchActive={searchActive}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={() => {
        setActivePane('stories');
      }}
      onSearchCancel={() => {
        setSearchActive(false);
        setSearchQuery('');
        setMode('browse');
        setSelectedStoryIndex(0);
      }}
      activePane={activePane}
      previewContent={previewContent}
      articleScrollOffset={articleScrollOffset}
      cols={cols}
      rows={rows}
      mode={mode}
    />
  );
}

function buildVisibleComments(comments: Comment[], collapsedIds: Set<number>): Comment[] {
  const result: Comment[] = [];
  let hideUntilDepth: number | null = null;

  for (const c of comments) {
    if (hideUntilDepth !== null) {
      if (c.depth > hideUntilDepth) continue;
      hideUntilDepth = null;
    }
    const collapsed = collapsedIds.has(c.id);
    result.push({ ...c, collapsed });
    if (collapsed) hideUntilDepth = c.depth;
  }

  return result;
}
