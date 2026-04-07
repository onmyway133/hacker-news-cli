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
  // Each story takes 2 lines; reserve 2 for border+title
  const visibleCount = Math.max(2, Math.floor((height - 2) / 2));
  const scrollOffset = calcScrollOffset(selectedIndex, visibleCount, stories.length);
  const visible = stories.slice(scrollOffset, scrollOffset + visibleCount);

  // Available width inside border (2 chars for left+right border, 1 for padding each side)
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
      <Box paddingX={1}>
        <Text bold color={isActive ? 'white' : 'gray'}>
          STORIES {stories.length > 0 ? `(${stories.length})` : ''}
        </Text>
      </Box>

      {visible.map((story, i) => {
        const idx = scrollOffset + i;
        const isSelected = idx === selectedIndex;
        const isRead = readIds.has(story.id);
        const color = scoreColor(story.score);

        // Truncate title to fit
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
                backgroundColor={isSelected ? 'cyan' : undefined}
                bold={isSelected}
                dimColor={isRead && !isSelected}
              >
                {isSelected ? '▶' : ' '} {prefix}{title}{typeTag}
              </Text>
            </Box>
            {/* Line 2: score + author + time + comments */}
            <Box flexDirection="row" paddingLeft={3}>
              <Text
                color={isSelected ? 'black' : isRead ? 'gray' : color}
                backgroundColor={isSelected ? 'cyan' : undefined}
                dimColor={isRead && !isSelected}
              >
                ▲{story.score}
              </Text>
              <Text
                color={isSelected ? 'black' : 'gray'}
                backgroundColor={isSelected ? 'cyan' : undefined}
              >
                {' '}by {story.by}  {timeAgo(story.time)}  {story.descendants}c
              </Text>
            </Box>
          </Box>
        );
      })}

      {stories.length === 0 && (
        <Box paddingX={2} paddingY={1}>
          <Text color="gray">No stories</Text>
        </Box>
      )}

      {/* Scroll indicator */}
      {stories.length > visibleCount && (
        <Box paddingX={1}>
          <Text color="gray" dimColor>
            {scrollOffset + visibleCount < stories.length ? '▼ more' : '─ end'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
