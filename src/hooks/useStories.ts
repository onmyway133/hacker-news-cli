import { useState, useEffect, useCallback } from 'react';
import type { Feed, Story } from '../types.js';
import { fetchFeed, searchStories } from '../api/algolia.js';
import type { HNCache } from '../cache/db.js';

interface UseStoriesResult {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  refresh: () => void;
}

export function useStories(
  feed: Feed,
  page: number,
  cache: HNCache
): UseStoriesResult {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Show cached data immediately while fetching
    const cached = cache.getStories(feed, page);
    if (cached) {
      setStories(cached.stories);
      setTotalPages(cached.totalPages);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchFeed(feed, page)
      .then(({ stories: fresh, totalPages: total }) => {
        if (cancelled) return;
        cache.setStories(feed, page, fresh, total);
        setStories(fresh);
        setTotalPages(total);
        setError(null);
      })
      .catch(e => {
        if (cancelled) return;
        setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [feed, page, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken(t => t + 1);
  }, []);

  return { stories, isLoading, error, totalPages, refresh };
}

export function useSearch(
  query: string,
  cache: HNCache
): UseStoriesResult {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!query.trim()) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      searchStories(query)
        .then(({ stories: results }) => {
          if (cancelled) return;
          setStories(results);
          setError(null);
        })
        .catch(e => {
          if (cancelled) return;
          setError((e as Error).message);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, refreshToken]);

  const refresh = useCallback(() => setRefreshToken(t => t + 1), []);

  return { stories, isLoading, error, totalPages: 1, refresh };
}
