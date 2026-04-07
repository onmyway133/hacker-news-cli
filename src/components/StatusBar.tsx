import React from 'react';
import { Box, Text } from 'ink';
import type { AppMode } from '../types.js';

interface KeyProps {
  k: string;
  label: string;
}

function Key({ k, label }: KeyProps) {
  return (
    <Text>
      <Text color="cyan" bold>{k}</Text>
      <Text color="gray">:{label}</Text>
    </Text>
  );
}

function Sep() {
  return <Text color="gray">  </Text>;
}

interface Props {
  mode: AppMode;
  activePane: 'stories' | 'preview';
}

export function StatusBar({ mode, activePane }: Props) {
  return (
    <Box paddingX={1} borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray">
      {mode === 'comments' && (
        <Box flexDirection="row" flexWrap="wrap">
          <Text color="yellow" bold>[COMMENTS]</Text>
          <Sep />
          <Key k="j/k" label="move" />
          <Sep />
          <Key k="Space" label="collapse" />
          <Sep />
          <Key k="Esc" label="back" />
          <Sep />
          <Key k="o" label="open article" />
          <Sep />
          <Key k="O" label="open HN" />
          <Sep />
          <Key k="q" label="quit" />
        </Box>
      )}
      {mode === 'search' && (
        <Box flexDirection="row" flexWrap="wrap">
          <Text color="yellow" bold>[SEARCH]</Text>
          <Sep />
          <Text color="gray">type to search Algolia</Text>
          <Sep />
          <Key k="Esc" label="cancel" />
          <Sep />
          <Key k="Enter" label="open comments" />
          <Sep />
          <Key k="o" label="open article" />
        </Box>
      )}
      {mode === 'browse' && (
        <Box flexDirection="row" flexWrap="wrap">
          <Text color="yellow" bold>[BROWSE]</Text>
          <Sep />
          <Key k="j/k" label="move" />
          <Sep />
          <Key k="Tab" label={activePane === 'stories' ? 'preview→' : '←stories'} />
          <Sep />
          <Key k="[/]" label="feed" />
          <Sep />
          <Key k="n/p" label="page" />
          <Sep />
          <Key k="/" label="search" />
          <Sep />
          <Key k="Enter" label="comments" />
          <Sep />
          <Key k="o" label="open article" />
          <Sep />
          <Key k="O" label="open HN" />
          <Sep />
          <Key k="q" label="quit" />
        </Box>
      )}
    </Box>
  );
}
