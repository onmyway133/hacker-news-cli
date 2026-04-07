import React from 'react';
import { Box, Text } from 'ink';
import type { Comment as CommentType } from '../types.js';
import { timeAgo } from '../types.js';

// Depth colors cycle to help visually distinguish nesting levels
const DEPTH_COLORS = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'white', 'gray'];

function depthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<i>(.*?)<\/i>/gis, '$1')
    .replace(/<b>(.*?)<\/b>/gis, '$1')
    .replace(/<code>(.*?)<\/code>/gis, '`$1`')
    .replace(/<pre>(.*?)<\/pre>/gis, '\n$1\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '$2 [$1]')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface Props {
  comment: CommentType;
  isSelected: boolean;
  childCount: number;
  cols: number;
}

export function Comment({ comment, isSelected, childCount, cols }: Props) {
  const indent = '  '.repeat(Math.min(comment.depth, 8));
  const indentLen = indent.length;
  const color = depthColor(comment.depth);
  const bg = isSelected ? 'blue' : undefined;
  const textColor = isSelected ? 'white' : undefined;

  if (comment.collapsed) {
    return (
      <Box paddingLeft={indentLen}>
        <Text color={isSelected ? 'white' : 'gray'} backgroundColor={bg} dimColor={!isSelected}>
          {'▶ '}
          <Text bold color={isSelected ? 'white' : color}>{comment.by}</Text>
          {'  '}
          {timeAgo(comment.time)}
          {childCount > 0 ? `  [${childCount} replies]` : ''}
        </Text>
      </Box>
    );
  }

  const text = stripHtml(comment.text);
  const innerWidth = Math.max(20, cols - indentLen - 4);

  return (
    <Box flexDirection="column" paddingLeft={indentLen}>
      {/* Header line */}
      <Text color={isSelected ? 'white' : color} backgroundColor={bg} bold={isSelected}>
        {'▼ '}
        <Text bold>{comment.by}</Text>
        {'  '}
        <Text dimColor={!isSelected}>{timeAgo(comment.time)}</Text>
      </Text>
      {/* Body */}
      <Box paddingLeft={2}>
        <Text color={textColor ?? 'white'} backgroundColor={bg} wrap="wrap">
          {text.slice(0, innerWidth * 8)}
        </Text>
      </Box>
    </Box>
  );
}
