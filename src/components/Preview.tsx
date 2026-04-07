import React from 'react';
import { Box, Text } from 'ink';
import type { Story, PreviewContent } from '../types.js';
import { scoreColor, timeAgo } from '../types.js';
import { Spinner } from './Spinner.js';

interface Props {
  story: Story | null;
  content: PreviewContent;
  scrollOffset: number;
  width: number;
  height: number;
  isActive: boolean;
}

export function Preview({ story, content, scrollOffset, width, height, isActive }: Props) {
  if (!story) {
    return (
      <Box
        flexDirection="column"
        width={width}
        height={height}
        borderStyle="single"
        borderColor="gray"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="gray">Select a story to preview</Text>
      </Box>
    );
  }

  const innerWidth = width - 4;
  // Lines available for article text (reserve: border(2) + title(1) + metadata(1) + divider(1) + padding(1))
  const textHeight = Math.max(2, height - 7);

  const title = story.title.length > innerWidth
    ? story.title.slice(0, innerWidth - 2) + '..'
    : story.title;

  const color = scoreColor(story.score);

  const domain = story.url
    ? (() => { try { return new URL(story.url).hostname.replace('www.', ''); } catch { return story.url; } })()
    : null;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="single"
      borderColor={isActive ? 'white' : 'gray'}
      overflow="hidden"
    >
      {/* Header */}
      <Box paddingX={1} flexDirection="column">
        <Text bold color={isActive ? 'white' : 'gray'} wrap="truncate">
          {title}
        </Text>
        <Box flexDirection="row" gap={2}>
          <Text color={color} bold>▲{story.score}</Text>
          <Text color="gray">by {story.by}</Text>
          <Text color="gray">{timeAgo(story.time)}</Text>
          <Text color="gray">{story.descendants}c</Text>
          {domain && <Text color="gray" dimColor>{domain}</Text>}
        </Box>
      </Box>

      {/* Divider */}
      <Box paddingX={1}>
        <Text color="gray">{'─'.repeat(Math.max(0, innerWidth))}</Text>
      </Box>

      {/* Content area */}
      <Box flexDirection="column" paddingX={1} height={textHeight} overflow="hidden">
        {content.kind === 'loading' && (
          <Box>
            <Spinner label="fetching article..." />
          </Box>
        )}

        {content.kind === 'error' && (
          <Box flexDirection="column" gap={1}>
            <Text color="gray" dimColor>Article unavailable: {content.message}</Text>
            {story.text && (
              <ArticleText
                text={stripHtml(story.text)}
                height={textHeight - 2}
                scrollOffset={scrollOffset}
                innerWidth={innerWidth}
              />
            )}
            {!story.text && (
              <Text color="gray" dimColor>No preview available for this link.</Text>
            )}
          </Box>
        )}

        {content.kind === 'metadata' && story.text && (
          <ArticleText
            text={stripHtml(story.text)}
            height={textHeight}
            scrollOffset={scrollOffset}
            innerWidth={innerWidth}
          />
        )}

        {content.kind === 'metadata' && !story.text && (
          <Text color="gray" dimColor>
            {story.url ? 'Press j/k to scroll once article loads.' : 'No article URL for this story.'}
          </Text>
        )}

        {content.kind === 'article' && (
          <ArticleText
            text={content.text}
            height={textHeight}
            scrollOffset={scrollOffset}
            innerWidth={innerWidth}
          />
        )}
      </Box>

      {/* Scroll hint when preview is active */}
      {isActive && content.kind === 'article' && (
        <Box paddingX={1}>
          <Text color="gray" dimColor>j/k to scroll</Text>
        </Box>
      )}
    </Box>
  );
}

interface ArticleTextProps {
  text: string;
  height: number;
  scrollOffset: number;
  innerWidth: number;
}

function ArticleText({ text, height, scrollOffset, innerWidth }: ArticleTextProps) {
  // Word-wrap text into lines of innerWidth
  const allLines = wrapText(text, innerWidth);
  const visibleLines = allLines.slice(scrollOffset, scrollOffset + height);

  return (
    <Box flexDirection="column">
      {visibleLines.map((line, i) => (
        <Text key={i} wrap="truncate" color="white">
          {line || ' '}
        </Text>
      ))}
    </Box>
  );
}

function wrapText(text: string, width: number): string[] {
  if (width <= 0) return text.split('\n');

  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      result.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      if (line.length + word.length + 1 <= width) {
        line = line ? `${line} ${word}` : word;
      } else {
        if (line) result.push(line);
        // If word itself is longer than width, hard-break it
        if (word.length > width) {
          for (let j = 0; j < word.length; j += width) {
            result.push(word.slice(j, j + width));
          }
          line = '';
        } else {
          line = word;
        }
      }
    }
    if (line) result.push(line);
  }
  return result;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
