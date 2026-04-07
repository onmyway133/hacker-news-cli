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
        <Text bold color="yellow">HN</Text>
        <Text color="gray">·</Text>
        {FEEDS.map((feed, i) => (
          <React.Fragment key={feed}>
            {i > 0 && <Text color="gray"> </Text>}
            <Text
              color={feed === activeFeed && !isSearchActive ? 'white' : 'gray'}
              bold={feed === activeFeed && !isSearchActive}
            >
              {feed === activeFeed && !isSearchActive
                ? `[${FEED_LABELS[feed]}]`
                : FEED_LABELS[feed]}
            </Text>
          </React.Fragment>
        ))}
      </Box>
      <Box flexDirection="row" gap={2}>
        {isSearchActive && <Text color="yellow" bold>SEARCH</Text>}
        {!isSearchActive && (
          <Text color="gray">p.{page + 1}/{totalPages}</Text>
        )}
        {isLoading && <Spinner />}
      </Box>
    </Box>
  );
}
