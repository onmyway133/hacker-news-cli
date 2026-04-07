import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Story, Comment as CommentType } from '../types.js';
import { calcScrollOffset } from '../types.js';
import { Comment } from './Comment.js';
import { StatusBar } from './StatusBar.js';
import { Spinner } from './Spinner.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface Props {
  story: Story;
  comments: CommentType[];
  collapsedIds: Set<number>;
  selectedIndex: number;
  isLoading: boolean;
}

export function CommentView({ story, comments, collapsedIds, selectedIndex, isLoading }: Props) {
  const { cols, rows } = useTerminalSize();

  // Build visible comment list (hide children of collapsed parents)
  const visibleComments = useMemo(() => {
    const result: CommentType[] = [];
    let hideUntilDepth: number | null = null;

    for (const c of comments) {
      if (hideUntilDepth !== null) {
        if (c.depth > hideUntilDepth) continue;
        hideUntilDepth = null;
      }
      const collapsed = collapsedIds.has(c.id);
      result.push({ ...c, collapsed });
      if (collapsed) {
        hideUntilDepth = c.depth;
      }
    }
    return result;
  }, [comments, collapsedIds]);

  // Count children for each visible comment (for collapsed display)
  const childCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const c of visibleComments) {
      if (c.collapsed) {
        // Count how many comments in original list are descendants
        let count = 0;
        let found = false;
        for (const orig of comments) {
          if (orig.id === c.id) { found = true; continue; }
          if (found) {
            if (orig.depth > c.depth) count++;
            else break;
          }
        }
        counts.set(c.id, count);
      } else {
        counts.set(c.id, 0);
      }
    }
    return counts;
  }, [visibleComments, comments]);

  // Status bar height = 3 (border + line + border)
  const statusBarHeight = 3;
  // Header: breadcrumb(1) + divider(1) = 2
  const headerHeight = 2;
  const contentHeight = rows - statusBarHeight - headerHeight;
  const visibleCount = Math.max(2, contentHeight);

  const scrollOffset = calcScrollOffset(selectedIndex, visibleCount, visibleComments.length);
  const displayComments = visibleComments.slice(scrollOffset, scrollOffset + visibleCount);

  const titleTrunc = story.title.length > cols - 20
    ? story.title.slice(0, cols - 22) + '..'
    : story.title;

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      {/* Breadcrumb */}
      <Box paddingX={1} flexDirection="row" gap={1}>
        <Text color="gray">HN</Text>
        <Text color="gray">›</Text>
        <Text color="cyan" bold>{titleTrunc}</Text>
        <Text color="gray">›</Text>
        {isLoading
          ? <Spinner label="loading comments..." />
          : <Text color="gray">Comments ({visibleComments.length})</Text>
        }
      </Box>

      {/* Divider */}
      <Box paddingX={1}>
        <Text color="gray">{'─'.repeat(Math.max(0, cols - 2))}</Text>
      </Box>

      {/* Comments */}
      <Box flexDirection="column" height={contentHeight} overflow="hidden">
        {isLoading && comments.length === 0 && (
          <Box paddingX={2} paddingY={1}>
            <Spinner label="fetching comments..." />
          </Box>
        )}

        {!isLoading && visibleComments.length === 0 && (
          <Box paddingX={2} paddingY={1}>
            <Text color="gray">No comments yet.</Text>
          </Box>
        )}

        {displayComments.map((comment, i) => (
          <Comment
            key={comment.id}
            comment={comment}
            isSelected={scrollOffset + i === selectedIndex}
            childCount={childCounts.get(comment.id) ?? 0}
            cols={cols}
          />
        ))}
      </Box>

      {/* Status bar */}
      <StatusBar mode="comments" activePane="stories" />
    </Box>
  );
}
