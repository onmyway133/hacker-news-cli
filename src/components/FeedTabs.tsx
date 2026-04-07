import React from 'react';
import { Box, Text } from 'ink';
import type { Feed } from '../types.js';
import { FEEDS, FEED_LABELS } from '../types.js';
import { Spinner } from './Spinner.js';

interface Props {
  activeFeed: Feed;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isSearchActive: boolean;
}

export function FeedTabs({ activeFeed, page, totalPages, isLoading, isSearchActive }: Props) {
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <Box flexDirection="row" gap={1}>
        {FEEDS.map(feed => (
          <Text
            key={feed}
            color={feed === activeFeed && !isSearchActive ? 'cyan' : 'gray'}
            bold={feed === activeFeed && !isSearchActive}
          >
            {feed === activeFeed && !isSearchActive ? `[${FEED_LABELS[feed]}]` : FEED_LABELS[feed]}
          </Text>
        ))}
      </Box>
      <Box flexDirection="row" gap={1}>
        {!isSearchActive && (
          <Text color="gray">
            p.{page + 1}/{totalPages}
          </Text>
        )}
        {isSearchActive && <Text color="yellow">SEARCH</Text>}
        {isLoading && <Spinner />}
      </Box>
    </Box>
  );
}
