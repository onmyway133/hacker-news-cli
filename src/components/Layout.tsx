import React from 'react';
import { Box } from 'ink';
import type { Feed, Story, PreviewContent, AppMode } from '../types.js';
import { FeedTabs } from './FeedTabs.js';
import { SearchBar } from './SearchBar.js';
import { StoryList } from './StoryList.js';
import { Preview } from './Preview.js';
import { StatusBar } from './StatusBar.js';

interface Props {
  // Feed
  activeFeed: Feed;
  page: number;
  totalPages: number;
  isLoading: boolean;
  // Stories
  stories: Story[];
  selectedStoryIndex: number;
  readIds: Set<number>;
  // Search
  searchActive: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  onSearchCancel: () => void;
  // Preview
  activePane: 'stories' | 'preview';
  previewContent: PreviewContent;
  articleScrollOffset: number;
  // Layout
  cols: number;
  rows: number;
  mode: AppMode;
}

export function Layout({
  activeFeed, page, totalPages, isLoading,
  stories, selectedStoryIndex, readIds,
  searchActive, searchQuery, onSearchChange, onSearchSubmit, onSearchCancel,
  activePane, previewContent, articleScrollOffset,
  cols, rows, mode,
}: Props) {
  const selectedStory = stories[selectedStoryIndex] ?? null;

  // Responsive pane widths
  const showPreview = cols >= 60;
  const leftWidth = showPreview
    ? Math.floor(cols * 0.40)
    : cols;
  const rightWidth = showPreview ? cols - leftWidth : 0;

  // Heights: tabs(1) + searchbar(1 if active) + statusbar(3) + borders = ~6 fixed
  const fixedRows = 1 + (searchActive ? 1 : 0) + 3;
  const contentHeight = Math.max(4, rows - fixedRows);

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      {/* Feed tabs */}
      <FeedTabs
        activeFeed={activeFeed}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        isSearchActive={searchActive}
      />

      {/* Search bar (inline, shown when active) */}
      {searchActive && (
        <Box paddingX={1}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            onCancel={onSearchCancel}
          />
        </Box>
      )}

      {/* Main content panes */}
      <Box flexDirection="row" height={contentHeight}>
        <StoryList
          stories={stories}
          selectedIndex={selectedStoryIndex}
          readIds={readIds}
          width={leftWidth}
          height={contentHeight}
          isActive={activePane === 'stories'}
        />

        {showPreview && (
          <Preview
            story={selectedStory}
            content={previewContent}
            scrollOffset={articleScrollOffset}
            width={rightWidth}
            height={contentHeight}
            isActive={activePane === 'preview'}
          />
        )}
      </Box>

      {/* Status bar */}
      <StatusBar mode={mode} activePane={activePane} />
    </Box>
  );
}
