import React from 'react';
import { Box, Text } from 'ink';
import type { AppMode } from '../types.js';

interface KeyProps {
  k: string;
  label: string;
}

function Key({ k, label }: KeyProps) {
  return (
    <Text color="gray">
      <Text color="white" bold>{k}</Text>:{label}
    </Text>
  );
}

interface Props {
  mode: AppMode;
  activePane: 'stories' | 'preview';
}

export function StatusBar({ mode, activePane }: Props) {
  return (
    <Box paddingX={1} borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray">
      {mode === 'comments' && (
        <Box flexDirection="row" gap={3}>
          <Text color="yellow" bold>[COMMENTS]</Text>
          <Key k="j/k" label="move" />
          <Key k="Space" label="collapse" />
          <Key k="Esc" label="back" />
          <Key k="o" label="open article" />
          <Key k="O" label="open HN" />
          <Key k="q" label="quit" />
        </Box>
      )}
      {mode === 'search' && (
        <Box flexDirection="row" gap={3}>
          <Text color="yellow" bold>[SEARCH]</Text>
          <Text color="gray">type to search Algolia</Text>
          <Key k="Esc" label="cancel" />
          <Key k="↵" label="open comments" />
          <Key k="o" label="open article" />
        </Box>
      )}
      {mode === 'browse' && (
        <Box flexDirection="row" gap={3}>
          <Key k="j/k" label="move" />
          <Key k="Tab" label={activePane === 'stories' ? 'preview→' : '←stories'} />
          <Key k="[/]" label="feed" />
          <Key k="n/p" label="page" />
          <Key k="/" label="search" />
          <Key k="↵" label="comments" />
          <Key k="o" label="open" />
          <Key k="q" label="quit" />
        </Box>
      )}
    </Box>
  );
}
