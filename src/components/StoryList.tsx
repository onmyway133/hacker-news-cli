import React from 'react';
import { Box, Text } from 'ink';
import type { Story } from '../types.js';
import { scoreColor, timeAgo, calcScrollOffset } from '../types.js';

interface Props {
  stories: Story[];
  selectedIndex: number;
  readIds: Set<number>;
  width: number;
  height: number;
  isActive: boolean;
}

export function StoryList({ stories, selectedIndex, readIds, width, height, isActive }: Props) {
  // Fixed rows inside border: title(1) + separator(1) + scroll-indicator(1) = 3
  // Each story takes 2 lines
  const visibleCount = Math.max(2, Math.floor((height - 5) / 2));
  const scrollOffset = calcScrollOffset(selectedIndex, visibleCount, stories.length);
  const visible = stories.slice(scrollOffset, scrollOffset + visibleCount);

  const innerWidth = width - 4;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderColor={isActive ? 'white' : 'gray'}
      overflow="hidden"
    >
      {/* Title row with search hint */}
      <Box paddingX={1} justifyContent="space-between">
        <Text bold color={isActive ? 'white' : 'gray'}>
          STORIES {stories.length > 0 ? `(${stories.length})` : ''}
        </Text>
        {isActive && <Text color="gray"> /search </Text>}
      </Box>

      {/* Separator */}
      <Text> </Text>

      {visible.map((story, i) => {
        const idx = scrollOffset + i;
        const isSelected = idx === selectedIndex;
        const isRead = readIds.has(story.id);
        const color = scoreColor(story.score);

        const prefix = `${idx + 1}. `;
        const maxTitleLen = Math.max(10, innerWidth - 4);
        const title = story.title.length > maxTitleLen
          ? story.title.slice(0, maxTitleLen - 2) + '..'
          : story.title;

        const typeTag = story.type === 'ask' ? ' [Ask]'
          : story.type === 'show' ? ' [Show]'
          : story.type === 'job' ? ' [Job]'
          : '';

        return (
          <Box key={story.id} flexDirection="column" paddingX={1}>
            {/* Line 1: indicator + number + title */}
            <Box flexDirection="row">
              <Text
                color={isSelected ? 'black' : isRead ? 'gray' : 'white'}
                backgroundColor={isSelected ? 'blue' : undefined}
                bold={isSelected}
                dimColor={isRead && !isSelected}
              >
                {isSelected ? '▶ ' : '  '}{prefix}{title}{typeTag}
              </Text>
            </Box>
            {/* Line 2: score + author + time + comments */}
            <Box flexDirection="row" paddingLeft={3}>
              <Text
                color={isSelected ? 'black' : isRead ? 'gray' : color}
                backgroundColor={isSelected ? 'blue' : undefined}
                dimColor={isRead && !isSelected}
              >
                ▲{story.score}
              </Text>
              <Text
                color={isSelected ? 'black' : 'gray'}
                backgroundColor={isSelected ? 'blue' : undefined}
              >
                {'  '}by {story.by}  ·  {timeAgo(story.time)}  ·  {story.descendants ?? 0}c
              </Text>
            </Box>
          </Box>
        );
      })}

      {stories.length === 0 && (
        <Box paddingX={2}>
          <Text color="gray">No stories</Text>
        </Box>
      )}

      {/* Scroll indicator */}
      {stories.length > visibleCount && (
        <Box paddingX={1}>
          <Text color="gray" dimColor>
            {' '}↑↓ {scrollOffset + 1}–{Math.min(scrollOffset + visibleCount, stories.length)}/{stories.length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
